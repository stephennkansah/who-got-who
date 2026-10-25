import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';

export const isNativeApp = () => Capacitor.isNativePlatform();

// The bundled iPhone app has a local origin. Invites must always point to the website.
export const publicGameOrigin = () => isNativeApp() ? 'https://whogotwho.club' : window.location.origin;

export function invitePath(input: string): string | null {
  try {
    const url = new URL(input);
    const web = url.protocol === 'https:' && ['whogotwho.club', 'www.whogotwho.club'].includes(url.hostname);
    const app = url.protocol === 'whogotwho:' && url.hostname === 'join';
    if ((!web && !app) || (web && url.pathname !== '/')) return null;
    const code = url.searchParams.get('join');
    if (!code || !/^[A-Z0-9]{4,12}$/i.test(code)) return null;
    const type = url.searchParams.get('type') === 'you-got-who' ? '&type=you-got-who' : '';
    return `/?join=${encodeURIComponent(code)}${type}`;
  } catch {
    return null;
  }
}

export function buzz(pattern: number | number[] = 60): void {
  if (isNativeApp()) {
    void Haptics.impact({ style: ImpactStyle.Medium }).catch(() => undefined);
  } else {
    navigator.vibrate?.(pattern);
  }
}

export function isShareCancelled(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || /cancel/i.test(error.message));
}

export async function shareInvite(data: { title: string; text: string; url: string }): Promise<boolean> {
  if (isNativeApp()) {
    await Share.share(data);
    return true;
  }
  if (navigator.share) {
    await navigator.share(data);
    return true;
  }
  return false;
}

export async function shareNativeImage(blob: Blob, text: string): Promise<void> {
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Could not prepare the results image'));
    reader.readAsDataURL(blob);
  });
  const path = `who-got-who-results-${Date.now()}.png`;
  const file = await Filesystem.writeFile({ path, data, directory: Directory.Cache });
  try {
    await Share.share({ files: [file.uri], text });
  } finally {
    await Filesystem.deleteFile({ path, directory: Directory.Cache }).catch(() => undefined);
  }
}

export async function pickNativePhoto(source: 'camera' | 'photos' | 'prompt', selfie = false): Promise<File> {
  const photo = await Camera.getPhoto({
    source: source === 'camera' ? CameraSource.Camera : source === 'photos' ? CameraSource.Photos : CameraSource.Prompt,
    direction: selfie ? CameraDirection.Front : CameraDirection.Rear,
    resultType: CameraResultType.Uri,
    quality: 85,
    width: 1600,
    height: 1600,
    correctOrientation: true,
    saveToGallery: false,
    promptLabelHeader: 'Choose a photo',
  });
  if (!photo.webPath) throw new Error('No photo was selected');
  const response = await fetch(photo.webPath);
  if (!response.ok) throw new Error('The selected photo could not be read');
  const blob = await response.blob();
  return new File([blob], `photo.${photo.format}`, { type: blob.type || `image/${photo.format}` });
}
