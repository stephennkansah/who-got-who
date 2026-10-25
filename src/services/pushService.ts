// Web Push: lets the game server buzz this phone while it is locked or the
// game is in the background. Android browsers support it; iPhones only once
// the app is added to the Home Screen (iOS 16.4+).

/** Fired once the player allows notifications, so the open game can subscribe straight away. */
export const PUSH_PERMISSION_EVENT = 'wgw-push-permission';

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function keyBytes(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function sameKey(current: ArrayBuffer | null, wanted: Uint8Array): boolean {
  if (!current || current.byteLength !== wanted.length) return false;
  const bytes = new Uint8Array(current);
  return bytes.every((byte, index) => byte === wanted[index]);
}

/**
 * This phone's push subscription for the server's key, creating one if needed.
 * Null when push isn't possible here: no support, no permission, or no service
 * worker (development builds don't register one).
 */
export async function currentPushSubscription(serverKey: string): Promise<PushSubscriptionJSON | null> {
  if (!isPushSupported() || Notification.permission !== 'granted') return null;
  if (!(await navigator.serviceWorker.getRegistration())) return null;
  const registration = await navigator.serviceWorker.ready;
  const key = keyBytes(serverKey);
  let subscription = await registration.pushManager.getSubscription();
  // A subscription made for another server key can't receive this server's pushes.
  if (subscription && !sameKey(subscription.options.applicationServerKey, key)) {
    await subscription.unsubscribe();
    subscription = null;
  }
  subscription =
    subscription || (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key }));
  return subscription.toJSON();
}
