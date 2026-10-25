// System notifications for when the game is open but not on screen.
export class NotificationService {
  static isSupported(): boolean {
    return 'Notification' in window;
  }

  static async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    return (await Notification.requestPermission()) === 'granted';
  }

  static canShowNotifications(): boolean {
    return this.isSupported() && Notification.permission === 'granted';
  }

  /** Shows a notification only when the app is in the background. */
  static notifyIfHidden(title: string, body: string, tag: string, renotify = false): void {
    if (document.visibilityState === 'visible') return;
    // A same-tag notification replaces the old one silently unless renotify is set: right when
    // a server push already buzzed for this event, wrong for a shared tag like the feed.
    this.showNotification(title, { body, tag, renotify });
  }

  static showNotification(title: string, options?: NotificationOptions): void {
    if (!this.canShowNotifications()) return;
    const defaults: NotificationOptions = { icon: '/logo192.png', badge: '/logo192.png', ...options };
    const pageNotification = () => {
      try {
        const notification = new Notification(title, defaults);
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch {
        // Some browsers only allow notifications from a service worker.
      }
    };
    // Prefer the service worker (required on Android); fall back to the page API.
    if (!('serviceWorker' in navigator)) {
      pageNotification();
      return;
    }
    navigator.serviceWorker
      .getRegistration()
      .then((registration) =>
        registration ? registration.showNotification(title, defaults) : pageNotification(),
      )
      .catch(pageNotification);
  }
}

export default NotificationService;
