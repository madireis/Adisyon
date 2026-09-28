import type { PosDatabase } from '@/lib/db';
import { getLocalServerBaseUrl } from '@/lib/localNetwork';
import mqtt, { type MqttClient } from 'mqtt';

// ─────────────────────────────────────────────────────────────
// CLIENT IDENTIFICATION
// ─────────────────────────────────────────────────────────────

const CLIENT_ID: string = (() => {
  if (typeof sessionStorage !== 'undefined') {
    let id = sessionStorage.getItem('wots_pos_sync_client_id');
    if (!id) {
      id = 'cli_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
      sessionStorage.setItem('wots_pos_sync_client_id', id);
    }
    return id;
  }
  return 'cli_' + Math.random().toString(36).substring(2, 9);
})();

// Supported synchronized tables in database
export const SYNC_TABLES = [
  'floors',
  'tables',
  'categories',
  'menuItems',
  'orders',
  'payments',
  'cashTransactions',
  'kitchenTickets',
  'staff',
  'inventoryItems',
  'recipes',
  'customers',
  'reservations',
  'auditLogs',
  'onlineOrders',
] as const;

export type SyncTableName = typeof SYNC_TABLES[number];

// Flag to prevent echo loops when applying mutations received from remote/other tabs
let isApplyingRemoteSync = false;
let activeDbInstance: PosDatabase | null = null;

// Message deduplication cache across multiple transports (MQTT, BroadcastChannel, SSE)
const processedMessageIds = new Set<string>();

function markAndCheckProcessed(msgId?: string): boolean {
  if (!msgId) return false;
  if (processedMessageIds.has(msgId)) return true;
  processedMessageIds.add(msgId);
  if (processedMessageIds.size > 500) {
    const firstItem = processedMessageIds.values().next().value;
    if (firstItem) processedMessageIds.delete(firstItem);
  }
  return false;
}

// ─────────────────────────────────────────────────────────────
// CLOUD SYNC CONFIGURATION (MQTT & CLOUD SSE)
// ─────────────────────────────────────────────────────────────

const MQTT_BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
];

const MQTT_TOPIC_ROOT = 'wots_cafe_pos_sync/madireis_restaurant';
const TOPIC_MUTATION = `${MQTT_TOPIC_ROOT}/mutation`;
const TOPIC_SNAPSHOT_REQ = `${MQTT_TOPIC_ROOT}/snapshot_request`;
const TOPIC_SNAPSHOT_RES = `${MQTT_TOPIC_ROOT}/snapshot_response`;

const CLOUD_FALLBACK_URL = 'https://ntfy.sh/wots_pos_sync_madireis_restaurant';

// ─────────────────────────────────────────────────────────────
// AUDIO NOTIFICATIONS (Web Audio API Synthesizer - Zero Assets)
// ─────────────────────────────────────────────────────────────

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedAudioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        sharedAudioCtx = new AudioContextClass();
      }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

// Automatically unlock Web Audio on first user gesture
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    getAudioContext();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
}

export function playSyncSound(type: 'kitchen_order' | 'order_ready') {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (type === 'kitchen_order') {
      // Pleasant two-tone kitchen order bell (D5 -> A5)
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'order_ready') {
      // Cheerful ready chime (C5 -> E5 -> G5)
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    }
  } catch {
    // Autoplay policy fallback
  }
}

// ─────────────────────────────────────────────────────────────
// LAYER 1: BROWSER BROADCAST CHANNEL (Same device zero-latency)
// ─────────────────────────────────────────────────────────────

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('wots_pos_sync_channel');
  } catch {
    // Unsupported context
  }
}

// ─────────────────────────────────────────────────────────────
// DATA SANITIZER
// ─────────────────────────────────────────────────────────────

function sanitizeSyncItems(tableName: string, items: any[]) {
  if (tableName !== 'tables') return items;
  return items.map((it) => {
    if (it && it.status === 'available') {
      const copy = { ...it };
      delete copy.currentOrderId;
      delete copy.occupiedAt;
      copy.guestCount = 0;
      return copy;
    }
    return it;
  });
}

