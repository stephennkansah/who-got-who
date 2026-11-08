// Lock-screen alerts in the iPhone app: the phone registers with Apple and the
// game server sends through Apple's push service. (Browsers use pushService.ts.)
import { PushNotifications } from '@capacitor/push-notifications';
import { isNativeApp } from './appPlatform';

export type NativePushState = 'granted' | 'denied' | 'prompt' | 'unsupported';

export async function nativePushState(): Promise<NativePushState> {
  if (!isNativeApp()) return 'unsupported';
  try {
    const { receive } = await PushNotifications.checkPermissions();
    if (receive === 'granted' || receive === 'denied') return receive;
    return 'prompt';
  } catch {
    return 'unsupported';
  }
}

/** Shows iOS's own "Allow notifications?" question. True if the player said yes. */
export async function requestNativePush(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const { receive } = await PushNotifications.requestPermissions();
    return receive === 'granted';
  } catch {
    return false;
  }
}

let tokenPromise: Promise<string | null> | null = null;

/**
 * This phone's Apple device token, once notifications are allowed. Null when
 * they aren't, or Apple doesn't answer within 15 seconds.
 */
export function nativePushToken(): Promise<string | null> {
  if (!isNativeApp()) return Promise.resolve(null);
  if (!tokenPromise) {
    tokenPromise = registerForToken().then((token) => {
      if (!token) tokenPromise = null; // try again next time
      return token;
    });
  }
  return tokenPromise;
}

async function registerForToken(): Promise<string | null> {
  if ((await nativePushState()) !== 'granted') return null;
  let settle: (token: string | null) => void = () => undefined;
  const answer = new Promise<string | null>((resolve) => {
    settle = resolve;
  });
  const listeners = await Promise.all([
    PushNotifications.addListener('registration', (token) => settle(token.value)),
    PushNotifications.addListener('registrationError', () => settle(null)),
  ]);
  const timer = window.setTimeout(() => settle(null), 15000);
  try {
    await PushNotifications.register();
    return await answer;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
    listeners.forEach((listener) => void listener.remove());
  }
}
