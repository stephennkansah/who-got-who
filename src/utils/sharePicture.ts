import { isNativeApp, shareNativeImage } from '../services/appPlatform';

/**
 * Hands a picture to the phone's share sheet, or saves it where there is none.
 * Returns which of the two happened. Throws if the player cancels (see isShareCancelled).
 */
export async function sharePicture(blob: Blob, fileName: string, text: string): Promise<'shared' | 'saved'> {
  if (isNativeApp()) {
    await shareNativeImage(blob, text);
    return 'shared';
  }
  const file = new File([blob], fileName, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], text });
    return 'shared';
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'saved';
}