// ─────────────────────────────────────────────────────────────
// APPLY REMOTE CHANGES (FROM MQTT, SSE, OR BROADCAST)
// ─────────────────────────────────────────────────────────────

export async function applyRemoteSync(
  db: PosDatabase,
  changes: Record<string, any[]>,
  deleted?: Record<string, string[]>,
  senderId?: string
) {
  if (senderId === CLIENT_ID) return;

  isApplyingRemoteSync = true;
  try {
    // Upsert incoming items
    for (const [tableName, items] of Object.entries(changes || {})) {
      if (!Array.isArray(items) || items.length === 0) continue;
      const table = db.table(tableName);
      if (table) {
        await table.bulkPut(sanitizeSyncItems(tableName, items));
      }
    }

    // Delete deleted items
    for (const [tableName, ids] of Object.entries(deleted || {})) {
      if (!Array.isArray(ids) || ids.length === 0) continue;
      const table = db.table(tableName);
      if (table) {
        await table.bulkDelete(ids);
      }
    }

    // Play sounds if relevant
    if (changes.kitchenTickets) {
      const hasNew = changes.kitchenTickets.some((t) => t.status === 'new' || t.status === 'pending');
      const hasReady = changes.kitchenTickets.some((t) => t.status === 'ready');
      if (hasNew) playSyncSound('kitchen_order');
      if (hasReady) playSyncSound('order_ready');
    }
  } catch (err) {
    console.error('[Sync Engine] Error applying remote sync:', err);
  } finally {
    isApplyingRemoteSync = false;
  }
}

// ─────────────────────────────────────────────────────────────
// LAYER 2: MQTT OVER SECURE WEBSOCKETS (Cloud Cross-Device)
// ─────────────────────────────────────────────────────────────

let mqttClient: MqttClient | null = null;
let currentBrokerIndex = 0;
let isMqttConnected = false;

function setupMqttSync(db: PosDatabase) {
  if (typeof window === 'undefined') return;

  function connectBroker() {
    try {
      const brokerUrl = MQTT_BROKERS[currentBrokerIndex];
      const client = mqtt.connect(brokerUrl, {
        clientId: 'wots_' + CLIENT_ID,
        clean: true,
        connectTimeout: 8000,
        reconnectPeriod: 4000,
        keepalive: 30,
      });

      mqttClient = client;

      client.on('connect', () => {
        isMqttConnected = true;
        console.log('[Sync Engine] Connected to MQTT broker:', brokerUrl);

        client.subscribe([TOPIC_MUTATION, TOPIC_SNAPSHOT_REQ, TOPIC_SNAPSHOT_RES], (err) => {
          if (!err) {
            // Request snapshot of active tables, orders, kitchen tickets from active peers
            setTimeout(() => {
              requestNetworkSnapshot();
            }, 600);
          }
        });
      });

      client.on('message', (topic, message) => {
        try {
          const payload = JSON.parse(message.toString());
          handleIncomingNetworkMessage(db, topic, payload);
        } catch (e) {
          console.warn('[Sync Engine] Failed to parse MQTT message:', e);
        }
      });

      client.on('error', (err) => {
        console.warn('[Sync Engine] MQTT error:', err?.message || err);
      });

      client.on('close', () => {
        isMqttConnected = false;
      });

      client.on('offline', () => {
        isMqttConnected = false;
        // If current broker went offline, cycle to backup
        currentBrokerIndex = (currentBrokerIndex + 1) % MQTT_BROKERS.length;
      });
    } catch (e) {
      console.warn('[Sync Engine] MQTT initialization error:', e);
    }
  }

  connectBroker();
}

/**
 * Handle incoming messages from MQTT or Cloud SSE
 */
