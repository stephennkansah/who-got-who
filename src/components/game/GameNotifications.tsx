import React from 'react';

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
    <div className="notification-stack" role="status" aria-live="polite">
      {notifications.map(notification => (
        <div key={notification.id} className="notification-toast">
          {notification.message}
        </div>
      ))}
    </div>
  );
};
