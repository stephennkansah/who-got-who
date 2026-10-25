import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { showToast } from './common/Toast';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'wgw-install-dismissed';

export type InstallPlatform = 'ios' | 'android' | 'in-app' | 'other';

/** Which install steps fit this browser. In-app browsers (Instagram, Facebook…) can't install at all. */
export function detectPlatform(userAgent: string, maxTouchPoints = 0): InstallPlatform {
  if (/FBAN|FBAV|FB_IAB|Instagram|Snapchat|TikTok|musical_ly|Line\//i.test(userAgent)) return 'in-app';
  // iPads report a Mac user agent; touch support gives them away.
  if (/iPad|iPhone|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(userAgent)) return 'android';
  return 'other';
}

const STEPS: Record<InstallPlatform, string[]> = {
  ios: [
    'Tap the Share button (the square with an arrow) in the browser toolbar.',
    'Scroll down, tap “Add to Home Screen”, then “Add”.',
    'Open Who Got Who from your Home Screen.',
  ],
  android: [
    'Tap the ⋮ menu at the top right of Chrome.',
    'Tap “Install app” or “Add to Home screen”.',
    'Open Who Got Who from your home screen.',
  ],
  'in-app': [
    'This page is open inside another app, which can’t install it.',
    'Tap the ••• or share menu and choose “Open in Safari” or “Open in Chrome”.',
    'Then tap Install App again from there.',
  ],
  other: [
    'Look for the install icon in the address bar,',
    'or “Install app” / “Add to Home Screen” in the browser menu.',
  ],
};

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [isDismissed, setIsDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === 'true',
  );
  const platform = detectPlatform(navigator.userAgent, navigator.maxTouchPoints);

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

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowSteps(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } catch {
      setShowSteps(true);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Link copied — paste it into Safari or Chrome', 'success');
    } catch {
      showToast('Copy the address from the menu instead', 'info');
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
    <>
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

      <Modal isOpen={showSteps} onClose={() => setShowSteps(false)} ariaLabel="How to install Who Got Who" showClose>
        <h2 style={{ margin: '0 0 0.5rem' }}>Install the App</h2>
        <p className="text-small" style={{ marginBottom: '1rem' }}>
          It opens full screen like a normal app, and you can find the game again in one tap.
        </p>
        <ol style={{ margin: '0 0 1rem', paddingLeft: '1.3rem', textAlign: 'left', lineHeight: 1.5 }}>
          {STEPS[platform].map((step) => (
            <li key={step} style={{ marginBottom: '0.45rem' }}>{step}</li>
          ))}
        </ol>
        {platform === 'ios' && (
          <p className="text-small" style={{ marginBottom: '1rem', textAlign: 'left' }}>
            <strong>Install before you join a game.</strong> The Home Screen app can start without
            the games you joined in the browser.
          </p>
        )}
        {platform === 'in-app' ? (
          <button className="btn btn-primary" onClick={copyLink}>
            Copy Link
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => setShowSteps(false)}>
            Got It
          </button>
        )}
      </Modal>
    </>
  );
};

export default InstallPrompt;
