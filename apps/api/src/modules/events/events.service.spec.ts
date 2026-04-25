import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { EventsService } from './events.service';
import { UitEventsScraper } from './uit-events.scraper';

describe('EventsService', () => {
  let service: EventsService;
  const configService = {
    get: jest.fn((key: string, defaultValue?: number) =>
      key === 'UIT_EVENTS_CACHE_TTL_MS' ? 900_000 : defaultValue,
    ),
  };
  const scraper = {
    fetchAggregatedList: jest.fn(),
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

  it('returns paginated items from UIT list cache', async () => {
    scraper.fetchAggregatedList.mockResolvedValue([
      {
        slug: 'smart-campus-workshop',
        title: 'Smart Campus Workshop',
        sourceUrl: 'https://www.uit.edu.vn/bai-viet/smart-campus-workshop',
        dateLabel: '20-04-2026',
        excerpt: 'Workshop',
        thumbnailUrl: 'https://www.uit.edu.vn/media/workshop.jpg',
      },
    ]);

    const result = await service.listEvents('student-1', 1, 10);

    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.items[0]).toMatchObject({
      slug: 'smart-campus-workshop',
      sourceUrl: 'https://www.uit.edu.vn/bai-viet/smart-campus-workshop',
      excerpt: 'Workshop',
    });
  });

  it('rejects invalid slug format', async () => {
    await expect(service.getArticleBySlug('student-1', 'bad slug')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns event detail by slug using UIT scraper', async () => {
    scraper.fetchAggregatedList.mockResolvedValue([
      {
        slug: 'smart-campus-workshop',
        title: 'Smart Campus Workshop',
        sourceUrl: 'https://www.uit.edu.vn/bai-viet/smart-campus-workshop',
        dateLabel: '20-04-2026',
        excerpt: 'Workshop',
        thumbnailUrl: 'https://www.uit.edu.vn/media/workshop.jpg',
      },
    ]);
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
      excerpt: 'Workshop',
      thumbnailUrl: 'https://www.uit.edu.vn/media/workshop.jpg',
      sourceUrl: 'https://www.uit.edu.vn/bai-viet/smart-campus-workshop',
    });
  });

  it('throws not found when UIT detail is missing', async () => {
    scraper.fetchAggregatedList.mockResolvedValue([]);
    scraper.fetchArticleDetail.mockResolvedValue(null);

    await expect(
      service.getArticleBySlug('student-1', 'missing-event'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('reuses the in-memory list cache while it is still fresh', async () => {
    scraper.fetchAggregatedList
      .mockResolvedValueOnce([
        {
          slug: 'smart-campus-workshop',
          title: 'Smart Campus Workshop',
          sourceUrl: 'https://www.uit.edu.vn/bai-viet/smart-campus-workshop',
          dateLabel: '20-04-2026',
          excerpt: 'Workshop',
          thumbnailUrl: 'https://www.uit.edu.vn/media/workshop.jpg',
        },
      ]);

    await service.listEvents('student-1', 1, 10);
    const result = await service.listEvents('student-1', 1, 10);

    expect(result.items).toHaveLength(1);
  });

  it('reuses the in-memory detail cache while it is still fresh', async () => {
    scraper.fetchAggregatedList.mockResolvedValue([
      {
        slug: 'smart-campus-workshop',
        title: 'Smart Campus Workshop',
        sourceUrl: 'https://www.uit.edu.vn/bai-viet/smart-campus-workshop',
        dateLabel: '20-04-2026',
        excerpt: 'Workshop',
        thumbnailUrl: 'https://www.uit.edu.vn/media/workshop.jpg',
      },
    ]);
    scraper.fetchArticleDetail
      .mockResolvedValueOnce({
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
  });

  it('throws service unavailable when list has no cache and UIT is down', async () => {
    scraper.fetchAggregatedList.mockRejectedValue(new Error('Network error'));

    await expect(service.listEvents('student-1', 1, 10)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
