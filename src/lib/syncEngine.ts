import type { PosDatabase } from '@/lib/db';
import { getLocalServerBaseUrl } from '@/lib/localNetwork';

// Generate or retrieve persistent unique client identifier
const CLIENT_ID: string = (() => {
  if (typeof sessionStorage !== 'undefined') {
    let id = sessionStorage.getItem('wots_pos_sync_client_id');
    if (!id) {
      id = 'client_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
      sessionStorage.setItem('wots_pos_sync_client_id', id);
    }
    return id;
  }
  return 'client_' + Math.random().toString(36).substring(2, 9);
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

// Flag to prevent loops when applying mutations received from remote/other tabs
let isApplyingRemoteSync = false;

// Cross-tab broadcast channel for instantaneous zero-latency sync in same browser
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('wots_pos_sync_channel');
  } catch {
    // Unsupported or restricted browser context
  }
}

// ─────────────────────────────────────────────────────────────
// AUDIO NOTIFICATIONS (Web Audio API Synthesizer - Zero Assets)
// ─────────────────────────────────────────────────────────────

export function playSyncSound(type: 'kitchen_order' | 'order_ready') {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'kitchen_order') {
      // Pleasant two-tone kitchen order bell (D5 -> A5)
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'order_ready') {
      // Cheerful ready chime (C5 -> E5 -> G5)
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.55);
    }
  } catch {
    // Ignore audio autoplay restrictions
  }
}

// ─────────────────────────────────────────────────────────────
// CLIENT-SIDE BATCHING & DISPATCHER
// ─────────────────────────────────────────────────────────────

interface PendingChange {
  table: string;
  type: 'put' | 'delete';
  item?: any;
  id: string;
}

let pendingChanges: PendingChange[] = [];
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let activeDbInstance: PosDatabase | null = null;

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
      // Deduplicate: replace previous in batch
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

  // 1. Broadcast immediately to other tabs on same machine
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({
        senderId: CLIENT_ID,
        changes,
        deleted,
        timestamp: Date.now(),
      });
    } catch {
      // Ignore broadcast errors
    }
  }

  // 2. Push to local WiFi Node server so other devices get it
  try {
    const baseUrl = getLocalServerBaseUrl();
    await fetch(`${baseUrl}/api/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: CLIENT_ID,
        changes,
        deleted,
      }),
    });
  } catch {
    // Server might be temporarily unreachable, Dexie preserves it locally
  }
}

// ─────────────────────────────────────────────────────────────
// APPLY REMOTE CHANGES (FROM SSE OR BROADCAST)
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
        await table.bulkPut(items);
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
// REAL-TIME SERVER-SENT EVENTS (SSE) STREAM
// ─────────────────────────────────────────────────────────────

let eventSourceInstance: EventSource | null = null;

function setupSSE(db: PosDatabase) {
  if (typeof window === 'undefined' || !window.EventSource) return;

  const baseUrl = getLocalServerBaseUrl();
  const streamUrl = `${baseUrl}/api/sync/stream`;

  function connect() {
    try {
      if (eventSourceInstance) {
        eventSourceInstance.close();
      }

      eventSourceInstance = new EventSource(streamUrl);

      eventSourceInstance.addEventListener('sync', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.senderId !== CLIENT_ID) {
            applyRemoteSync(db, payload.changes, payload.deleted, payload.senderId);
          }
        } catch (err) {
          console.error('[Sync Engine] Failed to parse SSE event:', err);
        }
      });

      eventSourceInstance.onerror = () => {
        // Native EventSource auto-reconnects with exponential backoff
      };
    } catch {
      // Fallback
    }
  }

  connect();
}

// ─────────────────────────────────────────────────────────────
// INITIALIZATION & DEXIE HOOKS
// ─────────────────────────────────────────────────────────────

let isInitialized = false;

export function initSyncEngine(db: PosDatabase) {
  if (isInitialized) return;
  isInitialized = true;
  activeDbInstance = db;

  // 1. Setup cross-tab broadcast receiver
  if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
      const data = event.data;
      if (data && data.senderId !== CLIENT_ID) {
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

  // 3. Connect to Server-Sent Events stream
  setupSSE(db);

  // 4. Initial State Alignment with Master Server
  syncInitialMasterState(db);

  // 5. Periodic Safety Catch-up Poll (every 6 seconds)
  setInterval(() => {
    checkServerDrift(db);
  }, 6000);
}

/**
 * Align local database with master server on startup
 */
async function syncInitialMasterState(db: PosDatabase) {
  try {
    const baseUrl = getLocalServerBaseUrl();
    const res = await fetch(`${baseUrl}/api/sync/state`);
    if (!res.ok) return;

    const { revision, data } = await res.json();

    if (revision > 0 && data) {
      // Server has master state: mirror to Dexie!
      isApplyingRemoteSync = true;
      try {
        for (const tableName of SYNC_TABLES) {
          const items = data[tableName];
          if (Array.isArray(items) && items.length > 0) {
            const table = db.table(tableName);
            if (table) {
              await table.bulkPut(items);
            }
          }
        }
        console.log(`[Sync Engine] Aligned local state with master server (Revision: ${revision})`);
      } finally {
        isApplyingRemoteSync = false;
      }
    } else {
      // Server is fresh (revision 0). Wait 1.5s for local seed to complete, then seed the server!
      setTimeout(async () => {
        try {
          const state: Record<string, any[]> = {};
          for (const tableName of SYNC_TABLES) {
            const table = db.table(tableName);
            if (table) {
              state[tableName] = await table.toArray();
            }
          }
          await fetch(`${baseUrl}/api/sync/seed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderId: CLIENT_ID, state }),
          });
        } catch {
          // Ignore
        }
      }, 1500);
    }
  } catch (err) {
    console.warn('[Sync Engine] Initial master sync failed, continuing offline:', err);
  }
}

/**
 * Periodically check if local client fell behind server revision
 */
let lastKnownRevision = 0;
async function checkServerDrift(db: PosDatabase) {
  try {
    const baseUrl = getLocalServerBaseUrl();
    const res = await fetch(`${baseUrl}/api/sync/state`);
    if (!res.ok) return;
    const { revision, data } = await res.json();

    if (revision > lastKnownRevision && data) {
      lastKnownRevision = revision;
      // Re-apply latest state non-destructively
      isApplyingRemoteSync = true;
      try {
        for (const tableName of SYNC_TABLES) {
          const items = data[tableName];
          if (Array.isArray(items) && items.length > 0) {
            const table = db.table(tableName);
            if (table) {
              await table.bulkPut(items);
            }
          }
        }
      } finally {
        isApplyingRemoteSync = false;
      }
    }
  } catch {
    // Offline
  }
}
