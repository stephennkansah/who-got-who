// Notification service for PWA notifications
export class NotificationService {
  private static permission: NotificationPermission | null = null;

  // Request notification permission
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      return true;
    }

    if (Notification.permission === 'denied') {
      this.permission = 'denied';
      return false;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  // Check if notifications are supported and permitted
  static canShowNotifications(): boolean {
    return (
      'Notification' in window &&
      Notification.permission === 'granted'
    );
  }

  // Show a notification
  static showNotification(title: string, options?: NotificationOptions): void {
    if (!this.canShowNotifications()) {
      return;
    }

    const defaultOptions: NotificationOptions = {
      icon: '/logo192.png',
      badge: '/logo192.png',
      ...options
    };

    try {
      const notification = new Notification(title, defaultOptions);
      
      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Focus app when notification is clicked
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  // Show game-specific notifications
  static showPlayerGotPlayer(playerName: string, targetName: string): void {
    this.showNotification(
      '🎯 Gotcha!',
      {
        body: `${playerName} got ${targetName}!`,
        tag: 'gotcha',
        requireInteraction: false
      }
    );
  }

  static showPlayerGotCaught(playerName: string, catcherName: string): void {
    this.showNotification(
      '😅 Caught!',
      {
        body: `${catcherName} caught ${playerName}!`,
        tag: 'caught',
        requireInteraction: false
      }
    );
  }

  static showTaskFailed(playerName: string): void {
    this.showNotification(
      '❌ Task Failed',
      {
        body: `${playerName} failed a task`,
        tag: 'failed',
        requireInteraction: false
      }
    );
  }

  static showGameStarted(): void {
    this.showNotification(
      '🚀 Game Started!',
      {
        body: 'The game has begun. Check your tasks!',
        tag: 'game-start',
        requireInteraction: false
      }
    );
  }

  static showGameEnded(winnerName: string): void {
    this.showNotification(
      '🏆 Game Over!',
      {
        body: `${winnerName} wins the game!`,
        tag: 'game-end',
        requireInteraction: true
      }
    );
  }

  // Initialize notifications (call this on app start)
  static async initialize(): Promise<void> {
    // Only request permission if it hasn't been decided yet
    if (Notification.permission === 'default') {
      // Don't auto-request, let the user decide when they want notifications
      console.log('Notifications available but not requested yet');
    }
  }
}

export default NotificationService; 