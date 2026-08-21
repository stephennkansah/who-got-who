import React, { useState, useEffect } from 'react';
import NotificationService from '../services/notificationService';

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

  useEffect(() => {
    // Check if we should show the prompt
    if ('Notification' in window) {
      setPermission(Notification.permission);
      // Show prompt if permission hasn't been decided and user hasn't dismissed it
      const hasPrompted = localStorage.getItem('notification-prompted');
      if (Notification.permission === 'default' && !hasPrompted) {
        setShowPrompt(true);
      }
    }
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await NotificationService.requestPermission();
    
    if (granted) {
      setPermission('granted');
      onPermissionGranted?.();
      // Test notification
      NotificationService.showNotification(
        '🎉 Notifications Enabled!',
        {
          body: "You'll now get updates when players complete tasks",
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

  if (!('Notification' in window)) {
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
      <div style={{ fontSize: '24px', marginBottom: '8px' }} aria-hidden="true">🔔</div>
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
        Get a ping when someone claims a gotcha or gets caught — perfect for background play.
      </p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button
          onClick={handleEnableNotifications}
          style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.transform = 'translateY(0)';
          }}
        >
          ✅ Enable
        </button>
        <button
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            color: 'var(--warning-ink)',
            border: '2px solid var(--warning-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
};

export default NotificationPrompt; 