import { ConfigService } from '@nestjs/config';
import axios from 'axios';

import { UitEventsScraper } from './uit-events.scraper';

jest.mock('axios');

describe('UitEventsScraper', () => {
  const getMock = jest.fn();
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue({
      get: getMock,
    } as unknown as ReturnType<typeof axios.create>);
  });

  it('returns empty thumbnailUrl when og:image is missing', async () => {
    getMock.mockResolvedValue({
      status: 200,
      data: `
        <html>
          <body>
            <h1>Bài viết kiểm thử</h1>
            <p class="text-sm">26-04-2026</p>
            <div class="rich-text-content"><p>Nội dung tóm tắt</p></div>
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
            <h1>Bài viết kiểm thử</h1>
            <p class="text-sm">26-04-2026</p>
            <div class="rich-text-content"><p>Nội dung tóm tắt</p></div>
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
