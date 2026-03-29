// =============================================================
// PWA Hook - Service Worker Registration + Offline Detection
// =============================================================
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface PWAState {
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  offlineQueueCount: number;
  install: () => void;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA(): PWAState {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(
    window.matchMedia('(display-mode: standalone)').matches
  );
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);

  const updateQueueCount = useCallback(() => {
    try {
      const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
      setOfflineQueueCount(queue.length);
    } catch {
      setOfflineQueueCount(0);
    }
  }, []);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('[PWA] Service worker registered:', reg.scope);
      }).catch((err) => {
        console.warn('[PWA] Service worker registration failed:', err);
      });

      // Listen for SW messages (sync complete, etc.)
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SYNC_COMPLETE') {
          const remaining = event.data.remaining || 0;
          if (remaining === 0) {
            toast.success('All offline expenses synced successfully!', { icon: '✅' });
          } else {
            toast.warning(`${remaining} expenses still pending sync.`);
          }
          updateQueueCount();
        }
      });
    }

    // Online/offline detection
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online! Syncing pending expenses...', { icon: '🌐' });
      // Trigger background sync
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then((reg) => {
          (reg as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-expenses');
        });
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are offline. Changes will sync when connection is restored.', {
        icon: '📡',
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // PWA installability
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    // Installed check
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      setIsInstalled(e.matches);
    });

    updateQueueCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, [updateQueueCount]);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsInstallable(false);
      toast.success('ReimburseFlow installed successfully!');
    }
    deferredPrompt = null;
  }, []);

  return { isOnline, isInstallable, isInstalled, offlineQueueCount, install };
}