function handleIncomingNetworkMessage(db: PosDatabase, topic: string, payload: any) {
  if (!payload || payload.senderId === CLIENT_ID) return;

  // Deduplicate messages across transports
  if (payload.msgId && markAndCheckProcessed(payload.msgId)) {
    return;
  }

  // 1. Regular database mutation (put/delete)
  if (topic === TOPIC_MUTATION || payload.type === 'MUTATION') {
    if (payload.changes || payload.deleted) {
      applyRemoteSync(db, payload.changes, payload.deleted, payload.senderId);
    }
    return;
  }

  // 2. Snapshot Request from newly joined device
  if (topic === TOPIC_SNAPSHOT_REQ || payload.type === 'REQUEST_SNAPSHOT') {
    respondToSnapshotRequest(db, payload.senderId);
    return;
  }

  // 3. Snapshot Response received from an existing peer
  if (topic === TOPIC_SNAPSHOT_RES || payload.type === 'SNAPSHOT_RESPONSE') {
    if (payload.targetId === CLIENT_ID && payload.data) {
      console.log('[Sync Engine] Applying snapshot from peer:', payload.senderId);
      applyRemoteSync(db, payload.data, undefined, payload.senderId);
    }
    return;
  }
}

/**
 * Request latest active state from existing peers
 */
function requestNetworkSnapshot() {
  if (!mqttClient || !isMqttConnected) return;

  const req = {
    msgId: 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
    type: 'REQUEST_SNAPSHOT',
    senderId: CLIENT_ID,
    timestamp: Date.now(),
  };

  try {
    mqttClient.publish(TOPIC_SNAPSHOT_REQ, JSON.stringify(req), { qos: 1 });
  } catch {}
}

/**
 * Respond to a snapshot request with active orders, tables, and tickets
 */
async function respondToSnapshotRequest(db: PosDatabase, targetId: string) {
  if (!mqttClient || !isMqttConnected || !targetId) return;

  try {
    const activeTables = await db.table('tables').where('status').notEqual('available').toArray();
    const activeOrders = await db.orders.where('status').anyOf(['open', 'sent', 'preparing', 'ready', 'served']).toArray();
    const activeTickets = await db.kitchenTickets.where('status').anyOf(['new', 'preparing', 'ready']).toArray();

    if (activeTables.length > 0 || activeOrders.length > 0 || activeTickets.length > 0) {
      const msgId = 'res_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      markAndCheckProcessed(msgId);

      const resPayload = {
        msgId,
        type: 'SNAPSHOT_RESPONSE',
        targetId,
        senderId: CLIENT_ID,
        data: {
          tables: activeTables,
          orders: activeOrders,
          kitchenTickets: activeTickets,
        },
        timestamp: Date.now(),
      };

      mqttClient.publish(TOPIC_SNAPSHOT_RES, JSON.stringify(resPayload), { qos: 1 });
    }
  } catch (e) {
    console.warn('[Sync Engine] Error sending snapshot response:', e);
  }
}

// ─────────────────────────────────────────────────────────────
// LAYER 3: CLOUD FALLBACK SSE (ntfy.sh - 100% Port 443 Compatible)
// ─────────────────────────────────────────────────────────────

let cloudEventSource: EventSource | null = null;

function setupCloudFallbackSSE(db: PosDatabase) {
  if (typeof window === 'undefined' || !window.EventSource) return;

  try {
    // ?since=5s drops stale messages and connects directly to live stream
    cloudEventSource = new EventSource(`${CLOUD_FALLBACK_URL}/sse?since=5s`);

    cloudEventSource.onmessage = (e) => {
      try {
        const ntfyData = JSON.parse(e.data);
        if (ntfyData.event === 'message' && ntfyData.message) {
          const payload = JSON.parse(ntfyData.message);
          handleIncomingNetworkMessage(db, TOPIC_MUTATION, payload);
        }
      } catch {}
    };

    cloudEventSource.onerror = () => {
      // Auto-reconnects
    };
  } catch {}
}

