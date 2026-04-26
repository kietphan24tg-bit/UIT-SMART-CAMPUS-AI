import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { type AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';

export const UIT_ORIGIN = 'https://www.uit.edu.vn';
const UIT_STUDENT_ACTIVITIES_PATH = '/hoat-dong-sinh-vien';

export interface UitListEventItem {
  slug: string;
  title: string;
  sourceUrl: string;
  dateLabel: string;
  excerpt: string;
  thumbnailUrl: string;
}

export interface UitArticleDetail {
  slug: string;
  title: string;
  publishedAtLabel: string;
  excerpt: string;
  thumbnailUrl: string;
  contentHtml: string;
  sourceUrl: string;
}

function resolveUrl(origin: string, href: string) {
  try {
    return new URL(href, origin).toString();
  } catch {
    return href;
  }
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').replace(/&nbsp;/g, ' ').trim();
}

function parseListPage(html: string, origin: string): UitListEventItem[] {
  const $ = cheerio.load(html);
  const results: UitListEventItem[] = [];
  const seen = new Set<string>();

  $('h3 a[href^="/bai-viet/"]').each((_, element) => {
    const link = $(element);
    const href = link.attr('href');
    if (!href) {
      return;
    }

    const slug = href.match(/^\/bai-viet\/([^/?#]+)/)?.[1];
    if (!slug || seen.has(slug)) {
      return;
    }

    const cardBody = link.closest('div.p-6');
    const card = cardBody.parent();
    const excerpt = normalizeText(cardBody.find('div.line-clamp-5').first().text());
    const dateLabel = normalizeText(
      cardBody.find('div.flex.justify-between span.text-xs').first().text(),
    );

    if (!excerpt || !dateLabel) {
      return;
    }

    const thumbnailSrc = card.find('img').first().attr('src') ?? '';
    seen.add(slug);
    results.push({
      slug,
      title: normalizeText(link.text()) || slug,
      sourceUrl: resolveUrl(origin, href),
      dateLabel,
      excerpt,
      thumbnailUrl: thumbnailSrc ? resolveUrl(origin, thumbnailSrc) : '',
    });
  });

  return results;
}

@Injectable()
export class UitEventsScraper {
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const timeout = this.configService.get<number>('UIT_EVENTS_REQUEST_TIMEOUT_MS', 20_000);
    this.client = axios.create({
      baseURL: UIT_ORIGIN,
      timeout,
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'SmartCampus/1.0 (educational; contact: campus-api)',
      },
      validateStatus: (status) => status >= 200 && status < 400,
    });
  }

  getMaxPages() {
    return this.configService.get<number>('UIT_EVENTS_MAX_PAGES', 10);
  }

  async fetchAggregatedList(): Promise<UitListEventItem[]> {
    const maxPages = this.getMaxPages();
    const merged: UitListEventItem[] = [];
    const seen = new Set<string>();

    for (let page = 1; page <= maxPages; page += 1) {
      const path =
        page === 1
          ? UIT_STUDENT_ACTIVITIES_PATH
          : `${UIT_STUDENT_ACTIVITIES_PATH}?page=${page}`;
      const response = await this.client.get<string>(path, { responseType: 'text' });
      if (response.status !== 200 || typeof response.data !== 'string') {
        break;
      }

      const pageItems = parseListPage(response.data, UIT_ORIGIN);
      if (pageItems.length === 0) {
        break;
      }

      let appendedCount = 0;
      for (const item of pageItems) {
        if (!seen.has(item.slug)) {
          seen.add(item.slug);
          merged.push(item);
          appendedCount += 1;
        }
      }

      if (appendedCount === 0) {
        break;
      }
    }

    return merged;
  }

  async fetchArticleDetail(slug: string): Promise<UitArticleDetail | null> {
    const response = await this.client.get<string>(`/bai-viet/${encodeURIComponent(slug)}`, {
      responseType: 'text',
    });
    if (response.status !== 200 || typeof response.data !== 'string') {
      return null;
    }

    const $ = cheerio.load(response.data);
    const content = $('div.rich-text-content').first();
    if (!content.length) {
      return null;
    }

    const title = normalizeText($('h1').first().text()) || slug;
    const publishedAtLabel =
      normalizeText($('p.text-sm').first().text()) || normalizeText($('time').first().text());
    const excerpt =
      normalizeText(content.find('p').first().text()) ||
      normalizeText($('meta[name="description"]').attr('content') ?? '');
    const rawThumbnailUrl = normalizeText($('meta[property="og:image"]').attr('content') ?? '');
    const thumbnailUrl = rawThumbnailUrl ? resolveUrl(UIT_ORIGIN, rawThumbnailUrl) : '';

    return {
      slug,
      title,
      publishedAtLabel,
      excerpt,
      thumbnailUrl,
      contentHtml: content.html() ?? '',
      sourceUrl: resolveUrl(UIT_ORIGIN, `/bai-viet/${slug}`),
    };
  }
}
