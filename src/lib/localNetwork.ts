import type { Staff } from '@/types/pos';

export interface ConnectedGarson {
  id: string;
  name: string;
  role: string;
  deviceName: string;
  ip: string;
  pingMs: number;
  firstConnectedAt: string;
  lastSeen: number;
  isOnline: boolean;
}

export interface LocalNetworkInfo {
  status: 'online' | 'offline';
  serverName: string;
  localIp: string;
  port: number;
  appPort: number;
  joinUrl: string;
  activeCount: number;
}

const LOCAL_PRESENCE_KEY = 'wots_presence_sessions';
const PRESENCE_CHANNEL_NAME = 'wots_presence_channel';

// Cross-tab broadcast channel for instantaneous zero-latency presence sync
let presenceChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    presenceChannel = new BroadcastChannel(PRESENCE_CHANNEL_NAME);
  } catch {
    // Unsupported context
  }
}

/**
 * Determine the local server base URL
 */
export function getLocalServerBaseUrl(): string {
  if (typeof localStorage !== 'undefined') {
    const custom = localStorage.getItem('wots_custom_local_ip');
    if (custom && custom.trim()) {
      return `http://${custom.trim()}:3001`;
    }
  }

  const hostname = window.location.hostname || 'localhost';
  // On GitHub Pages or static host, there is no Node.js backend unless custom local IP is provided
  if (hostname.includes('github.io')) {
    return '';
  }

  return `http://${hostname}:3001`;
}

/**
 * Clean device IP or host label
 */
export function getCleanDeviceIp(): string {
  const hostname = window.location.hostname;
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
    return '127.0.0.1 (Yerel)';
  }
  if (hostname.includes('github.io')) {
    return 'Web / Bulut';
  }
  return hostname;
}

/**
 * Detect User Device Name / Browser
 */
export function getDeviceDescription(): string {
  if (typeof navigator === 'undefined') return 'Cihaz';
  const ua = navigator.userAgent;

  let deviceType = 'Telefon';
  if (/iPad|Tablet|PlayBook/i.test(ua)) deviceType = 'Tablet';
  else if (/iPhone/i.test(ua)) deviceType = 'iPhone';
  else if (/Android/i.test(ua) && /Mobile/i.test(ua)) deviceType = 'Android';
  else if (/Mobile/i.test(ua)) deviceType = 'Mobil Telefon';
  else deviceType = 'Masaüstü PC';

  let browser = 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';

  return `${deviceType} (${browser})`;
}

/**
 * Read local presence sessions map from localStorage
 */
function getLocalPresenceSessions(): Record<string, ConnectedGarson> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_PRESENCE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Save local presence sessions map to localStorage
 */
function saveLocalPresenceSessions(sessions: Record<string, ConnectedGarson>) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_PRESENCE_KEY, JSON.stringify(sessions));
  } catch {}
}

/**
 * Fetch local network status & IP information
 */
export async function fetchLocalNetworkInfo(): Promise<LocalNetworkInfo> {
  const hostname = window.location.hostname || '127.0.0.1';
  const defaultAppPort = window.location.port ? parseInt(window.location.port, 10) : 3001;
  const baseUrl = getLocalServerBaseUrl();

  if (baseUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${baseUrl}/api/network-info`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Backend not running on local IP
    }
  }

  // Fallback info derived from current browser URL or machine IP
  const fallbackIp = hostname === 'localhost' || hostname === '127.0.0.1' ? '192.168.1.33' : hostname;
  const fallbackPort = window.location.port ? parseInt(window.location.port, 10) : 3001;
  
  return {
    status: baseUrl ? 'offline' : 'online',
    serverName: 'Adisyon Yerel Ağ',
    localIp: fallbackIp,
    port: 3001,
    appPort: fallbackPort,
    joinUrl: `http://${fallbackIp}:${fallbackPort}`,
    activeCount: Object.keys(getLocalPresenceSessions()).length,
  };
}

/**
 * Send periodic heartbeat ping to local server & update presence store
 * ONLY called if staff member is genuinely signed in!
 */
