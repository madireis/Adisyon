import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/lib/store';
import {
  fetchLocalNetworkInfo,
  fetchConnectedGarsonsList,
  sendLocalHeartbeat,
  type LocalNetworkInfo,
  type ConnectedGarson,
} from '@/lib/localNetwork';

export function useLocalNetwork() {
  const { state } = useApp();
  const currentUser = state.currentUser;

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

      if (currentUser) {
        const hbResult = await sendLocalHeartbeat(currentUser);
        setIsWifiConnected(hbResult.success || info.status === 'online');
        if (hbResult.pingMs > 0) setPingMs(hbResult.pingMs);
      }

      const list = await fetchConnectedGarsonsList(currentUser);
      setConnectedGarsons(list);
    } catch (err) {
      setIsWifiConnected(false);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Initial load and periodic interval (every 4 seconds)
  useEffect(() => {
    refresh();

    const intervalId = setInterval(() => {
      refresh();
    }, 4000);

    return () => clearInterval(intervalId);
  }, [refresh]);

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
