import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  UitArticleDetail,
  UitEventsScraper,
  type UitListEventItem,
} from './uit-events.scraper';

const SLUG_PATTERN = /^[a-z0-9_-]+$/i;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

type CachedList = {
  items: UitListEventItem[];
  expiresAt: number;
};

type CachedDetail = {
  item: UitArticleDetail;
  expiresAt: number;
};

@Injectable()
export class EventsService {
  private readonly detailCache = new Map<string, CachedDetail>();
  private listCache: CachedList | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly uitEventsScraper: UitEventsScraper,
  ) {}

  async listEvents(_userId?: string, pageInput?: number, limitInput?: number) {
    const page = Math.max(1, pageInput ?? 1);
    const limit = Math.min(Math.max(1, limitInput ?? DEFAULT_LIMIT), MAX_LIMIT);
    const items = await this.getCachedList();
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * limit;

    return {
      items: items.slice(startIndex, startIndex + limit).map((item) => ({
        slug: item.slug,
        title: item.title,
        sourceUrl: item.sourceUrl,
        dateLabel: item.dateLabel,
        excerpt: item.excerpt,
        thumbnailUrl: item.thumbnailUrl,
      })),
      total,
      page: safePage,
      limit,
      totalPages,
    };
  }

  async getArticleBySlug(_userId: string, slug: string) {
    if (!SLUG_PATTERN.test(slug)) {
      throw new BadRequestException('Slug không hợp lệ.');
    }

    const listItems = await this.getCachedList();
    const listItem = listItems.find((item) => item.slug === slug);

    const detail = await this.getCachedDetail(slug);
    if (!detail) {
      throw new NotFoundException('Không tìm thấy bài viết từ UIT.');
    }

    return {
      slug: detail.slug,
      title: detail.title,
      publishedAtLabel: detail.publishedAtLabel,
      excerpt: listItem?.excerpt ?? detail.excerpt,
      thumbnailUrl: listItem?.thumbnailUrl || detail.thumbnailUrl,
      contentHtml: detail.contentHtml,
      sourceUrl: listItem?.sourceUrl ?? detail.sourceUrl,
    };
  }

  private getCacheTtlMs() {
    return this.configService.get<number>('UIT_EVENTS_CACHE_TTL_MS', 86_400_000);
  }

  private async getCachedList() {
    const now = Date.now();
    if (this.listCache && this.listCache.expiresAt > now) {
      return this.listCache.items;
    }

    try {
      const items = await this.uitEventsScraper.fetchAggregatedList();
      this.listCache = {
        items,
        expiresAt: now + this.getCacheTtlMs(),
      };
      return items;
    } catch (error) {
      if (this.listCache?.items.length) {
        return this.listCache.items;
      }

      throw new ServiceUnavailableException('Không thể tải danh sách sự kiện từ UIT.');
    }
  }

  private async getCachedDetail(slug: string) {
    const now = Date.now();
    const cached = this.detailCache.get(slug);
    if (cached && cached.expiresAt > now) {
      return cached.item;
    }

    try {
      const item = await this.uitEventsScraper.fetchArticleDetail(slug);
      if (!item) {
        throw new NotFoundException('Không tìm thấy bài viết từ UIT.');
      }

      this.detailCache.set(slug, {
        item,
        expiresAt: now + this.getCacheTtlMs(),
      });
      return item;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (cached?.item) {
        return cached.item;
      }

      throw new ServiceUnavailableException('Không thể tải chi tiết bài viết từ UIT.');
    }
  }
}