export async function sendLocalHeartbeat(user: Staff): Promise<{ success: boolean; pingMs: number }> {
  if (!user || !user.id) {
    return { success: false, pingMs: 0 };
  }

  const now = Date.now();
  let measuredPing = 8;
  const baseUrl = getLocalServerBaseUrl();

  // 1. Try sending heartbeat to server if available
  if (baseUrl) {
    const startTime = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${baseUrl}/api/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: user.id,
          staffName: user.name,
          role: user.role,
          deviceName: getDeviceDescription(),
          pingMs: Math.round(performance.now() - startTime),
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        measuredPing = Math.max(1, Math.round(performance.now() - startTime));
      }
    } catch {
      // Backend silent catch
    }
  }

  // 2. Update local presence store (ensures cross-tab / local accuracy)
  const sessions = getLocalPresenceSessions();
  const existing = sessions[user.id];

  const sessionData: ConnectedGarson = {
    id: user.id,
    name: user.name,
    role: user.role,
    deviceName: getDeviceDescription(),
    ip: getCleanDeviceIp(),
    pingMs: measuredPing,
    firstConnectedAt: existing ? existing.firstConnectedAt : new Date().toISOString(),
    lastSeen: now,
    isOnline: true,
  };

  sessions[user.id] = sessionData;
  saveLocalPresenceSessions(sessions);

  // 3. Notify sibling tabs
  if (presenceChannel) {
    try {
      presenceChannel.postMessage({ type: 'heartbeat', staffId: user.id, session: sessionData });
    } catch {}
  }

  return { success: true, pingMs: measuredPing };
}

/**
 * Explicitly disconnect staff on app close, tab close, or logout
 */
export function disconnectLocalClient(staffId: string) {
  if (!staffId) return;

  // 1. Remove from local presence sessions
  const sessions = getLocalPresenceSessions();
  if (sessions[staffId]) {
    delete sessions[staffId];
    saveLocalPresenceSessions(sessions);
  }

  // 2. Notify other tabs via BroadcastChannel
  if (presenceChannel) {
    try {
      presenceChannel.postMessage({ type: 'disconnect', staffId });
    } catch {}
  }

  // 3. Inform local Node.js server via Beacon or keepalive fetch
  const baseUrl = getLocalServerBaseUrl();
  if (baseUrl) {
    const disconnectUrl = `${baseUrl}/api/disconnect?staffId=${encodeURIComponent(staffId)}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(disconnectUrl, JSON.stringify({ staffId }));
      } else {
        fetch(disconnectUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staffId }),
          keepalive: true,
        }).catch(() => {});
      }
    } catch {}
  }
}

/**
 * Fetch active garsons connected to local WiFi / Web App.
 * Returns ONLY real, genuinely signed-in staff members.
 * Never returns fake / mock demo data.
 */
export async function fetchConnectedGarsonsList(currentUser?: Staff | null): Promise<ConnectedGarson[]> {
  const baseUrl = getLocalServerBaseUrl();

  // 1. Try to fetch live list from Node.js server
  if (baseUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${baseUrl}/api/garsons`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.garsons)) {
          // If server returned valid array, return it directly!
          return data.garsons;
        }
      }
    } catch {
      // Server offline / unreachable
    }
  }

  // 2. Local fallback from presence sessions store (cross-tab / standalone)
  const now = Date.now();
  const sessions = getLocalPresenceSessions();
  const activeList: ConnectedGarson[] = [];
  let hasPruned = false;

  for (const [id, session] of Object.entries(sessions)) {
    // If no heartbeat in last 8 seconds, mark as closed/inactive
    if (now - session.lastSeen < 8000) {
      activeList.push({ ...session, isOnline: true });
    } else {
      delete sessions[id];
      hasPruned = true;
    }
  }

  // If currentUser is signed in and not yet recorded or outdated, ensure active
  if (currentUser && currentUser.id) {
    const existingIndex = activeList.findIndex((g) => g.id === currentUser.id);
    const selfSession: ConnectedGarson = {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
      deviceName: getDeviceDescription(),
      ip: getCleanDeviceIp(),
      pingMs: 8,
      firstConnectedAt: new Date().toISOString(),
      lastSeen: now,
      isOnline: true,
    };

    if (existingIndex >= 0) {
      activeList[existingIndex] = { ...activeList[existingIndex], lastSeen: now, isOnline: true };
    } else {
      activeList.push(selfSession);
    }
    sessions[currentUser.id] = selfSession;
    hasPruned = true;
  }

  if (hasPruned) {
    saveLocalPresenceSessions(sessions);
  }

  return activeList;
}
