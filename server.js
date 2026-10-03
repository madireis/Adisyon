import http from 'node:http';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import dgram from 'node:dgram';
import { exec } from 'node:child_process';
import qrcode from 'qrcode-terminal';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const VITE_PORT = 5173;

/**
 * Detect Local Network IPv4 Address
 */
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName of Object.keys(interfaces)) {
    const netList = interfaces[interfaceName];
    if (!netList) continue;
    for (const net of netList) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

/**
 * Automatically locate the Vite frontend dist directory
 */
function resolveDistDir() {
  const candidates = [
    path.join(__dirname, 'dist'),
    path.join(process.cwd(), 'dist'),
  ];

  for (const cand of candidates) {
    try {
      if (fs.existsSync(path.join(cand, 'index.html'))) {
        return cand;
      }
    } catch {}
  }
  return null;
}

/**
 * Automatically configure Windows hosts file with adisyon.local
 */
function autoSetupWindowsHosts(localIp) {
  if (process.platform !== 'win32') return;
  try {
    const sysRoot = process.env.SystemRoot || 'C:\\Windows';
    const hostsPath = path.join(sysRoot, 'System32', 'drivers', 'etc', 'hosts');
    if (!fs.existsSync(hostsPath)) return;

    let content = '';
    try {
      content = fs.readFileSync(hostsPath, 'utf8');
    } catch {
      return;
    }

    const hasLocal = content.includes('adisyon.local');
    const hasIp = localIp && localIp !== '127.0.0.1' && content.includes(localIp);
    if (hasLocal && hasIp) {
      // hosts quiet
      return;
    }

    const entries = [
      '',
      '# --- Wots Cafe Adisyon POS Local Domains (Otomatik) ---',
      '127.0.0.1 adisyon.local',
      '127.0.0.1 adisyon.pos',
      '127.0.0.1 adisyon.cafe',
    ];
    if (localIp && localIp !== '127.0.0.1') {
      entries.push(`${localIp} adisyon.local`);
      entries.push(`${localIp} adisyon.pos`);
      entries.push(`${localIp} adisyon.cafe`);
    }
    const textToAdd = entries.join('\r\n') + '\r\n';

    try {
      fs.appendFileSync(hostsPath, textToAdd, 'utf8');
      // hosts quiet
    } catch {
      const escaped = textToAdd.replace(/\r\n/g, '`r`n').replace(/"/g, '`"');
      const ps = `Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -Command Add-Content -Path \\"$env:SystemRoot\\System32\\drivers\\etc\\hosts\\" -Value \\"${escaped}\\"' -WindowStyle Hidden`;
      exec(`powershell -NoProfile -Command "${ps}"`, () => {});
    }
  } catch {}
}

/**
 * Automatically open application in default browser upon server startup
 */
function autoOpenBrowser(url) {
  if (process.env.NO_AUTO_OPEN) return;
  setTimeout(() => {
    try {
      if (process.platform === 'win32') {
        exec(`start "" "${url}"`);
      } else if (process.platform === 'darwin') {
        exec(`open "${url}"`);
      } else {
        exec(`xdg-open "${url}"`);
      }
    } catch {}
  }, 1200);
}


/**
 * RFC 6762 Multicast DNS (mDNS) Responder for "adisyon.local", "pos.local", "kasa.local"
 * Responds to both multicast (224.0.0.251:5353) and unicast requests from phones, tablets, and PCs.
 */
function buildMdnsResponse(domain, ip, txId = 0) {
  const labels = domain.split('.');
  const nameBufferParts = [];
  for (const label of labels) {
    nameBufferParts.push(Buffer.from([label.length]));
    nameBufferParts.push(Buffer.from(label, 'utf-8'));
  }
  nameBufferParts.push(Buffer.from([0]));
  const nameBuf = Buffer.concat(nameBufferParts);

  const header = Buffer.alloc(12);
  header.writeUInt16BE(txId, 0);   // Echo transaction ID if present
  header.writeUInt16BE(0x8400, 2); // Flags: QR=1 (Response), AA=1 (Authoritative), No error
  header.writeUInt16BE(0x0000, 4); // Questions = 0
  header.writeUInt16BE(0x0001, 6); // Answers = 1
  header.writeUInt16BE(0x0000, 8); // Authority = 0
  header.writeUInt16BE(0x0000, 10); // Additional = 0

  const recordHeader = Buffer.alloc(10);
  recordHeader.writeUInt16BE(0x0001, 0); // Type A (Host Address)
  recordHeader.writeUInt16BE(0x8001, 2); // Class IN (with Flush cache bit 0x8000)
  recordHeader.writeUInt32BE(120, 4);    // TTL 120 seconds
  recordHeader.writeUInt16BE(4, 8);      // RDLENGTH = 4 bytes for IPv4

  const ipParts = ip.split('.').map(Number);
  const ipBuf = Buffer.from(ipParts);

  return Buffer.concat([header, nameBuf, recordHeader, ipBuf]);
}

function startMdnsResponder(domains = ['adisyon.local', 'pos.local', 'kasa.local']) {
  try {
    const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    socket.on('error', () => {});
    socket.on('message', (msg, rinfo) => {
      try {
        if (msg.length < 12) return;
        const flags = msg.readUInt16BE(2);
        if ((flags & 0x8000) !== 0) return;

        const txId = msg.readUInt16BE(0);
        const qdcount = msg.readUInt16BE(4);
        if (qdcount === 0) return;

        const currentIp = getLocalIpAddress();
        if (!currentIp || currentIp === '127.0.0.1') return;

        const msgStr = msg.toString('binary').toLowerCase();

        for (const domain of domains) {
          const prefix = domain.toLowerCase().replace('.local', '');
          if (msgStr.includes(prefix) || msgStr.includes(domain.toLowerCase())) {
            const multicastResp = buildMdnsResponse(domain, currentIp, 0);
            const unicastResp = txId !== 0 ? buildMdnsResponse(domain, currentIp, txId) : multicastResp;

            socket.send(multicastResp, 0, multicastResp.length, 5353, '224.0.0.251', () => {});

            if (rinfo.port && rinfo.address) {
              socket.send(unicastResp, 0, unicastResp.length, rinfo.port, rinfo.address, () => {});
            }
          }
        }
      } catch {}
    });

    socket.bind(5353, () => {
      try {
        socket.addMembership('224.0.0.251');
      } catch {}
    });
    return socket;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// ORGANIZED STORAGE, LOGGING & CRASH RECOVERY ENGINE
// ─────────────────────────────────────────────────────────────

const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_DIR = path.join(DATA_DIR, 'orders');
const LOGS_DIR = path.join(DATA_DIR, 'logs');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

const STORE_FILE = path.join(DATA_DIR, 'pos_sync_store.json');
const STORE_TMP_FILE = path.join(DATA_DIR, 'pos_sync_store.json.tmp');
const EMERGENCY_BACKUP_FILE = path.join(BACKUPS_DIR, 'emergency_latest_recovery.json');

// Ensure all organized directories exist
[DATA_DIR, ORDERS_DIR, LOGS_DIR, BACKUPS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const SYNC_TABLES = [
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
];

function createEmptyState() {
  const state = {
    revision: 0,
    lastUpdated: Date.now(),
  };
  for (const table of SYNC_TABLES) {
    state[table] = [];
  }
  return state;
}

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTimestampString() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

// ─── LOGGING & ERROR UTILITIES ────────────────────────────────

function logSystemActivity(category, message, details = null) {
  const timestamp = new Date().toISOString();
  const today = getTodayString();
  const logFile = path.join(LOGS_DIR, `system_activity_${today}.log`);
  const line = `[${timestamp}] [${category.toUpperCase()}] ${message}${details ? ' ' + JSON.stringify(details) : ''}\n`;

  try {
    fs.appendFileSync(logFile, line, 'utf-8');
  } catch (err) {
    console.error('[Storage Logger] Failed to write system activity log:', err);
  }
}

function logErrorEvent(category, message, errorInfo = {}) {
  const msgStr = String(message || '');
  if (
    msgStr.includes('ntfy.sh') ||
    msgStr.includes('/api/ping') ||
    msgStr.includes('/api/logs/error') ||
    msgStr.includes('/api/heartbeat')
  ) {
    return;
  }

  const timestamp = new Date().toISOString();
  const today = getTodayString();
  const errorLogFile = path.join(LOGS_DIR, `errors_${today}.log`);
  const errorJsonlFile = path.join(LOGS_DIR, `errors_${today}.jsonl`);

  const userRole = errorInfo.userRole || 'Sistem / Anonim';
  const route = errorInfo.route || '-';
  const stack = errorInfo.stack ? `\nSTACK: ${errorInfo.stack}` : '';
  const data = errorInfo.data ? `\nDATA: ${typeof errorInfo.data === 'object' ? JSON.stringify(errorInfo.data) : errorInfo.data}` : '';

  const logLine = `[${timestamp}] [ERROR] [${category.toUpperCase()}] [Kullanıcı: ${userRole}] [Rota: ${route}] ${message}${stack}${data}\n`;

  try {
    fs.appendFileSync(errorLogFile, logLine, 'utf-8');
  } catch (err) {
    console.error('[Error Logger] Failed to write error log file:', err);
  }

  try {
    const jsonRecord = {
      timestamp,
      level: 'error',
      category,
      message,
      userRole,
      route,
      stack: errorInfo.stack,
      data: errorInfo.data,
      userAgent: errorInfo.userAgent,
    };
    fs.appendFileSync(errorJsonlFile, JSON.stringify(jsonRecord) + '\n', 'utf-8');
  } catch (err) {
    console.error('[Error Logger] Failed to write error jsonl:', err);
  }

  // Also log to general activity log
  logSystemActivity('ERROR', `[${category}] (${userRole}): ${message}`);
}

function logOrderEvent(eventType, orderData, sender = 'system') {
  const today = getTodayString();
  const jsonlFile = path.join(ORDERS_DIR, `orders_${today}.jsonl`);
  const record = {
    timestamp: new Date().toISOString(),
    event: eventType,
    sender,
    orderId: orderData?.id,
    tableId: orderData?.tableId,
    tableLabel: orderData?.tableLabel,
    waiterName: orderData?.waiterName,
    itemsCount: Array.isArray(orderData?.items) ? orderData.items.length : 0,
    total: orderData?.total || 0,
    status: orderData?.status,
    orderSnapshot: orderData,
  };

  try {
    fs.appendFileSync(jsonlFile, JSON.stringify(record) + '\n', 'utf-8');
  } catch (err) {
    console.error('[Storage Logger] Failed to append order JSONL:', err);
  }

  try {
    const dailyFile = path.join(ORDERS_DIR, `daily_orders_${today}.json`);
    let dailyMap = {};
    if (fs.existsSync(dailyFile)) {
      try {
        dailyMap = JSON.parse(fs.readFileSync(dailyFile, 'utf-8'));
      } catch {}
    }
    if (orderData?.id) {
      dailyMap[orderData.id] = {
        id: orderData.id,
        tableLabel: orderData.tableLabel,
        waiterName: orderData.waiterName,
        total: orderData.total,
        status: orderData.status,
        items: orderData.items,
        lastUpdated: new Date().toISOString(),
      };
      fs.writeFileSync(dailyFile, JSON.stringify(dailyMap, null, 2), 'utf-8');
    }
  } catch {}
}

function logAuditRecord(auditItem) {
  const today = getTodayString();
  const jsonlFile = path.join(LOGS_DIR, `audit_${today}.jsonl`);
  try {
    const record = {
      timestamp: auditItem.timestamp || new Date().toISOString(),
      ...auditItem,
    };
    fs.appendFileSync(jsonlFile, JSON.stringify(record) + '\n', 'utf-8');
  } catch (err) {
    console.error('[Storage Logger] Failed to append audit JSONL:', err);
  }
}

// Global server process error listeners
process.on('uncaughtException', (err) => {
  console.error('[Server UncaughtException]', err);
  logErrorEvent('ServerUncaughtException', err.message, { stack: err.stack, userRole: 'Node.js Backend Server' });
});

process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  const stack = reason instanceof Error ? reason.stack : undefined;
  console.error('[Server UnhandledRejection]', reason);
  logErrorEvent('ServerUnhandledRejection', msg, { stack, userRole: 'Node.js Backend Server' });
});

// ─── CRASH RECOVERY ENGINE ────────────────────────────────────

function loadStateWithCrashRecovery() {
  if (fs.existsSync(STORE_FILE)) {
    try {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      if (raw && raw.trim().length > 0) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          // store loaded
          logSystemActivity('STORAGE', `Master store loaded normally (Revision: ${parsed.revision || 0})`);
          return { ...createEmptyState(), ...parsed };
        }
      }
    } catch (err) {
      console.error('[Storage Engine] WARNING: pos_sync_store.json was corrupted or incomplete (possible sudden shutdown)! Initiating auto-recovery...', err);
      logErrorEvent('CorruptedStoreFile', 'pos_sync_store.json was unparseable. Recovering...', { stack: err.stack });
    }
  }

  if (fs.existsSync(EMERGENCY_BACKUP_FILE)) {
    try {
      const raw = fs.readFileSync(EMERGENCY_BACKUP_FILE, 'utf-8');
      if (raw && raw.trim().length > 0) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          // backup recovered
          logSystemActivity('CRASH_RECOVERY', `Successfully recovered from emergency latest backup (Revision: ${parsed.revision || 0})`);
          fs.writeFileSync(STORE_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
          return { ...createEmptyState(), ...parsed };
        }
      }
    } catch (e) {
      console.error('[Storage Engine] Emergency latest backup failed:', e);
    }
  }

  try {
    if (fs.existsSync(BACKUPS_DIR)) {
      const files = fs
        .readdirSync(BACKUPS_DIR)
        .filter((f) => f.startsWith('snapshot_') && f.endsWith('.json'))
        .sort()
        .reverse();

      for (const f of files) {
        try {
          const raw = fs.readFileSync(path.join(BACKUPS_DIR, f), 'utf-8');
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            // snapshot recovered
            logSystemActivity('CRASH_RECOVERY', `Recovered state from rolling snapshot ${f} (Revision: ${parsed.revision || 0})`);
            fs.writeFileSync(STORE_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
            return { ...createEmptyState(), ...parsed };
          }
        } catch (e) {}
      }
    }
  } catch (e) {
    console.error('[Storage Engine] Failed to search snapshots:', e);
  }

  // fresh state
  logSystemActivity('STORAGE', 'Initialized fresh empty POS state');
  return createEmptyState();
}

