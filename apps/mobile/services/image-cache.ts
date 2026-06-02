import { Image } from 'expo-image';

const pendingImageUrls = new Set<string>();

function normalizeImageUrl(url?: string | null) {
  return typeof url === 'string' ? url.trim() : '';
}

export async function prefetchImageUrl(url?: string | null) {
  const normalizedUrl = normalizeImageUrl(url);
  if (!normalizedUrl || pendingImageUrls.has(normalizedUrl)) {
    return;
  }

  pendingImageUrls.add(normalizedUrl);

  try {
    await Image.prefetch([normalizedUrl], 'disk');
  } catch {
    // Image prefetch should not block screen rendering.
  } finally {
    pendingImageUrls.delete(normalizedUrl);
  }
}

export async function prefetchImageUrls(urls: Array<string | null | undefined>) {
  const uniqueUrls = [...new Set(urls.map((url) => normalizeImageUrl(url)).filter(Boolean))];

  await Promise.all(uniqueUrls.map((url) => prefetchImageUrl(url)));
}
