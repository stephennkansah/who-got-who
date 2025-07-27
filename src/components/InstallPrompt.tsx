import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallButton(false);
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
      // Fallback for iOS and other browsers
      showManualInstallInstructions();
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowInstallButton(false);
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error('Install prompt failed:', error);
      showManualInstallInstructions();
    }
  };

  const showManualInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let instructions = '';
    
    if (isIOS) {
      instructions = 'Tap the Share button and select "Add to Home Screen"';
    } else if (isAndroid) {
      instructions = 'Tap the menu (⋮) and select "Add to Home screen" or "Install app"';
    } else {
      instructions = 'Look for "Install" or "Add to Home Screen" in your browser menu';
    }
    
    alert(`To install Who Got Who:\n\n${instructions}`);
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  // Show manual install button for browsers that don't support beforeinstallprompt
  if (!showInstallButton && !deferredPrompt) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000
      }}>
        <button
          onClick={showManualInstallInstructions}
          style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          📱 Install App
        </button>
      </div>
    );
  }

  if (!showInstallButton) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000
    }}>
      <button
        onClick={handleInstallClick}
        style={{
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          border: 'none',
          borderRadius: '25px',
          padding: '12px 20px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'pulse 2s infinite'
        }}
      >
        📱 Install App
      </button>
      

    </div>
  );
};

export default InstallPrompt; 