// ─────────────────────────────────────────────────────────────
// LAYER 4: LOCAL NODE SERVER SSE & SYNC (When running server.js)
// ─────────────────────────────────────────────────────────────

let localEventSourceInstance: EventSource | null = null;

function setupLocalServerSSE(db: PosDatabase) {
  if (typeof window === 'undefined' || !window.EventSource) return;

  const baseUrl = getLocalServerBaseUrl();
  if (!baseUrl) return; // Not running on local Node server

  try {
    if (localEventSourceInstance) {
      localEventSourceInstance.close();
    }

    localEventSourceInstance = new EventSource(`${baseUrl}/api/sync/stream`);

    localEventSourceInstance.addEventListener('sync', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.senderId !== CLIENT_ID) {
          if (payload.msgId && markAndCheckProcessed(payload.msgId)) return;
          applyRemoteSync(db, payload.changes, payload.deleted, payload.senderId);
        }
      } catch (err) {
        console.error('[Sync Engine] Failed to parse local SSE event:', err);
      }
    });

    localEventSourceInstance.onerror = () => {};
  } catch {}
}

// ─────────────────────────────────────────────────────────────
// CLIENT-SIDE BATCHING & MULTI-TRANSPORT DISPATCHER
// ─────────────────────────────────────────────────────────────

interface PendingChange {
  table: string;
  type: 'put' | 'delete';
  item?: any;
  id: string;
}

let pendingChanges: PendingChange[] = [];
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function queueChange(change: PendingChange) {
  if (isApplyingRemoteSync) return;
  pendingChanges.push(change);

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    flushPendingChanges();
  }, 35);
}