let serverState = loadStateWithCrashRecovery();
let lastSnapshotTime = 0;

// ─── ATOMIC DISK SAVER & ROLLING SNAPSHOTS ────────────────────

function pruneOldSnapshots(maxKeep = 50) {
  try {
    const files = fs
      .readdirSync(BACKUPS_DIR)
      .filter((f) => f.startsWith('snapshot_') && f.endsWith('.json'))
      .sort();

    if (files.length > maxKeep) {
      const toDelete = files.slice(0, files.length - maxKeep);
      for (const file of toDelete) {
        fs.unlinkSync(path.join(BACKUPS_DIR, file));
      }
    }
  } catch (err) {
    console.error('[Storage Engine] Snapshot pruning error:', err);
  }
}

function createSnapshotNow(label = 'auto') {
  try {
    const stamp = getTimestampString();
    const filename = `snapshot_${stamp}_${label}.json`;
    const fullPath = path.join(BACKUPS_DIR, filename);
    const jsonStr = JSON.stringify(serverState, null, 2);

    fs.writeFileSync(fullPath, jsonStr, 'utf-8');
    lastSnapshotTime = Date.now();
    pruneOldSnapshots(50);
    logSystemActivity('BACKUP', `Snapshot created: ${filename} (Revision: ${serverState.revision})`);
    return { success: true, filename, timestamp: new Date().toISOString() };
  } catch (err) {
    console.error('[Storage Engine] Failed to create snapshot:', err);
    logErrorEvent('SnapshotError', err.message, { stack: err.stack });
    return { success: false, error: err.message };
  }
}

