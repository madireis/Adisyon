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
// REAL-TIME POS DATA SYNCHRONIZATION STORE & PERSISTENCE
// ─────────────────────────────────────────────────────────────

const DATA_DIR = path.join(__dirname, 'data');
const STORE_FILE = path.join(DATA_DIR, 'pos_sync_store.json');

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

let serverState = createEmptyState();

// Load persistent store from disk if available
try {
  if (fs.existsSync(STORE_FILE)) {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    serverState = { ...createEmptyState(), ...parsed };
    console.log(`[Sync Engine] Loaded persistent POS state (Revision: ${serverState.revision})`);
  }
} catch (err) {
  console.error('[Sync Engine] Error reading pos_sync_store.json:', err);
}

// Debounced disk writer
let saveTimeout = null;
function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_FILE, JSON.stringify(serverState, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Sync Engine] Failed to save pos_sync_store.json:', err);
    }
  }, 250);
}

// Connected SSE clients for instantaneous real-time sync across devices
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

// Heartbeat ping to keep SSE connections open through firewalls and routers
setInterval(() => {
  for (const clientRes of sseClients) {
    try {
      clientRes.write(`: ping ${Date.now()}\n\n`);
    } catch (e) {
      sseClients.delete(clientRes);
    }
  }
}, 15000);

// In-memory store for connected staff / garsons (presence tracking)
const connectedClients = new Map();

function cleanupInactiveClients() {
  const now = Date.now();
  for (const [id, client] of connectedClients.entries()) {
    if (now - client.lastSeen > 15000) {
      connectedClients.delete(id);
    }
  }
}

setInterval(cleanupInactiveClients, 5000);

// ─────────────────────────────────────────────────────────────
// HTTP SERVER & ROUTING
// ─────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  // CORS Headers for seamless local network WiFi access
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

  // 1. SSE Real-Time Sync Stream (Server-Sent Events)
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

  // 2. Full State Fetch (Used on boot, reconnect, or safety polling)
  if (url.pathname === '/api/sync/state') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      revision: serverState.revision,
      lastUpdated: serverState.lastUpdated,
      data: serverState,
    }));
    return;
  }

  // 3. Push Mutations (Any client modification to orders, tables, tickets, etc.)
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

        // Upsert modified records
        for (const [table, items] of Object.entries(changes)) {
          if (!Array.isArray(items) || items.length === 0) continue;
          if (!Array.isArray(serverState[table])) serverState[table] = [];

          hasMutations = true;
          for (const item of items) {
            if (!item || !item.id) continue;
            const idx = serverState[table].findIndex((x) => x.id === item.id);
            if (idx >= 0) {
              serverState[table][idx] = { ...serverState[table][idx], ...item };
            } else {
              serverState[table].push(item);
            }
          }
        }

        // Remove deleted records
        for (const [table, ids] of Object.entries(deleted)) {
          if (!Array.isArray(ids) || ids.length === 0) continue;
          if (!Array.isArray(serverState[table])) continue;

          hasMutations = true;
          const idSet = new Set(ids);
          serverState[table] = serverState[table].filter((x) => !idSet.has(x.id));
        }

        if (hasMutations) {
          serverState.revision++;
          serverState.lastUpdated = Date.now();
          scheduleSave();

          // Push instantly to all connected phones/tablets/PCs
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

  // 4. Initial Seed (Bootstrap master state from first running client if empty)
  if (url.pathname === '/api/sync/seed' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const isFresh = serverState.revision === 0 || (!serverState.tables || serverState.tables.length === 0);
        if (isFresh && payload.state) {
          for (const table of SYNC_TABLES) {
            if (Array.isArray(payload.state[table]) && payload.state[table].length > 0) {
              serverState[table] = payload.state[table];
            }
          }
          serverState.revision = 1;
          serverState.lastUpdated = Date.now();
          scheduleSave();
          console.log('[Sync Engine] Server store initialized with initial seed data');

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

  // 5. Hard Reset (Manager clean day start / reset)
  if (url.pathname === '/api/sync/reset' && req.method === 'POST') {
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

  // 6. Fast Ping
  if (url.pathname === '/api/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, timestamp: Date.now() }));
    return;
  }

  // 7. Network Info & Server Status
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

  // 8. Garsons List
  if (url.pathname === '/api/garsons') {
    cleanupInactiveClients();
    const garsonsList = Array.from(connectedClients.values()).map((c) => ({
      ...c,
      isOnline: Date.now() - c.lastSeen < 12000,
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ garsons: garsonsList }));
    return;
  }

  // 9. Heartbeat from Garson Phone / Tablet / Browser
  if (url.pathname === '/api/heartbeat' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const cleanIp = String(clientIp).replace(/^.*:/, '') || localIp;

        const staffId = data.staffId || `device-${cleanIp}`;
        const existing = connectedClients.get(staffId);

        const updatedClient = {
          id: staffId,
          name: data.staffName || 'Garson (Mobil)',
          role: data.role || 'waiter',
          deviceName: data.deviceName || 'Telefon (WiFi)',
          ip: cleanIp,
          pingMs: data.pingMs || Math.floor(Math.random() * 15 + 5),
          firstConnectedAt: existing ? existing.firstConnectedAt : new Date().toISOString(),
          lastSeen: Date.now(),
        };

        connectedClients.set(staffId, updatedClient);

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

  // 10. Default: Serve built Vite static files if dist directory exists
  const distDir = path.join(__dirname, 'dist');
  if (fs.existsSync(distDir)) {
    let filePath = path.join(distDir, url.pathname === '/' ? 'index.html' : url.pathname);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(distDir, 'index.html'); // SPA fallback
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
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
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

  // Standard response if dist is not built yet
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
  console.log(`📡 Gerçek Zamanlı Senkronizasyon (SSE & WiFi): Aktif`);
  console.log(`==================================================\n`);
});
