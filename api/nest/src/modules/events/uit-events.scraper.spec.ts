import type { ConfigService } from '@nestjs/config';
import axios from 'axios';

import { UitEventsScraper } from './uit-events.scraper';

jest.mock('axios');

describe('UitEventsScraper', () => {
  const getMock = jest.fn();
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(() => {
    jest.resetAllMocks();
    getMock.mockReset();
    mockedAxios.create.mockReturnValue({
      get: getMock,
    } as unknown as ReturnType<typeof axios.create>);
  });

  it('fetches one list page and parses event cards', async () => {
    getMock.mockResolvedValue({
      status: 200,
      data: `
        <html>
          <body>
            <div>
              <div>
                <div class="p-6">
                  <h3><a href="/bai-viet/su-kien-1">Su kien 1</a></h3>
                  <div class="flex justify-between"><span class="text-xs">26-04-2026</span></div>
                  <div class="line-clamp-5">Mo ta 1</div>
                </div>
                <img src="/media/events/1.png" />
              </div>
            </div>
          </body>
        </html>
      `,
    });

    const scraper = new UitEventsScraper({
      get: jest.fn((_: string, defaultValue?: unknown) => defaultValue),
    } as unknown as ConfigService);
    const result = await scraper.fetchListPage(1);

    expect(getMock).toHaveBeenCalledWith('/hoat-dong-sinh-vien', { responseType: 'text' });
    expect(result).toEqual([
      {
        slug: 'su-kien-1',
        title: 'Su kien 1',
        sourceUrl: 'https://www.uit.edu.vn/bai-viet/su-kien-1',
        dateLabel: '26-04-2026',
        excerpt: 'Mo ta 1',
        thumbnailUrl: 'https://www.uit.edu.vn/media/events/1.png',
      },
    ]);
  });

  it('merges ranges and de-duplicates by slug', async () => {
    getMock
      .mockResolvedValueOnce({
        status: 200,
        data: `
          <div>
            <div>
              <div class="p-6">
                <h3><a href="/bai-viet/event-1">Event 1</a></h3>
                <div class="flex justify-between"><span class="text-xs">26-04-2026</span></div>
                <div class="line-clamp-5">Mo ta 1</div>
              </div>
            </div>
          </div>
        `,
      })
      .mockResolvedValueOnce({
        status: 200,
        data: `
          <div>
            <div class="p-6">
              <h3><a href="/bai-viet/event-1">Event 1 duplicate</a></h3>
              <div class="flex justify-between"><span class="text-xs">26-04-2026</span></div>
              <div class="line-clamp-5">Mo ta 1</div>
            </div>
          </div>
          <div>
            <div class="p-6">
              <h3><a href="/bai-viet/event-2">Event 2</a></h3>
              <div class="flex justify-between"><span class="text-xs">27-04-2026</span></div>
              <div class="line-clamp-5">Mo ta 2</div>
            </div>
          </div>
        `,
      });

    const scraper = new UitEventsScraper({
      get: jest.fn((key: string, defaultValue?: unknown) =>
        key === 'UIT_EVENTS_MAX_PAGES' ? 10 : defaultValue,
      ),
    } as unknown as ConfigService);
    const result = await scraper.fetchListRange(1, 2);

    expect(result.map((item) => item.slug)).toEqual(['event-1', 'event-2']);
    expect(getMock).toHaveBeenNthCalledWith(1, '/hoat-dong-sinh-vien', { responseType: 'text' });
    expect(getMock).toHaveBeenNthCalledWith(2, '/hoat-dong-sinh-vien?page=2', {
      responseType: 'text',
    });
  });

  it('returns empty thumbnailUrl when og:image is missing', async () => {
    getMock.mockResolvedValue({
      status: 200,
      data: `
        <html>
          <body>
            <h1>Bai viet kiem thu</h1>
            <p class="text-sm">26-04-2026</p>
            <div class="rich-text-content"><p>Noi dung tom tat</p></div>
          </body>
        </html>
      `,
    });

    const scraper = new UitEventsScraper({
      get: jest.fn((_: string, defaultValue?: unknown) => defaultValue),
    } as unknown as ConfigService);
    const result = await scraper.fetchArticleDetail('bai-viet-kiem-thu');

    expect(result?.thumbnailUrl).toBe('');
  });

  it('resolves thumbnailUrl when og:image is present', async () => {
    getMock.mockResolvedValue({
      status: 200,
      data: `
        <html>
          <head>
            <meta property="og:image" content="/media/events/thumb.png" />
          </head>
          <body>
            <h1>Bai viet kiem thu</h1>
            <p class="text-sm">26-04-2026</p>
            <div class="rich-text-content"><p>Noi dung tom tat</p></div>
          </body>
        </html>
      `,
    });

    const scraper = new UitEventsScraper({
      get: jest.fn((_: string, defaultValue?: unknown) => defaultValue),
    } as unknown as ConfigService);
    const result = await scraper.fetchArticleDetail('bai-viet-kiem-thu');

    expect(result?.thumbnailUrl).toBe('https://www.uit.edu.vn/media/events/thumb.png');
  });
});
