import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { EventDetailResponseDto } from './dto/event-detail-response.dto';
import type { EventListItemDto } from './dto/event-list-item.dto';
import type { ListEventsResponseDto } from './dto/list-events-response.dto';
import { decodeEventsCursor, encodeEventsCursor } from './events-cursor';
import { UitEventsScraper } from './uit-events.scraper';

const SLUG_PATTERN = /^[a-zA-Z0-9_-]+$/;

interface ListCache {
  items: EventListItemDto[];
  fetchedAt: number;
}

@Injectable()
export class EventsService {
  private listCache: ListCache | null = null;

  constructor(
    private readonly scraper: UitEventsScraper,
    private readonly configService: ConfigService,
  ) {}

  async listEvents(cursor: string | undefined, limitInput: number | undefined): Promise<ListEventsResponseDto> {
    const limit = limitInput ?? 20;
    const offset = cursor ? decodeEventsCursor(cursor) : 0;
    await this.ensureListCache();
    const all = this.listCache!.items;
    const items = all.slice(offset, offset + limit);
    const hasMore = offset + limit < all.length;
    return {
      items,
      nextCursor: hasMore ? encodeEventsCursor(offset + limit) : null,
      hasMore,
    };
  }

  async getArticleBySlug(slug: string): Promise<EventDetailResponseDto> {
    if (!SLUG_PATTERN.test(slug)) {
      throw new BadRequestException('Invalid slug');
    }
    try {
      const detail = await this.scraper.fetchArticleDetail(slug);
      if (!detail) {
        throw new NotFoundException('Article not found');
      }
      return {
        slug: detail.slug,
        title: detail.title,
        publishedAtLabel: detail.publishedAtLabel,
        contentHtml: detail.contentHtml,
      };
    } catch (e) {
      if (e instanceof NotFoundException || e instanceof BadRequestException) {
        throw e;
      }
      throw new ServiceUnavailableException('Could not load article from UIT');
    }
  }

  private async ensureListCache(): Promise<void> {
    const ttlMs = this.configService.get<number>('UIT_EVENTS_CACHE_TTL_MS', 15 * 60 * 1000);
    const now = Date.now();
    if (this.listCache && now - this.listCache.fetchedAt < ttlMs) {
      return;
    }
    try {
      const raw = await this.scraper.fetchAggregatedList();
      this.listCache = {
        items: raw.map((r) => ({
          slug: r.slug,
          title: r.title,
          url: r.url,
          dateLabel: r.dateLabel,
          excerpt: r.excerpt,
          thumbnailUrl: r.thumbnailUrl,
        })),
        fetchedAt: now,
      };
    } catch {
      if (this.listCache) {
        return;
      }
      throw new ServiceUnavailableException('Could not load events from UIT');
    }
  }
}
