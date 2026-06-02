import { USER_ROLES } from '@smart-campus/shared';
import type { QueryClient } from '@tanstack/react-query';

import { canteenApi } from '@/services/api/canteen';
import { libraryApi } from '@/services/api/library';
import { studyMaterialsApi } from '@/services/api/study-materials';
import { prefetchImageUrls } from '@/services/image-cache';

const LIBRARY_DISCOVERY_QUERY_KEY = ['library', 'books', '', undefined] as const;
const STUDY_MATERIALS_DISCOVERY_QUERY_KEY = ['study-materials', 'list', '', 'all'] as const;

function canWarmCampusDiscovery(role?: string | null) {
  return role === USER_ROLES.STUDENT || role === USER_ROLES.LECTURER;
}

function canWarmStudyMaterials(role?: string | null) {
  return (
    role === USER_ROLES.STUDENT ||
    role === USER_ROLES.LECTURER ||
    role === USER_ROLES.ADMIN ||
    role === USER_ROLES.SUPER_ADMIN
  );
}

function isImageStudyMaterial(mimeType?: string | null) {
  return Boolean(mimeType?.startsWith('image/'));
}

function isMissingStudyMaterialsRoute(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as {
    status?: unknown;
    statusCode?: unknown;
    message?: unknown;
    response?: { status?: unknown; data?: { message?: unknown } | unknown } | unknown;
  };
  const response =
    candidate.response && typeof candidate.response === 'object'
      ? (candidate.response as { status?: unknown; data?: { message?: unknown } | unknown })
      : null;
  const message =
    typeof candidate.message === 'string'
      ? candidate.message
      : response?.data &&
          typeof response.data === 'object' &&
          'message' in response.data &&
          typeof response.data.message === 'string'
        ? response.data.message
        : '';
  const status = candidate.statusCode ?? candidate.status ?? response?.status;

  return (status === 404 || status === '404') && message.includes('Cannot GET');
}

export async function warmCampusServices(queryClient: QueryClient, role?: string | null) {
  if (!canWarmCampusDiscovery(role)) {
    return;
  }

  const [canteenResult, libraryResult] = await Promise.allSettled([
    queryClient.fetchQuery({
      queryKey: ['canteen', 'catalog'],
      queryFn: () => canteenApi.getCatalog(),
    }),
    queryClient.fetchQuery({
      queryKey: LIBRARY_DISCOVERY_QUERY_KEY,
      queryFn: () => libraryApi.listBooks({ limit: 30 }),
    }),
  ]);

  const imageUrls: Array<string | null | undefined> = [];

  if (canteenResult.status === 'fulfilled') {
    imageUrls.push(
      ...canteenResult.value.flatMap((category) =>
        category.products.map((product) => product.imageUrl),
      ),
    );
  }

  if (libraryResult.status === 'fulfilled') {
    imageUrls.push(...libraryResult.value.items.map((book) => book.coverUrl));
  }

  await prefetchImageUrls(imageUrls);
}

export async function warmStudyMaterialsService(queryClient: QueryClient, role?: string | null) {
  if (!canWarmStudyMaterials(role)) {
    return;
  }

  let materials: Awaited<ReturnType<typeof studyMaterialsApi.list>> | null = null;

  try {
    materials = await queryClient.fetchQuery({
      queryKey: STUDY_MATERIALS_DISCOVERY_QUERY_KEY,
      queryFn: () => studyMaterialsApi.list({ limit: 50 }),
    });
  } catch (error) {
    // Warmup is best-effort only. If the backend deployment has not exposed the
    // study-materials route yet, we should avoid surfacing a startup RedBox.
    if (isMissingStudyMaterialsRoute(error)) {
      return;
    }

    return;
  }

  if (!materials) {
    return;
  }

  await prefetchImageUrls(
    materials.items.map((item) => (isImageStudyMaterial(item.mimeType) ? item.fileUrl : null)),
  );
}
