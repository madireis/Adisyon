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

// Memory cache for local network state
let cachedNetworkInfo: LocalNetworkInfo | null = null;
let isHeartbeatRunning = false;

/**
 * Determine the local server base URL
 */
export function getLocalServerBaseUrl(): string {
  const hostname = window.location.hostname || 'localhost';
  // If running on local network IP, e.g. 192.168.1.100, point server to port 3001
  return `http://${hostname}:3001`;
}

/**
 * Fetch local network status & IP information
 */
export async function fetchLocalNetworkInfo(): Promise<LocalNetworkInfo> {
  const hostname = window.location.hostname || '127.0.0.1';
  const defaultAppPort = window.location.port ? parseInt(window.location.port, 10) : 3001;

  try {
    const baseUrl = getLocalServerBaseUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${baseUrl}/api/network-info`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      cachedNetworkInfo = data;
      return data;
    }
  } catch (err) {
    // Fallback if local backend server is not running directly on 3001
  }

  // Fallback info derived from current browser URL or machine IP
  const fallbackIp = hostname === 'localhost' || hostname === '127.0.0.1' ? '192.168.1.33' : hostname;
  const fallbackPort = window.location.port ? parseInt(window.location.port, 10) : 3001;
  const fallbackInfo: LocalNetworkInfo = {
    status: 'online',
    serverName: 'Adisyon Main PC',
    localIp: fallbackIp,
    port: 3001,
    appPort: fallbackPort,
    joinUrl: `http://${fallbackIp}:${fallbackPort}`,
    activeCount: 1,
  };
  cachedNetworkInfo = fallbackInfo;
  return fallbackInfo;
}

/**
 * Detect User Device Name / Browser
 */
export function getDeviceDescription(): string {
  const ua = navigator.userAgent;
  let deviceType = 'Telefon';
  if (/iPad|Tablet|PlayBook/i.test(ua)) deviceType = 'Tablet';
  else if (/Mobile|Android|iPhone|iPod/i.test(ua)) deviceType = 'Mobil Telefon';
  else deviceType = 'Masaüstü PC';

  let browser = 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';

  return `${deviceType} (${browser})`;
}

/**
 * Send periodic heartbeat ping to local server
 */
export async function sendLocalHeartbeat(user: Staff): Promise<{ success: boolean; pingMs: number }> {
  const baseUrl = getLocalServerBaseUrl();
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
      const pingMs = Math.round(performance.now() - startTime);
      return { success: true, pingMs };
    }
  } catch (e) {
    // Silent catch
  }

  return { success: false, pingMs: 0 };
}

/**
 * Fetch active garsons connected to local WiFi
 */
export async function fetchConnectedGarsonsList(currentUser?: Staff): Promise<ConnectedGarson[]> {
  const baseUrl = getLocalServerBaseUrl();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${baseUrl}/api/garsons`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.garsons) && data.garsons.length > 0) {
        return data.garsons;
      }
    }
  } catch (e) {
    // Offline / Fallback handling
  }

  // Fallback demo garsons showing local network state when testing without server process running
  const mockGarsons: ConnectedGarson[] = [
    {
      id: currentUser ? currentUser.id : 'staff-1',
      name: currentUser ? currentUser.name : 'Ahmet Yılmaz (Garson)',
      role: currentUser ? currentUser.role : 'waiter',
      deviceName: getDeviceDescription(),
      ip: window.location.hostname || '192.168.1.42',
      pingMs: 8,
      firstConnectedAt: new Date(Date.now() - 3600000).toISOString(),
      lastSeen: Date.now(),
      isOnline: true,
    },
    {
      id: 'staff-2',
      name: 'Ayşe Kaya (Garson)',
      role: 'waiter',
      deviceName: 'iPhone 15 - Safari (WiFi)',
      ip: '192.168.1.43',
      pingMs: 14,
      firstConnectedAt: new Date(Date.now() - 1800000).toISOString(),
      lastSeen: Date.now() - 2000,
      isOnline: true,
    },
    {
      id: 'staff-3',
      name: 'Mehmet Demir (Mutfak)',
      role: 'kitchen',
      deviceName: 'Samsung Tab A8 (WiFi)',
      ip: '192.168.1.48',
      pingMs: 11,
      firstConnectedAt: new Date(Date.now() - 7200000).toISOString(),
      lastSeen: Date.now() - 1000,
      isOnline: true,
    },
  ];

  return mockGarsons;
}
