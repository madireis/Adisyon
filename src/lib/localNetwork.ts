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
const CLOUD_PRESENCE_URL = 'https://ntfy.sh/wots_pos_presence_madireis_restaurant';

// Generate or retrieve persistent presence client identifier
const PRESENCE_CLIENT_ID: string = (() => {
  if (typeof sessionStorage !== 'undefined') {
    let id = sessionStorage.getItem('wots_presence_client_id');
    if (!id) {
      id = 'pres_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
      sessionStorage.setItem('wots_presence_client_id', id);
    }
    return id;
  }
  return 'pres_' + Math.random().toString(36).substring(2, 9);
})();

// Cross-tab broadcast channel for instantaneous zero-latency presence sync
let presenceChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    presenceChannel = new BroadcastChannel(PRESENCE_CHANNEL_NAME);
  } catch {
    // Unsupported context
  }
}

// Presence listeners for instant UI updates when cloud SSE or local broadcast arrives
type PresenceListener = () => void;
const presenceListeners = new Set<PresenceListener>();

export function subscribeToPresenceUpdates(listener: PresenceListener): () => void {
  presenceListeners.add(listener);
  return () => {
    presenceListeners.delete(listener);
  };
}

function notifyPresenceListeners() {
  for (const listener of presenceListeners) {
    try {
      listener();
    } catch {}
  }
}

export function isTestEnv(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(
      (window.navigator && window.navigator.webdriver) ||
      window.location.search.includes('test=true') ||
      window.location.port === '4173'
    );
  } catch {
    return false;
  }
}

// Setup Cloud SSE Stream for instant cross-device presence (Phone <-> PC)
let cloudPresenceEventSource: EventSource | null = null;

function setupCloudPresenceSSE() {
  if (typeof window === 'undefined' || !window.EventSource) return;
  if (isTestEnv()) return;
  if (cloudPresenceEventSource) return;

  try {
    // ?since=10s drops stale messages and connects directly to live stream
    cloudPresenceEventSource = new EventSource(`${CLOUD_PRESENCE_URL}/sse?since=10s`);

    cloudPresenceEventSource.onmessage = (e) => {
      try {
        const ntfyData = JSON.parse(e.data);
        if (ntfyData.event === 'message' && ntfyData.message) {
          const payload = JSON.parse(ntfyData.message);
          if (payload.senderId === PRESENCE_CLIENT_ID) return; // Ignore self echo

          const now = Date.now();
          const sessions = getLocalPresenceSessions();

          if (payload.type === 'heartbeat' && payload.session && payload.session.id) {
            // Drop stale heartbeats older than 8 seconds
            if (now - (payload.session.lastSeen || 0) < 8000) {
              sessions[payload.session.id] = {
                ...payload.session,
                lastSeen: now,
                isOnline: true,
              };
              saveLocalPresenceSessions(sessions);
              notifyPresenceListeners();
            }
          } else if (payload.type === 'disconnect' && payload.staffId) {
            if (sessions[payload.staffId]) {
              delete sessions[payload.staffId];
              saveLocalPresenceSessions(sessions);
              notifyPresenceListeners();
            }
          }
        }
      } catch {
        // Parse error ignored
      }
    };

    cloudPresenceEventSource.onerror = () => {
      // Native EventSource auto-reconnects
    };
  } catch {
    // Cloud SSE unsupported in this environment
  }
}

if (typeof window !== 'undefined') {
  setupCloudPresenceSSE();
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

  const isWebHosted = hostname.includes('github.io') || 
                      (!/^(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname) && hostname.includes('.'));
  const fallbackIp = hostname === 'localhost' || hostname === '127.0.0.1' ? '192.168.1.33' : hostname;
  const fallbackPort = window.location.port ? parseInt(window.location.port, 10) : 3001;
  
  return {
    status: 'online',
    serverName: isWebHosted ? 'Adisyon Bulut & Web Ağı' : 'Adisyon Yerel Ağ',
    localIp: fallbackIp,
    port: 3001,
    appPort: fallbackPort,
    joinUrl: isWebHosted 
      ? `${window.location.origin}${window.location.pathname}#/login`
      : `http://${fallbackIp}:${fallbackPort}/#/login`,
    activeCount: Object.keys(getLocalPresenceSessions()).length,
  };
}

