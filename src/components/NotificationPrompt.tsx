import React, { useState, useEffect } from 'react';
import NotificationService from '../services/notificationService';
import { PUSH_PERMISSION_EVENT } from '../services/pushService';
import { isNativeApp } from '../services/appPlatform';
import { nativePushState, requestNativePush } from '../services/nativePushService';

interface NotificationPromptProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

const NotificationPrompt: React.FC<NotificationPromptProps> = ({
  onPermissionGranted,
  onPermissionDenied
}) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  // In the iPhone app, alerts come through Apple rather than the browser.
  const native = isNativeApp();

  useEffect(() => {
    if (native) {
      if (localStorage.getItem('notification-prompted')) return undefined;
      let active = true;
      void nativePushState().then((state) => {
        if (active && state === 'prompt') setShowPrompt(true);
      });
      return () => {
        active = false;
      };
    }
    // Check if we should show the prompt
    if ('Notification' in window) {
      setPermission(Notification.permission);
      // Show prompt if permission hasn't been decided and user hasn't dismissed it
      const hasPrompted = localStorage.getItem('notification-prompted');
      if (Notification.permission === 'default' && !hasPrompted) {
        setShowPrompt(true);
      }
    }
    return undefined;
  }, [native]);

  const handleEnableNotifications = async () => {
    if (native) {
      const allowed = await requestNativePush();
      setPermission(allowed ? 'granted' : 'denied');
      if (allowed) {
        onPermissionGranted?.();
        window.dispatchEvent(new Event(PUSH_PERMISSION_EVENT));
      } else {
        onPermissionDenied?.();
      }
      localStorage.setItem('notification-prompted', 'true');
      setShowPrompt(false);
      return;
    }
    const granted = await NotificationService.requestPermission();

    if (granted) {
      setPermission('granted');
      onPermissionGranted?.();
      window.dispatchEvent(new Event(PUSH_PERMISSION_EVENT));
      // Test notification
      NotificationService.showNotification(
        'Notifications on',
        {
          body: "We'll buzz you when someone claims a gotcha on you.",
          tag: 'welcome'
        }
      );
    } else {
      setPermission('denied');
      onPermissionDenied?.();
    }

    localStorage.setItem('notification-prompted', 'true');
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('notification-prompted', 'true');
    setShowPrompt(false);
  };

  if (!native && !('Notification' in window)) {
    return null; // Browser doesn't support notifications
  }

  // Respect the player's decision — once dismissed or decided, stay quiet.
  if (!showPrompt || permission === 'granted') {
    return null;
  }

  return (
    <div style={{
      background: 'var(--warning-soft)',
      border: '1px solid var(--warning-border)',
      borderRadius: 'var(--radius-md)',
      padding: '18px',
      margin: '0 0 0.9rem',
      textAlign: 'center'
    }}>
      <h3 style={{
        color: 'var(--warning-ink)',
        marginBottom: '8px',
        fontSize: '1.05em',
        fontWeight: 700
      }}>
        Stay in the loop
      </h3>
      <p style={{
        color: 'var(--warning-ink)',
        marginBottom: '14px',
        fontSize: '0.88em',
        lineHeight: 1.45
      }}>
        Get a buzz when someone claims a gotcha on you or the group needs your vote,
        even with your phone locked.
      </p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button
          onClick={handleEnableNotifications}
          className="btn btn-success btn-small"
        >
          Turn On
        </button>
        <button
          onClick={handleDismiss}
          className="btn btn-small"
          style={{
            background: 'transparent',
            color: 'var(--warning-ink)',
            border: '2px solid var(--warning-border)',
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
};

export default NotificationPrompt;
