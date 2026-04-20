import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import EventsScreen from '../index';

import {
  EVENTS_PAGE_SIZE,
  eventsApi,
  type ListEventsResponse,
} from '@/services/api/events';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));
jest.mock('@/services/api/events', () => ({
  EVENTS_PAGE_SIZE: 12,
  eventsApi: {
    list: jest.fn(),
  },
}));

const mockEventsApi = eventsApi as unknown as {
  list: jest.Mock;
};

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const listResponse = (overrides: Partial<ListEventsResponse>) => ({
  items: [
    {
      slug: 'hoi-nghi-ra-soat',
      title: 'Hội nghị rà soát, đánh giá 5 năm công tác khảo sát',
      url: 'https://www.uit.edu.vn/bai-viet/hoi-nghi-ra-soat',
      dateLabel: '17-04-2026',
      excerpt: 'Sáng ngày 17/4/2026 tại Trường Đại học Công nghệ Thông tin.',
      thumbnailUrl: 'https://www.uit.edu.vn/example.jpg',
    },
  ],
  total: 24,
  page: 1,
  limit: 12,
  totalPages: 2,
  ...overrides,
});

const firstArticle = listResponse({}).items[0]!;

describe('EventsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches the first page with limit 12 and opens an article', async () => {
    mockEventsApi.list.mockResolvedValue(listResponse({}));

    const { getByText } = renderWithClient(<EventsScreen />);

    await waitFor(() => expect(getByText(firstArticle.title)).toBeTruthy());

    expect(mockEventsApi.list).toHaveBeenCalledWith({
      page: 1,
      limit: EVENTS_PAGE_SIZE,
    });

    fireEvent.press(getByText(firstArticle.title));

    expect(mockRouter.push).toHaveBeenCalledWith('/services/events/hoi-nghi-ra-soat');
  });

  it('loads page 2 when the next control is pressed', async () => {
    const page2Title = '#UITSEMINAR - WORLDQUANT';
    mockEventsApi.list
      .mockResolvedValueOnce(
        listResponse({
          items: listResponse({}).items,
          totalPages: 3,
          total: 36,
        }),
      )
      .mockResolvedValueOnce(
        listResponse({
          page: 2,
          items: [
            {
              slug: 'uitseminar-worldquant',
              title: page2Title,
              url: 'https://www.uit.edu.vn/bai-viet/uitseminar-worldquant',
              dateLabel: '17-04-2026',
              excerpt: 'Seminar.',
              thumbnailUrl: 'https://www.uit.edu.vn/example.jpg',
            },
          ],
        }),
      );

    const { getByText, getByLabelText } = renderWithClient(<EventsScreen />);

    await waitFor(() => expect(getByText(firstArticle.title)).toBeTruthy());

    fireEvent.press(getByLabelText('Trang sau'));

    await waitFor(() =>
      expect(mockEventsApi.list).toHaveBeenLastCalledWith({
        page: 2,
        limit: EVENTS_PAGE_SIZE,
      }),
    );
    await waitFor(() => expect(getByText(page2Title)).toBeTruthy());
  });

  it('renders an empty state', async () => {
    mockEventsApi.list.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 12,
      totalPages: 1,
    });

    const { getByText } = renderWithClient(<EventsScreen />);

    await waitFor(() => expect(getByText('Chưa có bài viết')).toBeTruthy());
  });

  it('renders an error state and retries', async () => {
    mockEventsApi.list
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(listResponse({}));

    const { getByText } = renderWithClient(<EventsScreen />);

    await waitFor(() => expect(getByText('Chưa tải được bài viết')).toBeTruthy());

    fireEvent.press(getByText('Thử lại'));

    await waitFor(() => expect(getByText(firstArticle.title)).toBeTruthy());
  });
});
