import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { decodeEventsCursor, encodeEventsCursor } from './events-cursor';
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

  it('returns first page with nextCursor when more items exist', async () => {
    const res = await service.listEvents(undefined, 10);
    expect(res.items).toHaveLength(10);
    expect(res.hasMore).toBe(true);
    expect(res.nextCursor).toBe(encodeEventsCursor(10));
  });

  it('returns second page using cursor', async () => {
    const first = await service.listEvents(undefined, 10);
    const second = await service.listEvents(first.nextCursor!, 10);
    expect(second.items[0]?.slug).toBe('slug-10');
    expect(second.hasMore).toBe(true);
  });

  it('returns hasMore false on last page', async () => {
    const last = await service.listEvents(encodeEventsCursor(20), 10);
    expect(last.items).toHaveLength(5);
    expect(last.hasMore).toBe(false);
    expect(last.nextCursor).toBeNull();
  });

  it('throws BadRequestException for invalid cursor', async () => {
    await expect(service.listEvents('not-a-cursor', 10)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('decodeEventsCursor round-trips offset', () => {
    expect(decodeEventsCursor(encodeEventsCursor(42))).toBe(42);
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

  it('getArticleBySlug throws BadRequest for invalid slug', async () => {
    await expect(service.getArticleBySlug('bad/slug')).rejects.toBeInstanceOf(BadRequestException);
  });
});
