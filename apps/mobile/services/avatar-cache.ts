import { Image } from 'expo-image';

const pendingAvatarUrls = new Set<string>();

export async function prefetchAvatarUrl(url?: string | null) {
  const normalizedUrl = typeof url === 'string' ? url.trim() : '';
  if (!normalizedUrl || pendingAvatarUrls.has(normalizedUrl)) {
    return;
  }

  pendingAvatarUrls.add(normalizedUrl);

  try {
    await Image.prefetch([normalizedUrl], 'disk');
  } catch {
    // Avatar prefetch should not block auth/profile flows.
  } finally {
    pendingAvatarUrls.delete(normalizedUrl);
  }
}