async function flushPendingChanges() {
  if (pendingChanges.length === 0) return;
  const changesToProcess = [...pendingChanges];
  pendingChanges = [];

  const changes: Record<string, any[]> = {};
  const deleted: Record<string, string[]> = {};

  for (const c of changesToProcess) {
    if (c.type === 'put' && c.item) {
      if (!changes[c.table]) changes[c.table] = [];
      const idx = changes[c.table].findIndex((x) => x.id === c.id);
      if (idx >= 0) {
        changes[c.table][idx] = c.item;
      } else {
        changes[c.table].push(c.item);
      }
    } else if (c.type === 'delete') {
      if (!deleted[c.table]) deleted[c.table] = [];
      if (!deleted[c.table].includes(c.id)) {
        deleted[c.table].push(c.id);
      }
    }
  }

  const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  markAndCheckProcessed(msgId);

  const payload = {
    msgId,
    type: 'MUTATION',
    senderId: CLIENT_ID,
    changes,
    deleted,
    timestamp: Date.now(),
  };

  // 1. Broadcast immediately to other tabs on same machine (zero latency)
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(payload);
    } catch {}
  }

  // 2. Publish to Cloud MQTT over TLS WebSocket (< 50ms latency across devices worldwide)
  if (mqttClient && isMqttConnected) {
    try {
      mqttClient.publish(TOPIC_MUTATION, JSON.stringify(payload), { qos: 1 });
    } catch (e) {
      console.warn('[Sync Engine] MQTT publish error:', e);
    }
  }

  // 3. Fallback / Port-443 broadcast via Cloud HTTP stream (ntfy.sh)
  try {
    const jsonStr = JSON.stringify(payload);
    if (jsonStr.length < 3800) {
      fetch(CLOUD_FALLBACK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonStr,
      }).catch(() => {});
    }
  } catch {}

  // 4. Push to local WiFi Node server if running
  try {
    const baseUrl = getLocalServerBaseUrl();
    if (baseUrl) {
      await fetch(`${baseUrl}/api/sync/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
  } catch {}
}

// ─────────────────────────────────────────────────────────────
// INITIALIZATION & DEXIE HOOKS
// ─────────────────────────────────────────────────────────────

let isInitialized = false;

export function initSyncEngine(db: PosDatabase) {
  if (isInitialized) return;
  isInitialized = true;
  activeDbInstance = db;

  // 1. Cross-tab broadcast receiver
  if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
      const data = event.data;
      if (data && data.senderId !== CLIENT_ID) {
        if (data.msgId && markAndCheckProcessed(data.msgId)) return;
        applyRemoteSync(db, data.changes, data.deleted, data.senderId);
      }
    };
  }

  // 2. Attach Dexie hooks to intercept all local writes
  for (const tableName of SYNC_TABLES) {
    const table = db.table(tableName);
    if (!table) continue;

    // Creating hook
    table.hook('creating', function (primKey, obj) {
      const capturedKey = primKey || (obj && obj.id);
      this.onsuccess = function (actualKey) {
        if (isApplyingRemoteSync) return;
        const finalKey = String(actualKey || capturedKey);
        queueChange({
          table: tableName,
          type: 'put',
          id: finalKey,
          item: { ...obj, id: finalKey },
        });
      };
    });

    // Updating hook
    table.hook('updating', function (modifications, primKey, obj) {
      const finalKey = String(primKey || (obj && obj.id));
      this.onsuccess = function () {
        if (isApplyingRemoteSync) return;
        const fullItem = { ...obj, ...modifications, id: finalKey };
        queueChange({
          table: tableName,
          type: 'put',
          id: finalKey,
          item: fullItem,
        });
      };
    });

    // Deleting hook
    table.hook('deleting', function (primKey) {
      const finalKey = String(primKey);
      this.onsuccess = function () {
        if (isApplyingRemoteSync) return;
        queueChange({
          table: tableName,
          type: 'delete',
          id: finalKey,
        });
      };
    });
  }

  // 3. Connect Cloud Real-Time MQTT over WebSocket
  setupMqttSync(db);

  // 4. Connect Cloud Fallback SSE Stream
  setupCloudFallbackSSE(db);

  // 5. Connect Local Server SSE (if available)
  setupLocalServerSSE(db);

  // 6. Initial State Alignment with Local Node Server (if running)
  syncInitialLocalMasterState(db);

  // 7. Periodic Safety Catch-up Poll for Local Node Server
  setInterval(() => {
    checkLocalServerDrift(db);
  }, 8000);
}

/**
 * Align local database with master server on startup (if local server is active)
 */
async function syncInitialLocalMasterState(db: PosDatabase) {
  try {
    const baseUrl = getLocalServerBaseUrl();
    if (!baseUrl) return;

    const res = await fetch(`${baseUrl}/api/sync/state`);
    if (!res.ok) return;

    const { revision, data } = await res.json();

    if (revision > 0 && data) {
      isApplyingRemoteSync = true;
      try {
        for (const tableName of SYNC_TABLES) {
          const items = data[tableName];
          if (Array.isArray(items) && items.length > 0) {
            const table = db.table(tableName);
            if (table) {
              await table.bulkPut(sanitizeSyncItems(tableName, items));
            }
          }
        }
        console.log(`[Sync Engine] Aligned local state with master server (Revision: ${revision})`);
      } finally {
        isApplyingRemoteSync = false;
      }
    }
  } catch {}
}

/**
 * Periodically check if local client fell behind server revision (if local server is active)
 */
let lastKnownRevision = 0;
async function checkLocalServerDrift(db: PosDatabase) {
  try {
    const baseUrl = getLocalServerBaseUrl();
    if (!baseUrl) return;

    const res = await fetch(`${baseUrl}/api/sync/state`);
    if (!res.ok) return;
    const { revision, data } = await res.json();

    if (revision > lastKnownRevision && data) {
      lastKnownRevision = revision;
      isApplyingRemoteSync = true;
      try {
        for (const tableName of SYNC_TABLES) {
          const items = data[tableName];
          if (Array.isArray(items) && items.length > 0) {
            const table = db.table(tableName);
            if (table) {
              await table.bulkPut(sanitizeSyncItems(tableName, items));
            }
          }
        }
      } finally {
        isApplyingRemoteSync = false;
      }
    }
  } catch {}
}
