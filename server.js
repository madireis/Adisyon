import http from 'node:http';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
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
          console.log(`[Storage Engine] Loaded master POS store (Revision: ${parsed.revision || 0})`);
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
          console.log(`[Storage Engine] RECOVERED from emergency latest backup! (Revision: ${parsed.revision || 0})`);
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
            console.log(`[Storage Engine] RECOVERED from rolling snapshot: ${f} (Revision: ${parsed.revision || 0})`);
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

  console.log('[Storage Engine] No existing store found. Initialized fresh state.');
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
              if (table === 'tables' && item.status === 'available' && !item.currentOrderId) {
                delete serverState[table][idx].currentOrderId;
                delete serverState[table][idx].occupiedAt;
                serverState[table][idx].guestCount = 0;
              }
              for (const [k, v] of Object.entries(item)) {
                if (v === null) {
                  delete serverState[table][idx][k];
                }
              }
            } else {
              serverState[table].push(item);
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
          console.log('[Storage Engine] Server store initialized with initial seed data');
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

  // 18. Default: Serve built Vite static files if dist directory exists
  const distDir = path.join(__dirname, 'dist');
  if (fs.existsSync(distDir)) {
    let cleanPath = url.pathname.replace(/^\/Adisyon\/?/, '/');
    let filePath = path.join(distDir, cleanPath === '/' ? 'index.html' : cleanPath);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(distDir, 'index.html');
    }

    const ext = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.webmanifest': 'application/manifest+json',
      '.woff2': 'font/woff2',
      '.woff': 'font/woff',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    if (filePath.endsWith('sw.js')) {
      res.setHeader('Service-Worker-Allowed', '/');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      }
    });
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
    <h2>Wot's Cafe Adisyon Yerel Ağ Sunucusu Aktif!</h2>
    <p>Sunucu IP Adresi: <strong>http://${localIp}:${PORT}</strong></p>
    <p>Garsonlar için Uygulama Adresi: <strong>http://${localIp}:${PORT}</strong></p>
  `);
});

server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIpAddress();
  console.log(`\n==================================================`);
  console.log(`🚀 ADİSYON REAL-TIME SYNC & YEREL AĞ SUNUCUSU ÇALIŞIYOR`);
  console.log(`📍 Ana PC Yerel IP: http://${localIp}:${PORT}`);
  console.log(`📲 Garson Telefon Bağlantı URL: http://${localIp}:${PORT}`);
  console.log(`📁 Veri & Log Depolama Dizini: ${DATA_DIR}`);
  console.log(`🛑 Hata Kayıt Dosyası: ${path.join(LOGS_DIR, `errors_${getTodayString()}.log`)}`);
  console.log(`🛡️ Ani Kapanma Koruması & Atomik Yazma: Aktif`);
  console.log(`📡 Gerçek Zamanlı Senkronizasyon (SSE & WiFi): Aktif`);
  console.log(`==================================================\n`);
});
