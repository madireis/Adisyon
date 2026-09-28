import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Global reference so prompt isn't lost across component re-renders
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const installListeners = new Set<(canInstall: boolean) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    for (const listener of installListeners) {
      try {
        listener(true);
      } catch {}
    }
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    for (const listener of installListeners) {
      try {
        listener(false);
      } catch {}
    }
  });
}

export function usePwaInstall() {
  const [canPrompt, setCanPrompt] = useState<boolean>(() => !!globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://')
    );
  });

  const [isIos, setIsIos] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect iOS (iPhone, iPad, iPod)
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIos(isIosDevice);

    const updateInstallStatus = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(standalone);
    };

    updateInstallStatus();

    const mql = window.matchMedia('(display-mode: standalone)');
    mql.addEventListener('change', updateInstallStatus);

    const listener = (available: boolean) => {
      setCanPrompt(available);
      updateInstallStatus();
    };

    installListeners.add(listener);

    return () => {
      mql.removeEventListener('change', updateInstallStatus);
      installListeners.delete(listener);
    };
  }, []);

  const triggerInstall = async (): Promise<{ outcome: 'accepted' | 'dismissed' | 'ios' | 'unavailable' }> => {
    if (isInstalled) {
      return { outcome: 'accepted' };
    }

    // Android / Chrome / Edge native install prompt
    if (globalDeferredPrompt) {
      try {
        await globalDeferredPrompt.prompt();
        const choice = await globalDeferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          globalDeferredPrompt = null;
          setCanPrompt(false);
          setIsInstalled(true);
        }
        return { outcome: choice.outcome };
      } catch (err) {
        console.warn('[PWA] Prompt error:', err);
      }
    }

    // iOS Safari
    if (isIos) {
      return { outcome: 'ios' };
    }

    return { outcome: 'unavailable' };
  };

  return {
    canInstall: !isInstalled && (canPrompt || isIos),
    isInstalled,
    isIos,
    hasNativePrompt: !!canPrompt,
    triggerInstall,
  };
}