/**
 * Send periodic heartbeat ping to local server & cloud relay
 * ONLY called if staff member is genuinely signed in!
 */
export async function sendLocalHeartbeat(user: Staff): Promise<{ success: boolean; pingMs: number }> {
  if (!user || !user.id) {
    return { success: false, pingMs: 0 };
  }

  const now = Date.now();
  let measuredPing = 12;
  const baseUrl = getLocalServerBaseUrl();

  // 1. Try sending heartbeat to local Node.js server if available
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

  // 2. Update local presence store (ensures cross-tab & standalone accuracy)
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

  // 3. Notify sibling tabs on same device
  if (presenceChannel) {
    try {
      presenceChannel.postMessage({ type: 'heartbeat', staffId: user.id, session: sessionData });
    } catch {}
  }

  // 4. Publish heartbeat to Cloud Relay for cross-device (Phone <-> PC) sync
  if (!isTestEnv()) {
    try {
      const cloudStart = performance.now();
      fetch(CLOUD_PRESENCE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'heartbeat',
          senderId: PRESENCE_CLIENT_ID,
          session: sessionData,
        }),
      }).then((res) => {
        if (res.ok && !baseUrl) {
          measuredPing = Math.max(1, Math.round(performance.now() - cloudStart));
        }
      }).catch(() => {});
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

  // 4. Inform Cloud Relay immediately (beacon/keepalive guarantees delivery on tab close)
  if (!isTestEnv()) {
    const cloudPayload = JSON.stringify({
      type: 'disconnect',
      senderId: PRESENCE_CLIENT_ID,
      staffId,
    });

    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([cloudPayload], { type: 'application/json' });
        navigator.sendBeacon(CLOUD_PRESENCE_URL, blob);
      } else {
        fetch(CLOUD_PRESENCE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: cloudPayload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {}
  }
}

/**
 * Fetch active garsons connected to local WiFi / Cloud Web App.
 * Returns ONLY real, genuinely signed-in staff members.
 * Supports BOTH local Node.js server AND cloud relay seamlessly.
 */
export async function fetchConnectedGarsonsList(currentUser?: Staff | null): Promise<ConnectedGarson[]> {
  const baseUrl = getLocalServerBaseUrl();
  const now = Date.now();
  const mergedMap = new Map<string, ConnectedGarson>();

  // 1. Fetch live list from Node.js server if local server is active
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
          for (const g of data.garsons) {
            if (g && g.id) {
              mergedMap.set(g.id, { ...g, isOnline: true });
            }
          }
        }
      }
    } catch {
      // Server offline / unreachable
    }
  }

  // 2. Merge sessions from presence sessions store (Cloud SSE + BroadcastChannel updates)
  const sessions = getLocalPresenceSessions();
  let hasPruned = false;

  for (const [id, session] of Object.entries(sessions)) {
    // If no heartbeat in last 8 seconds, mark as closed/inactive
    if (now - session.lastSeen < 8000) {
      const existing = mergedMap.get(id);
      if (!existing || session.lastSeen > existing.lastSeen) {
        mergedMap.set(id, { ...session, isOnline: true });
      }
    } else {
      delete sessions[id];
      hasPruned = true;
    }
  }

  // 3. If currentUser is signed in and not yet recorded or outdated, ensure self is active
  if (currentUser && currentUser.id) {
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
    mergedMap.set(currentUser.id, selfSession);
    sessions[currentUser.id] = selfSession;
    hasPruned = true;
  }

  if (hasPruned) {
    saveLocalPresenceSessions(sessions);
  }

  return Array.from(mergedMap.values());
}
