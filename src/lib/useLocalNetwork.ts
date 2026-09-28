import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '@/lib/store';
import {
  fetchLocalNetworkInfo,
  fetchConnectedGarsonsList,
  sendLocalHeartbeat,
  disconnectLocalClient,
  type LocalNetworkInfo,
  type ConnectedGarson,
} from '@/lib/localNetwork';

export function useLocalNetwork() {
  const { state } = useApp();
  const currentUser = state.currentUser;
  const currentUserIdRef = useRef<string | null>(currentUser?.id || null);

  useEffect(() => {
    currentUserIdRef.current = currentUser?.id || null;
  }, [currentUser]);

  const [networkInfo, setNetworkInfo] = useState<LocalNetworkInfo | null>(null);
  const [connectedGarsons, setConnectedGarsons] = useState<ConnectedGarson[]>([]);
  const [isWifiConnected, setIsWifiConnected] = useState<boolean>(true);
  const [pingMs, setPingMs] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);

  // Refresh network info and garsons list
  const refresh = useCallback(async () => {
    try {
      const info = await fetchLocalNetworkInfo();
      setNetworkInfo(info);

      // Only send heartbeat if a user is genuinely signed in!
      if (currentUser && currentUser.id) {
        const hbResult = await sendLocalHeartbeat(currentUser);
        setIsWifiConnected(hbResult.success || info.status === 'online');
        if (hbResult.pingMs > 0) setPingMs(hbResult.pingMs);
      } else {
        setIsWifiConnected(info.status === 'online');
      }

      const list = await fetchConnectedGarsonsList(currentUser);
      setConnectedGarsons(list);
    } catch {
      setIsWifiConnected(false);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Hook lifecycle: Periodic refresh, BroadcastChannel, beforeunload & pagehide
  useEffect(() => {
    refresh();

    // 1. Periodic heartbeat & poll every 3 seconds
    const intervalId = setInterval(() => {
      refresh();
    }, 3000);

    // 2. Real-time BroadcastChannel listener for instantaneous updates
    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('wots_presence_channel');
        channel.onmessage = () => {
          fetchConnectedGarsonsList(currentUser).then(setConnectedGarsons);
        };
      } catch {}
    }

    // 3. Immediate disconnect on window close / page hide / tab close
    const handleClose = () => {
      const id = currentUserIdRef.current;
      if (id) {
        disconnectLocalClient(id);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };

    window.addEventListener('beforeunload', handleClose);
    window.addEventListener('pagehide', handleClose);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      if (channel) {
        channel.close();
      }
      window.removeEventListener('beforeunload', handleClose);
      window.removeEventListener('pagehide', handleClose);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refresh, currentUser]);

  return {
    networkInfo,
    connectedGarsons,
    isWifiConnected,
    pingMs,
    loading,
    refresh,
    activeGarsonCount: connectedGarsons.filter((g) => g.isOnline).length,
  };
}
