import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { type AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';

export const UIT_ORIGIN = 'https://www.uit.edu.vn';

export interface UitListEventItem {
  slug: string;
  title: string;
  url: string;
  dateLabel: string;
  excerpt: string;
  thumbnailUrl: string;
}

export interface UitArticleDetail {
  slug: string;
  title: string;
  publishedAtLabel: string;
  contentHtml: string;
}

function resolveUrl(origin: string, href: string): string {
  try {
    return new URL(href, origin).toString();
  } catch {
    return href;
  }
}

function parseListPage(html: string, origin: string): UitListEventItem[] {
  const $ = cheerio.load(html);
  const grid = $('div.grid.justify-center.grid-cols-1.gap-6.sm\\:grid-cols-2.lg\\:grid-cols-3').first();
  if (!grid.length) {
    return [];
  }
  const out: UitListEventItem[] = [];
  grid.children().each((_, cardEl) => {
    const card = $(cardEl);
    const articleA = card.find('a[href^="/bai-viet/"]').first();
    const href = articleA.attr('href');
    if (!href) {
      return;
    }
    const m = href.match(/^\/bai-viet\/([^/?#]+)/);
    const slug = m?.[1];
    if (!slug) {
      return;
    }
    const url = resolveUrl(origin, href);
    const img = articleA.find('img').first();
    const thumbSrc = img.attr('src') ?? '';
    const thumbnailUrl = thumbSrc ? resolveUrl(origin, thumbSrc) : '';
    const title =
      card.find('h3 a').first().text().trim() ||
      card.find('h3').first().text().trim() ||
      img.attr('alt')?.trim() ||
      slug;
    const dateLabel = card.find('div.flex.justify-between span.text-xs').first().text().trim();
    const excerpt = card.find('div.line-clamp-5').first().text().trim();
    out.push({
      slug,
      title,
      url,
      dateLabel,
      excerpt,
      thumbnailUrl,
    });
  });
  return out;
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
      validateStatus: (s) => s >= 200 && s < 400,
    });
  }

  getMaxPages(): number {
    return this.configService.get<number>('UIT_EVENTS_MAX_PAGES', 10);
  }

  /**
   * UIT serves the same first page for `/hoat-dong-sinh-vien` and `?page=1`.
   * We fetch `/hoat-dong-sinh-vien` then `?page=2` … `?page=N` for N = maxPages.
   */
  async fetchAggregatedList(): Promise<UitListEventItem[]> {
    const maxPages = this.getMaxPages();
    const listPath = '/search-page';
    const urls: string[] = [`${UIT_ORIGIN}${listPath}`];
    for (let p = 2; p <= maxPages; p += 1) {
      urls.push(`${UIT_ORIGIN}${listPath}?page=${p}`);
    }
    const seen = new Set<string>();
    const merged: UitListEventItem[] = [];
    for (const url of urls) {
      const res = await this.client.get<string>(url, { responseType: 'text' });
      if (res.status !== 200 || typeof res.data !== 'string') {
        break;
      }
      const pageItems = parseListPage(res.data, UIT_ORIGIN);
      if (pageItems.length === 0) {
        break;
      }
      for (const item of pageItems) {
        if (!seen.has(item.slug)) {
          seen.add(item.slug);
          merged.push(item);
        }
      }
    }
    return merged;
  }

  async fetchArticleDetail(slug: string): Promise<UitArticleDetail | null> {
    const path = `/bai-viet/${encodeURIComponent(slug)}`;
    const res = await this.client.get<string>(path, { responseType: 'text' });
    if (res.status !== 200 || typeof res.data !== 'string') {
      return null;
    }
    const $ = cheerio.load(res.data);
    const content = $('div.rich-text-content').first();
    if (!content.length) {
      return null;
    }
    const contentHtml = content.html() ?? '';
    const title = $('title').first().text().trim() || slug;
    const publishedAtLabel =
      $('article p.text-sm.text-gray-500.dark\\:text-gray-400.italic').first().text().trim() ||
      $('article p.italic').first().text().trim() ||
      $('p.text-sm.text-gray-500').first().text().trim();
    return {
      slug,
      title,
      publishedAtLabel,
      contentHtml,
    };
  }
}
