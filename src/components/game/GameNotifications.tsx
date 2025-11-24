import React, { useEffect } from 'react';

interface Notification {
  id: string;
  message: string;
  type: string;
}

interface GameNotificationsProps {
  notifications: Notification[];
}

export const GameNotifications: React.FC<GameNotificationsProps> = ({ notifications }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      maxWidth: '300px'
    }}>
      {notifications.map(notification => (
        <div
          key={notification.id}
          style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            fontSize: '0.9rem',
            fontWeight: '600',
            animation: 'slideInRight 0.3s ease-out',
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          {notification.message}
        </div>
      ))}
    </div>
  );
};

