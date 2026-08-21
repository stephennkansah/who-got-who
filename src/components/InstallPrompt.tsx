import React, { useState, useEffect } from 'react';
import { showToast } from './common/Toast';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'wgw-install-dismissed';

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === 'true',
  );

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const showManualInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
      showToast('To install: tap the Share button, then "Add to Home Screen".', 'info');
    } else if (isAndroid) {
      showToast('To install: open the browser menu (⋮), then "Add to Home screen".', 'info');
    } else {
      showToast('Look for "Install app" or "Add to Home Screen" in your browser menu.', 'info');
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      showManualInstallInstructions();
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } catch {
      showManualInstallInstructions();
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setIsDismissed(true);
  };

  if (isInstalled || isDismissed) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
      right: '16px',
      zIndex: 900,
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    }}>
      <button
        onClick={handleInstallClick}
        style={{
          background: 'var(--primary-gradient)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 16px',
          fontSize: '13px',
          fontWeight: 700,
          boxShadow: '0 3px 0 var(--primary-deep)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        Install App
      </button>
      <button
        onClick={handleDismiss}
        aria-label="Hide install button"
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          background: 'var(--ink-2)',
          color: 'var(--text-muted)',
          border: '1px solid var(--line-strong)',
          fontSize: '13px',
          fontWeight: 700,
        }}
      >
        ✕
      </button>
    </div>
  );
};

export default InstallPrompt;