// Debounced atomic disk writer
let saveTimeout = null;
function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      const jsonStr = JSON.stringify(serverState, null, 2);

      fs.writeFileSync(STORE_TMP_FILE, jsonStr, 'utf-8');
      fs.renameSync(STORE_TMP_FILE, STORE_FILE);

      const emergencyTmp = EMERGENCY_BACKUP_FILE + '.tmp';
      fs.writeFileSync(emergencyTmp, jsonStr, 'utf-8');
      fs.renameSync(emergencyTmp, EMERGENCY_BACKUP_FILE);

      const now = Date.now();
      if (now - lastSnapshotTime > 10 * 60 * 1000 || serverState.revision % 25 === 0) {
        createSnapshotNow('interval');
      }
    } catch (err) {
      console.error('[Storage Engine] Critical error writing store:', err);
      logErrorEvent('StoreSaveError', 'Failed to save store atomically', { stack: err.stack });
    }
  }, 200);
}

setInterval(() => {
  if (serverState.revision > 0) {
    createSnapshotNow('timer');
  }
}, 15 * 60 * 1000);

// ─── SSE CLIENTS & PRESENCE ───────────────────────────────────

const sseClients = new Set();

function broadcastSync(eventData, excludeRes = null) {
  const payload = `event: sync\ndata: ${JSON.stringify(eventData)}\n\n`;
  for (const clientRes of sseClients) {
    if (clientRes !== excludeRes) {
      try {
        clientRes.write(payload);
      } catch (e) {
        sseClients.delete(clientRes);
      }
    }
  }
}

