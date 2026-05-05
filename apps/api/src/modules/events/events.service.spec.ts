import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { EventsService } from './events.service';
import { UitEventsScraper } from './uit-events.scraper';

function createListItem(slug: string) {
  return {
    slug,
    title: slug,
    sourceUrl: `https://www.uit.edu.vn/bai-viet/${slug}`,
    dateLabel: '20-04-2026',
    excerpt: `excerpt-${slug}`,
    thumbnailUrl: `https://www.uit.edu.vn/media/${slug}.jpg`,
  };
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe('EventsService', () => {
  let service: EventsService;
  const configValues: Record<string, number> = {
    UIT_EVENTS_CACHE_TTL_MS: 3_600_000,
    UIT_EVENTS_INITIAL_PAGES: 2,
    UIT_EVENTS_MAX_PAGES: 4,
  };
  const configService = {
    get: jest.fn((key: string, defaultValue?: number) =>
      key in configValues ? configValues[key] : defaultValue,
    ),
  };
  const scraper = {
    fetchAggregatedList: jest.fn(),
    fetchListRange: jest.fn(),
    mergeListItems: jest.fn((...collections: Array<Array<ReturnType<typeof createListItem>>>) => {
      const merged: Array<ReturnType<typeof createListItem>> = [];
      const seen = new Set<string>();
      for (const collection of collections) {
        for (const item of collection) {
          if (seen.has(item.slug)) {
            continue;
          }

          seen.add(item.slug);
          merged.push(item);
        }
      }

      return merged;
    }),
    getMaxPages: jest.fn(() => configValues.UIT_EVENTS_MAX_PAGES),
    fetchArticleDetail: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: UitEventsScraper,
          useValue: scraper,
        },
      ],
    }).compile();

    service = moduleRef.get(EventsService);
  });

  it('returns paginated items from a fast partial snapshot and starts background refresh', async () => {
    scraper.fetchListRange
      .mockResolvedValueOnce([createListItem('event-1'), createListItem('event-2')])
      .mockResolvedValueOnce([createListItem('event-3'), createListItem('event-4')]);

    const result = await service.listEvents('student-1', 1, 10);
    await (service as never as { listRefreshPromise: Promise<void> | null }).listRefreshPromise;

    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(1);
    expect(result.items.map((item) => item.slug)).toEqual(['event-1', 'event-2']);
    expect(scraper.fetchListRange).toHaveBeenNthCalledWith(1, 1, 2);
    expect(scraper.fetchListRange).toHaveBeenNthCalledWith(2, 3, 4);
  });

  it('rejects invalid slug format', async () => {
    await expect(service.getArticleBySlug('student-1', 'bad slug')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns event detail by slug using UIT scraper', async () => {
    scraper.fetchListRange.mockResolvedValue([createListItem('smart-campus-workshop')]);
    scraper.fetchArticleDetail.mockResolvedValue({
      slug: 'smart-campus-workshop',
      title: 'Smart Campus Workshop',
      publishedAtLabel: '20-04-2026',
      excerpt: 'Workshop detail',
      thumbnailUrl: 'https://www.uit.edu.vn/media/workshop-detail.jpg',
      contentHtml: '<p>Agenda</p>',
      sourceUrl: 'https://www.uit.edu.vn/bai-viet/smart-campus-workshop',
    });

    const result = await service.getArticleBySlug('student-1', 'smart-campus-workshop');

    expect(result).toMatchObject({
      slug: 'smart-campus-workshop',
      excerpt: 'excerpt-smart-campus-workshop',
      thumbnailUrl: 'https://www.uit.edu.vn/media/smart-campus-workshop.jpg',
      sourceUrl: 'https://www.uit.edu.vn/bai-viet/smart-campus-workshop',
    });
  });

  it('throws not found when UIT detail is missing', async () => {
    scraper.fetchListRange.mockResolvedValue([]);
    scraper.fetchArticleDetail.mockResolvedValue(null);

    await expect(
      service.getArticleBySlug('student-1', 'missing-event'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('reuses the in-memory list cache while it is still fresh', async () => {
    scraper.fetchListRange
      .mockResolvedValueOnce([createListItem('event-1')])
      .mockResolvedValueOnce([]);

    await service.listEvents('student-1', 1, 10);
    const result = await service.listEvents('student-1', 1, 10);

    expect(result.items).toHaveLength(1);
    expect(scraper.fetchListRange).toHaveBeenCalledTimes(2);
  });

  it('reuses the in-memory detail cache while it is still fresh', async () => {
    scraper.fetchListRange.mockResolvedValue([createListItem('smart-campus-workshop')]);
    scraper.fetchArticleDetail.mockResolvedValueOnce({
      slug: 'smart-campus-workshop',
      title: 'Smart Campus Workshop',
      publishedAtLabel: '20-04-2026',
      excerpt: 'Workshop detail',
      thumbnailUrl: 'https://www.uit.edu.vn/media/workshop-detail.jpg',
      contentHtml: '<p>Agenda</p>',
      sourceUrl: 'https://www.uit.edu.vn/bai-viet/smart-campus-workshop',
    });

    await service.getArticleBySlug('student-1', 'smart-campus-workshop');
    const result = await service.getArticleBySlug('student-1', 'smart-campus-workshop');

    expect(result.slug).toBe('smart-campus-workshop');
    expect(scraper.fetchArticleDetail).toHaveBeenCalledTimes(1);
  });

  it('throws service unavailable when partial scrape has no cache fallback', async () => {
    scraper.fetchListRange.mockRejectedValue(new Error('Network error'));

    await expect(service.listEvents('student-1', 1, 10)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('falls back to stale cache when a refresh-time partial scrape fails', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-05T00:00:00.000Z'));

    scraper.fetchListRange
      .mockResolvedValueOnce([createListItem('event-1')])
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('refresh failed'));

    await service.listEvents('student-1', 1, 10);
    jest.advanceTimersByTime(configValues.UIT_EVENTS_CACHE_TTL_MS + 1);

    const result = await service.listEvents('student-1', 1, 10);

    expect(result.items.map((item) => item.slug)).toEqual(['event-1']);
    expect(scraper.fetchListRange).toHaveBeenCalledTimes(3);

    jest.useRealTimers();
  });

  it('keeps serving partial cache when background refresh fails', async () => {
    scraper.fetchListRange
      .mockResolvedValueOnce([createListItem('event-1'), createListItem('event-2')])
      .mockRejectedValueOnce(new Error('background failed'));

    const firstResult = await service.listEvents('student-1', 1, 10);
    await (service as never as { listRefreshPromise: Promise<void> | null }).listRefreshPromise;
    const secondResult = await service.listEvents('student-1', 1, 10);

    expect(firstResult.items.map((item) => item.slug)).toEqual(['event-1', 'event-2']);
    expect(secondResult.items.map((item) => item.slug)).toEqual(['event-1', 'event-2']);
  });

  it('merges background pages into cache after refresh completes', async () => {
    scraper.fetchListRange
      .mockResolvedValueOnce([createListItem('event-1'), createListItem('event-2')])
      .mockResolvedValueOnce([createListItem('event-2'), createListItem('event-3')]);

    await service.listEvents('student-1', 1, 10);
    await (service as never as { listRefreshPromise: Promise<void> | null }).listRefreshPromise;
    const result = await service.listEvents('student-1', 1, 10);

    expect(result.items.map((item) => item.slug)).toEqual(['event-1', 'event-2', 'event-3']);
    expect(result.total).toBe(3);
  });

  it('starts only one background refresh while a previous refresh is still running', async () => {
    const backgroundRefresh = createDeferred<Array<ReturnType<typeof createListItem>>>();
    scraper.fetchListRange
      .mockResolvedValueOnce([createListItem('event-1'), createListItem('event-2')])
      .mockImplementationOnce(() => backgroundRefresh.promise);

    await service.listEvents('student-1', 1, 10);
    const secondResult = await service.listEvents('student-1', 1, 10);

    expect(secondResult.items.map((item) => item.slug)).toEqual(['event-1', 'event-2']);
    expect(scraper.fetchListRange).toHaveBeenCalledTimes(2);

    backgroundRefresh.resolve([createListItem('event-3')]);
    await (service as never as { listRefreshPromise: Promise<void> | null }).listRefreshPromise;
  });
});
