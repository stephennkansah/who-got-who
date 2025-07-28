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

  const handleReset = async () => {
    localStorage.removeItem('notification-prompted');
    if (Notification.permission === 'default') {
      setShowPrompt(true);
    } else {
      await handleEnableNotifications();
    }
  };

  if (!('Notification' in window)) {
    return null; // Browser doesn't support notifications
  }

  // Show compact enable button if notifications are denied/default but user hasn't been prompted
  if (permission !== 'granted' && !showPrompt) {
    return (
      <button
        onClick={handleReset}
        style={{
          background: 'linear-gradient(135deg, #f59e0b, #f97316)',
          color: 'white',
          border: 'none',
          borderRadius: '20px',
          padding: '8px 16px',
          fontSize: '12px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
          transition: 'all 0.3s ease',
          margin: '10px 0'
        }}
        onMouseEnter={(e) => {
          const target = e.target as HTMLButtonElement;
          target.style.transform = 'translateY(-1px)';
          target.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.4)';
        }}
        onMouseLeave={(e) => {
          const target = e.target as HTMLButtonElement;
          target.style.transform = 'translateY(0)';
          target.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.3)';
        }}
        title="Get notified when players complete tasks"
      >
        🔔 Enable Notifications
      </button>
    );
  }

  if (!showPrompt) {
    return null;
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
      border: '2px solid #f59e0b',
      borderRadius: '15px',
      padding: '20px',
      margin: '15px 0',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔔</div>
      <h3 style={{ 
        color: '#92400e', 
        marginBottom: '10px', 
        fontSize: '1.1em',
        fontWeight: '700'
      }}>
        Stay Updated!
      </h3>
      <p style={{ 
        color: '#78350f', 
        marginBottom: '15px', 
        fontSize: '0.9em',
        lineHeight: '1.4'
      }}>
        Get notifications when players complete tasks or get caught. Perfect for background gameplay!
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
            background: '#f3f4f6',
            color: '#6b7280',
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
            target.style.background = '#e5e7eb';
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.background = '#f3f4f6';
          }}
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
};

export default NotificationPrompt; 