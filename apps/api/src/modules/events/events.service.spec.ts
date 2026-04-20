import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { EventsService } from './events.service';
import { UitEventsScraper } from './uit-events.scraper';

function makeItems(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    slug: `slug-${i}`,
    title: `Title ${i}`,
    url: `https://www.uit.edu.vn/bai-viet/slug-${i}`,
    dateLabel: '01-01-2026',
    excerpt: `Excerpt ${i}`,
    thumbnailUrl: 'https://www.uit.edu.vn/media/x.jpg',
  }));
}

describe('EventsService', () => {
  let service: EventsService;
  let scraper: { fetchAggregatedList: jest.Mock; fetchArticleDetail: jest.Mock };

  beforeEach(async () => {
    scraper = {
      fetchAggregatedList: jest.fn().mockResolvedValue(makeItems(25)),
      fetchArticleDetail: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: UitEventsScraper, useValue: scraper },
        {
          provide: ConfigService,
          useValue: {
            get: (_key: string, defaultValue?: unknown) => defaultValue,
          },
        },
      ],
    }).compile();
    service = moduleRef.get(EventsService);
  });

  it('returns first page with total and totalPages', async () => {
    const res = await service.listEvents(1, 10);
    expect(res.items).toHaveLength(10);
    expect(res.total).toBe(25);
    expect(res.page).toBe(1);
    expect(res.limit).toBe(10);
    expect(res.totalPages).toBe(3);
  });

  it('returns second page', async () => {
    const res = await service.listEvents(2, 10);
    expect(res.items[0]?.slug).toBe('slug-10');
    expect(res.page).toBe(2);
  });

  it('returns last partial page', async () => {
    const res = await service.listEvents(3, 10);
    expect(res.items).toHaveLength(5);
    expect(res.page).toBe(3);
    expect(res.totalPages).toBe(3);
  });

  it('clamps page past totalPages to last page', async () => {
    const res = await service.listEvents(99, 10);
    expect(res.page).toBe(3);
    expect(res.items).toHaveLength(5);
  });

  it('default page is 1', async () => {
    const res = await service.listEvents(undefined, 10);
    expect(res.page).toBe(1);
    expect(res.items).toHaveLength(10);
  });

  it('getArticleBySlug returns detail when scraper succeeds', async () => {
    scraper.fetchArticleDetail.mockResolvedValue({
      slug: 'a-b',
      title: 'T',
      publishedAtLabel: 'd',
      contentHtml: '<p>x</p>',
    });
    await expect(service.getArticleBySlug('a-b')).resolves.toMatchObject({
      slug: 'a-b',
      contentHtml: '<p>x</p>',
    });
  });

  it('getArticleBySlug throws NotFound when missing', async () => {
    scraper.fetchArticleDetail.mockResolvedValue(null);
    await expect(service.getArticleBySlug('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