setInterval(() => {
  for (const clientRes of sseClients) {
    try {
      clientRes.write(`: ping ${Date.now()}\n\n`);
    } catch (e) {
      sseClients.delete(clientRes);
    }
  }
}, 15000);

const connectedClients = new Map();

function cleanupInactiveClients() {
  const now = Date.now();
  let changed = false;
  for (const [id, client] of connectedClients.entries()) {
    if (now - client.lastSeen > 8000) {
      connectedClients.delete(id);
      changed = true;
    }
  }
  if (changed) {
    broadcastSync({
      type: 'presence_update',
      activeCount: connectedClients.size,
    });
    scheduleScreenUpdate();
  }
}

setInterval(cleanupInactiveClients, 3000);

// ─────────────────────────────────────────────────────────────
// HTTP SERVER & ROUTING
// ─────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const localIp = getLocalIpAddress();

  // 1. SSE Real-Time Sync Stream
  if (url.pathname === '/api/sync/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    res.write(`event: init\ndata: ${JSON.stringify({ status: 'connected', revision: serverState.revision })}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // 2. Full State Fetch
  if (url.pathname === '/api/sync/state') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        revision: serverState.revision,
        lastUpdated: serverState.lastUpdated,
        data: serverState,
      })
    );
    return;
  }

  // 3. Push Mutations
  if (url.pathname === '/api/sync/push' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const senderId = payload.senderId || 'unknown';
        const changes = payload.changes || {};
        const deleted = payload.deleted || {};

        let hasMutations = false;

        for (const [table, items] of Object.entries(changes)) {
          if (!Array.isArray(items) || items.length === 0) continue;
          if (!Array.isArray(serverState[table])) serverState[table] = [];

          hasMutations = true;
          for (const item of items) {
            if (!item || !item.id) continue;
            const idx = serverState[table].findIndex((x) => x.id === item.id);
            if (idx >= 0) {
              serverState[table][idx] = { ...serverState[table][idx], ...item };
              if (table === 'tables' && item.status === 'available') {
                delete serverState[table][idx].currentOrderId;
                delete serverState[table][idx].occupiedAt;
                serverState[table][idx].guestCount = 0;
              }
              for (const [k, v] of Object.entries(item)) {
                if (v === null || v === undefined) {
                  delete serverState[table][idx][k];
                }
              }
            } else {
              serverState[table].push(item);
              if (table === 'tables' && item.status === 'available') {
                delete item.currentOrderId;
                delete item.occupiedAt;
                item.guestCount = 0;
              }
            }

            if (table === 'orders') {
              logOrderEvent(idx >= 0 ? 'order_update' : 'order_created', item, senderId);
              logSystemActivity(
                'ORDER',
                `Table ${item.tableLabel || item.tableId}: Total ₺${item.total || 0} (${item.status || 'open'}) by ${item.waiterName || senderId}`
              );
            }

            if (table === 'payments') {
              logSystemActivity('PAYMENT', `Payment processed: ₺${item.totalAmount || item.amount || 0} for Order ${item.orderId || '-'}`);
            }

            if (table === 'auditLogs') {
              logAuditRecord(item);
            }
          }
        }

        for (const [table, ids] of Object.entries(deleted)) {
          if (!Array.isArray(ids) || ids.length === 0) continue;
          if (!Array.isArray(serverState[table])) continue;

          hasMutations = true;
          const idSet = new Set(ids);
          serverState[table] = serverState[table].filter((x) => !idSet.has(x.id));
          logSystemActivity('DELETE', `Deleted ${ids.length} records from table '${table}'`, { ids });
        }

        if (hasMutations) {
          serverState.revision++;
          serverState.lastUpdated = Date.now();
          scheduleSave();

          broadcastSync({
            revision: serverState.revision,
            senderId,
            changes,
            deleted,
            timestamp: serverState.lastUpdated,
          });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, revision: serverState.revision }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid sync payload' }));
      }
    });
    return;
  }

  // 4. Client & Account Error Logging Endpoint (POST /api/logs/error)
  if (url.pathname === '/api/logs/error' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const errorData = JSON.parse(body || '{}');
        const category = errorData.category || 'ClientRuntime';
        const message = errorData.message || 'Unknown client error';

        logErrorEvent(category, message, errorData);

        // Broadcast to developer screen if connected
        broadcastSync({
          type: 'dev_log_entry',
          entry: {
            id: 'srv_' + Date.now(),
            timestamp: new Date().toISOString(),
            level: 'error',
            category,
            message,
            stack: errorData.stack,
            data: errorData.data,
            route: errorData.route,
            userRole: errorData.userRole,
            userAgent: errorData.userAgent,
          },
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to record error log' }));
      }
    });
    return;
  }

  // 5. Initial Seed
  if (url.pathname === '/api/sync/seed' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const isFresh = serverState.revision === 0 || !serverState.tables || serverState.tables.length === 0;
        if (isFresh && payload.state) {
          for (const table of SYNC_TABLES) {
            if (Array.isArray(payload.state[table]) && payload.state[table].length > 0) {
              serverState[table] = payload.state[table];
            }
          }
          serverState.revision = 1;
          serverState.lastUpdated = Date.now();
          scheduleSave();
          createSnapshotNow('seed_bootstrap');
          // seed initialized
          logSystemActivity('SEED', 'Server store initialized with initial seed data');

          broadcastSync({
            revision: serverState.revision,
            senderId: payload.senderId || 'seed',
            changes: serverState,
            timestamp: serverState.lastUpdated,
          });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, revision: serverState.revision }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Seed failed' }));
      }
    });
    return;
  }

  // 6. Hard Reset
  if (url.pathname === '/api/sync/reset' && req.method === 'POST') {
    createSnapshotNow('pre_reset_backup');

    serverState.orders = [];
    serverState.kitchenTickets = [];
    serverState.payments = [];
    serverState.cashTransactions = [];
    if (Array.isArray(serverState.tables)) {
      serverState.tables = serverState.tables.map((t) => ({
        ...t,
        status: 'available',
        currentOrderId: undefined,
        activeGuests: undefined,
        lastOrderTime: undefined,
      }));
    }
    serverState.revision++;
    serverState.lastUpdated = Date.now();
    scheduleSave();
    logSystemActivity('RESET', 'Manager day reset executed');

    broadcastSync({
      revision: serverState.revision,
      senderId: 'manager-reset',
      changes: {
        tables: serverState.tables,
        orders: [],
        kitchenTickets: [],
        payments: [],
        cashTransactions: [],
      },
      deleted: {},
      isReset: true,
      timestamp: serverState.lastUpdated,
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, revision: serverState.revision }));
    return;
  }

  // 7. Fast Ping
  if (url.pathname === '/api/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, timestamp: Date.now() }));
    return;
  }

  // 8. Network Info
  if (url.pathname === '/api/network-info') {
    cleanupInactiveClients();
    const garsonsList = Array.from(connectedClients.values());
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'online',
        serverName: os.hostname(),
        localIp,
        domain: 'adisyon.local',
        domainUrl: `http://adisyon.local:${PORT}`,
        port: PORT,
        appPort: VITE_PORT,
        joinUrl: `http://${localIp}:${PORT}`,
        activeCount: garsonsList.length,
        revision: serverState.revision,
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  // 9. Storage & Crash Recovery Health
  if (url.pathname === '/api/storage/status') {
    try {
      const backupFiles = fs.existsSync(BACKUPS_DIR)
        ? fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith('.json'))
        : [];
      const orderFiles = fs.existsSync(ORDERS_DIR) ? fs.readdirSync(ORDERS_DIR) : [];
      const logFiles = fs.existsSync(LOGS_DIR) ? fs.readdirSync(LOGS_DIR) : [];

      const todayOrderCount = Array.isArray(serverState.orders) ? serverState.orders.length : 0;
      const activeTablesCount = Array.isArray(serverState.tables)
        ? serverState.tables.filter((t) => t.status === 'occupied').length
        : 0;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'healthy',
          dataDir: DATA_DIR,
          revision: serverState.revision,
          lastUpdated: serverState.lastUpdated,
          lastSnapshotTime: lastSnapshotTime ? new Date(lastSnapshotTime).toISOString() : null,
          backupsCount: backupFiles.length,
          orderFilesCount: orderFiles.length,
          logFilesCount: logFiles.length,
          todayOrdersCount: todayOrderCount,
          activeTablesCount,
          resilience: 'Atomic Temp-Rename Writes + Dual Recovery File + Rolling Backups Active',
          directories: {
            orders: ORDERS_DIR,
            logs: LOGS_DIR,
            backups: BACKUPS_DIR,
          },
        })
      );
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 10. List All Backups
  if (url.pathname === '/api/storage/backups') {
    try {
      const list = [];
      if (fs.existsSync(BACKUPS_DIR)) {
        const files = fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith('.json'));
        for (const file of files) {
          const stat = fs.statSync(path.join(BACKUPS_DIR, file));
          list.push({
            filename: file,
            sizeBytes: stat.size,
            sizeKb: Math.round(stat.size / 1024),
            createdAt: stat.mtime.toISOString(),
          });
        }
      }
      list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ backups: list }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 11. Manual Snapshot Trigger
  if (url.pathname === '/api/storage/backup-now' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const label = (payload.label || 'manual').replace(/[^a-zA-Z0-9_-]/g, '_');
        const result = createSnapshotNow(label);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 12. Restore State from Backup
  if (url.pathname === '/api/storage/restore' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const filename = payload.filename;
        if (!filename || !fs.existsSync(path.join(BACKUPS_DIR, filename))) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Backup file not found' }));
          return;
        }

        const raw = fs.readFileSync(path.join(BACKUPS_DIR, filename), 'utf-8');
        const parsed = JSON.parse(raw);

        createSnapshotNow('pre_restore_safety');

        serverState = { ...createEmptyState(), ...parsed };
        serverState.revision++;
        serverState.lastUpdated = Date.now();
        scheduleSave();

        logSystemActivity('RESTORE', `State restored from backup file: ${filename}`);

        broadcastSync({
          revision: serverState.revision,
          senderId: 'restore',
          changes: serverState,
          timestamp: serverState.lastUpdated,
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, revision: serverState.revision, restoredFrom: filename }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 13. View Today's Activity Logs
  if (url.pathname === '/api/storage/logs/today') {
    try {
      const today = getTodayString();
      const logFile = path.join(LOGS_DIR, `system_activity_${today}.log`);
      if (fs.existsSync(logFile)) {
        const content = fs.readFileSync(logFile, 'utf-8');
        const lines = content.trim().split('\n').slice(-150);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ lines }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ lines: [] }));
      }
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 14. View Today's Dedicated Error Logs (GET /api/storage/errors/today)
  if (url.pathname === '/api/storage/errors/today') {
    try {
      const today = getTodayString();
      const errorFile = path.join(LOGS_DIR, `errors_${today}.log`);
      if (fs.existsSync(errorFile)) {
        const content = fs.readFileSync(errorFile, 'utf-8');
        const lines = content.trim().split('\n').filter(Boolean).slice(-200);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ lines }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ lines: [] }));
      }
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 14b. Clear Today's Dedicated Error Logs (POST /api/storage/errors/clear)
  if (url.pathname === '/api/storage/errors/clear' && req.method === 'POST') {
    try {
      const today = getTodayString();
      const errorFile = path.join(LOGS_DIR, `errors_${today}.log`);
      const errorJsonlFile = path.join(LOGS_DIR, `errors_${today}.jsonl`);
      if (fs.existsSync(errorFile)) fs.writeFileSync(errorFile, '', 'utf-8');
      if (fs.existsSync(errorJsonlFile)) fs.writeFileSync(errorJsonlFile, '', 'utf-8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 15. Garsons List
  if (url.pathname === '/api/garsons') {
    cleanupInactiveClients();
    const now = Date.now();
    const garsonsList = Array.from(connectedClients.values())
      .filter((c) => now - c.lastSeen < 8000)
      .map((c) => ({
        ...c,
        isOnline: true,
      }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ garsons: garsonsList }));
    return;
  }

  // 16. Heartbeat from Garson Phone / Tablet / Browser
  if (url.pathname === '/api/heartbeat' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const staffId = data.staffId;

        if (!staffId) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, reason: 'unauthenticated' }));
          return;
        }

        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const cleanIp = String(clientIp).replace(/^.*:/, '') || localIp;

        const isNew = !connectedClients.has(staffId);
        const existing = connectedClients.get(staffId);
        const infoChanged = !existing || existing.name !== data.staffName || existing.role !== data.role || existing.deviceName !== data.deviceName;

        const updatedClient = {
          id: staffId,
          name: data.staffName || 'Garson',
          role: data.role || 'waiter',
          deviceName: data.deviceName || 'Telefon (WiFi)',
          ip: cleanIp,
          pingMs: data.pingMs || Math.floor(Math.random() * 15 + 5),
          firstConnectedAt: existing ? existing.firstConnectedAt : new Date().toISOString(),
          lastSeen: Date.now(),
        };

        connectedClients.set(staffId, updatedClient);

        if (isNew) {
          broadcastSync({
            type: 'presence_update',
            activeCount: connectedClients.size,
            addedStaff: updatedClient,
          });
        }

        if (isNew || infoChanged) {
          scheduleScreenUpdate();
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            serverIp: localIp,
            activeWaitersCount: connectedClients.size,
            revision: serverState.revision,
          })
        );
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  // 17. Disconnect Endpoint
  if (url.pathname === '/api/disconnect') {
    const handleDisconnectId = (staffId) => {
      if (staffId && connectedClients.has(staffId)) {
        connectedClients.delete(staffId);
        broadcastSync({
          type: 'presence_update',
          activeCount: connectedClients.size,
          removedStaffId: staffId,
        });
        scheduleScreenUpdate();
      }
    };

    const queryStaffId = url.searchParams.get('staffId');
    if (queryStaffId) {
      handleDisconnectId(queryStaffId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, activeWaitersCount: connectedClients.size }));
      return;
    }

    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        if (data.staffId) {
          handleDisconnectId(data.staffId);
        }
      } catch {}
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, activeWaitersCount: connectedClients.size }));
    });
    return;
  }

  // 18. System: Lock Windows Static IP (Sabit IP Ayarla API)
  if (url.pathname === '/api/system/lock-static-ip' && req.method === 'POST') {
    if (process.platform !== 'win32') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Bu ozellik sadece Windows sistemlerde calisir.' }));
      return;
    }
    try {
      const script = `
        $cfg = Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null } | Select-Object -First 1
        if ($cfg) {
          $idx = $cfg.InterfaceIndex
          $ip = $cfg.IPv4Address.IPAddress
          $prefix = $cfg.IPv4Address.PrefixLength
          $gw = $cfg.IPv4DefaultGateway.NextHop
          $dns = ($cfg.DNSServer | ForEach-Object { $_.ServerAddresses }) -join ','
          if (-not $dns) { $dns = '8.8.8.8,1.1.1.1' }
          Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -Command Remove-NetIPAddress -InterfaceIndex $idx -AddressFamily IPv4 -Confirm:\`$false; New-NetIPAddress -InterfaceIndex $idx -IPAddress $ip -PrefixLength $prefix -DefaultGateway $gw; Set-NetIPInterface -InterfaceIndex $idx -Dhcp Disabled; Set-DnsClientServerAddress -InterfaceIndex $idx -ServerAddresses $dns" -WindowStyle Hidden
        }
      `;
      exec(`powershell -NoProfile -Command "${script.replace(/\r?\n\s*/g, ' ')}"`, (err) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Mevcut IP adresi Windows ag ayarlarinda kalici olarak sabitlendi.' }));
        }
      });
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 19. Default: Serve built Vite static files (SPA frontend)
  const distDir = resolveDistDir();
  if (distDir) {
    let cleanPath = url.pathname.replace(/^\/Adisyon\/?/, '/');
    const relativePath = cleanPath === '/' ? 'index.html' : cleanPath.replace(/^\/+/, '');
    let filePath = path.join(distDir, relativePath);

    const assetExts = ['.js', '.mjs', '.css', '.map', '.json', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff2', '.woff', '.ttf', '.webmanifest'];
    const requestedExt = path.extname(cleanPath).toLowerCase();

    // If a specific static asset file was requested but does not exist, return 404 (NEVER index.html HTML!)
    if (requestedExt && assetExts.includes(requestedExt)) {
      if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`Asset not found: ${cleanPath}`);
        return;
      }
    } else if (!fs.existsSync(filePath)) {
      filePath = path.join(distDir, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.mjs': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.webmanifest': 'application/manifest+json',
      '.woff2': 'font/woff2',
      '.woff': 'font/woff',
      '.ttf': 'font/ttf',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    if (filePath.endsWith('sw.js') || ext === '.html') {
      res.setHeader('Service-Worker-Allowed', '/');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
    } else if (ext === '.js' || ext === '.css' || ext === '.woff2') {
      // Fingerprinted assets can be cached
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        if (ext === '.html') {
          res.writeHead(500);
          res.end('Server Error');
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      }
    });
    return;
  }

  // Fallback: Auto redirect to Vite dev port 5173
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="utf-8">
      <title>Wot's Cafe Adisyon</title>
      <meta http-equiv="refresh" content="1;url=http://localhost:${VITE_PORT}">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #1c1917; color: #f5f5f4; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #292524; padding: 2.5rem; border-radius: 1.5rem; text-align: center; border: 1px solid #44403c; max-width: 440px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
        h2 { color: #f97316; margin-top: 0; font-size: 1.5rem; }
        p { color: #a8a29e; font-size: 0.95rem; line-height: 1.5; }
        a { display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; background: #f97316; color: white; text-decoration: none; border-radius: 0.75rem; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Wot's Cafe Adisyon</h2>
        <p>Uygulamaya yonlendiriliyorsunuz...</p>
        <a href="http://localhost:${VITE_PORT}">Giris Yap (Port ${VITE_PORT})</a>
      </div>
    </body>
    </html>
  `);
});

let cachedIosLines = null;
let cachedAndroidLines = null;
let cachedLocalIp = '';
let cachedPort = 3001;
let screenUpdateTimer = null;

/**
 * Render full screen display with stats, addresses, QR codes and live active accounts
 */
function renderFullDisplay() {
  const localIp = cachedLocalIp || getLocalIpAddress();
  const port = cachedPort;
  const isLocalOnly = !localIp || localIp === '127.0.0.1';
  const iosUrl = isLocalOnly ? `http://localhost:${port}` : `http://adisyon.local:${port}`;
  const androidUrl = isLocalOnly ? `http://localhost:${port}` : `http://${localIp}:${port}`;

  const tableCount = Array.isArray(serverState?.tables) ? serverState.tables.length : 0;
  const menuCount = Array.isArray(serverState?.menuItems) ? serverState.menuItems.length : 0;
  const staffCount = Array.isArray(serverState?.staff) ? serverState.staff.length : 0;

  try {
    console.clear();
  } catch {}

  const divider = '='.repeat(68);
  const subDivider = '-'.repeat(68);

  console.log('\n' + divider);
  console.log("                 WOT'S CAFE ADISYON SISTEMI");
  console.log(divider);
  console.log('');
  console.log('  [ SISTEM & VERI DURUMU ]');
  console.log(`  * Sunucu Durumu : AKTIF (Port ${port})`);
  console.log(`  * Kasa PC Giris : http://localhost:${port}`);
  console.log(`  * Kayitli Veri  : ${tableCount} Masa | ${menuCount} Urun | ${staffCount} Personel`);
  console.log('  * Senkronizasyon: Yerel WiFi, SSE & mDNS Aktif');
  console.log('');
  console.log(subDivider);
  console.log('  [ TELEFON BAGLANTI ADRESLERI ]');
  console.log(`  * iPhone / iOS  : ${iosUrl}` + (!isLocalOnly ? ` (veya http://${localIp}:${port})` : ''));
  console.log(`  * Android       : ${androidUrl}`);
  console.log(subDivider);
  console.log('       [ iPhone / iOS QR ]                 [ Android QR ]');
  console.log(subDivider);

  if (cachedIosLines && cachedAndroidLines) {
    const cols = process.stdout.columns || 80;
    if (cols >= 65) {
      const maxLines = Math.max(cachedIosLines.length, cachedAndroidLines.length);
      for (let i = 0; i < maxLines; i++) {
        const left = (cachedIosLines[i] || '').padEnd(31);
        const right = (cachedAndroidLines[i] || '');
        console.log('  ' + left + '     ' + right);
      }
    } else {
      console.log('  [ iPhone / iOS QR ]');
      console.log(cachedIosLines.join('\n'));
      console.log(subDivider);
      console.log('  [ Android QR ]');
      console.log(cachedAndroidLines.join('\n'));
    }
  }

  console.log('\n' + subDivider);
  const activeList = Array.from(connectedClients.values());
  if (activeList.length === 0) {
    console.log('  [ AKTIF BAGLI HESAPLAR ] (0 Cihaz)');
    console.log('  * Su an bagli aktif hesap bulunmuyor. (Giris bekleniyor...)');
  } else {
    console.log(`  [ AKTIF BAGLI HESAPLAR (${activeList.length} Cihaz Canli) ]`);
    for (const client of activeList) {
      const roleLabel =
        client.role === 'waiter'
          ? 'Garson'
          : client.role === 'kitchen'
          ? 'Mutfak'
          : client.role === 'owner'
          ? 'Patron'
          : 'Yonetici';
      console.log(`  * ${client.name} [${roleLabel}] - ${client.deviceName || 'Mobil'} (${client.ip})`);
    }
  }

  console.log(divider);
  console.log(' * Telefon kamerasini QR koda tutarak aninda baglanabilirsiniz.');
  console.log(divider + '\n');
}

function scheduleScreenUpdate() {
  if (screenUpdateTimer) return;
  screenUpdateTimer = setTimeout(() => {
    screenUpdateTimer = null;
    renderFullDisplay();
  }, 100);
}

function initStartupScreen(localIp, port) {
  cachedLocalIp = localIp;
  cachedPort = port;

  const isLocalOnly = !localIp || localIp === '127.0.0.1';
  const iosUrl = isLocalOnly ? `http://localhost:${port}` : `http://adisyon.local:${port}`;
  const androidUrl = isLocalOnly ? `http://localhost:${port}` : `http://${localIp}:${port}`;

  qrcode.generate(iosUrl, { small: true }, (qrIos) => {
    cachedIosLines = (qrIos || '').trimEnd().split('\n');
    qrcode.generate(androidUrl, { small: true }, (qrAndroid) => {
      cachedAndroidLines = (qrAndroid || '').trimEnd().split('\n');
      renderFullDisplay();
    });
  });
}

server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIpAddress();
  startMdnsResponder(['adisyon.local', 'pos.local', 'kasa.local']);

  // Automatic Windows configurations upon startup
  autoSetupWindowsHosts(localIp);
  autoOpenBrowser(`http://localhost:${PORT}`);

  initStartupScreen(localIp, PORT);
});
