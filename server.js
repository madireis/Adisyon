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
      // Look for non-internal IPv4 address (Wi-Fi or LAN)
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

// In-memory store for connected staff / garsons
// Key: staffId or deviceIp
const connectedClients = new Map();

// Remove inactive clients (older than 15 seconds)
function cleanupInactiveClients() {
  const now = Date.now();
  for (const [id, client] of connectedClients.entries()) {
    if (now - client.lastSeen > 15000) {
      connectedClients.delete(id);
    }
  }
}

setInterval(cleanupInactiveClients, 5000);

const server = http.createServer((req, res) => {
  // CORS Headers for local network requests
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

  // Endpoint: Fast Ping
  if (url.pathname === '/api/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, timestamp: Date.now() }));
    return;
  }

  // Endpoint: Network Info & Server Status
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
        joinUrl: `http://${localIp}:${VITE_PORT}`,
        activeCount: garsonsList.length,
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  // Endpoint: Garsons List (Connected devices)
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

  // Endpoint: Heartbeat from Garson Phone
  if (url.pathname === '/api/heartbeat' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const clientIp =
          req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
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
          })
        );
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  // Default: Serve built Vite static files if dist directory exists
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
    <p>Garsonlar için Vite Uygulama Adresi: <strong>http://${localIp}:${VITE_PORT}</strong></p>
  `);
});

server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIpAddress();
  console.log(`\n==================================================`);
  console.log(`🚀 ADİSYON YEREL AĞ (WIFI) SUNUCUSU ÇALIŞIYOR`);
  console.log(`📍 Ana PC Yerel IP: http://${localIp}:${PORT}`);
  console.log(`📲 Garson Telefon Bağlantı URL: http://${localIp}:${VITE_PORT}`);
  console.log(`==================================================\n`);
});
