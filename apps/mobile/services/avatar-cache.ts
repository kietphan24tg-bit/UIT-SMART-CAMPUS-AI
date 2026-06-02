import { prefetchImageUrl } from './image-cache';

export async function prefetchAvatarUrl(url?: string | null) {
  await prefetchImageUrl(url);
}
