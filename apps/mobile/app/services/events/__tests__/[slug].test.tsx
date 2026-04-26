import { USER_ROLES } from '@smart-campus/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Linking } from 'react-native';

import EventDetailScreen from '../[slug]';

import { eventsApi } from '@/services/api/events';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ slug: 'hoi-nghi-ra-soat' }),
}));
jest.mock('@/services/api/events', () => ({
  eventsApi: {
    detail: jest.fn(),
  },
}));

const mockEventsApi = eventsApi as unknown as {
  detail: jest.Mock;
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

describe('EventDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches by slug and opens the original UIT article', async () => {
    mockEventsApi.detail.mockResolvedValue({
      slug: 'hoi-nghi-ra-soat',
      title: 'Hội nghị rà soát, đánh giá 5 năm công tác khảo sát',
      publishedAtLabel: '17-04-2026',
      excerpt: 'Bài viết từ UIT.',
      thumbnailUrl: 'https://www.uit.edu.vn/example.jpg',
      contentHtml:
        '<p>Sáng ngày <strong>17/4/2026</strong> tại UIT.</p><p><a href="https://www.uit.edu.vn">Nguồn UIT</a></p><img src="/image.jpg" />',
      sourceUrl: 'https://www.uit.edu.vn/bai-viet/hoi-nghi-ra-soat',
    });

    const { getByText } = renderWithClient(<EventDetailScreen />);

    await waitFor(() =>
      expect(getByText('Hội nghị rà soát, đánh giá 5 năm công tác khảo sát')).toBeTruthy(),
    );

    expect(mockEventsApi.detail).toHaveBeenCalledWith('hoi-nghi-ra-soat');
    expect(getByText('17-04-2026')).toBeTruthy();
    expect(getByText('Bài viết từ UIT.')).toBeTruthy();
    expect(getByText('Sáng ngày 17/4/2026 tại UIT. Nguồn UIT')).toBeTruthy();

    fireEvent.press(getByText('Mở bài viết gốc UIT'));
    await waitFor(() =>
      expect(Linking.openURL).toHaveBeenCalledWith('https://www.uit.edu.vn/bai-viet/hoi-nghi-ra-soat'),
    );
  });

  it('renders an error state and retries detail fetch', async () => {
    mockEventsApi.detail
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        slug: 'hoi-nghi-ra-soat',
        title: 'Bài viết đã tải lại',
        publishedAtLabel: '18-04-2026',
        excerpt: 'Đã tải lại.',
        thumbnailUrl: 'https://www.uit.edu.vn/example.jpg',
        contentHtml: '<p>Nội dung đã tải lại.</p>',
        sourceUrl: 'https://www.uit.edu.vn/bai-viet/hoi-nghi-ra-soat',
      });

    const { getByText } = renderWithClient(<EventDetailScreen />);

    await waitFor(() => expect(getByText('Chưa tải được bài viết')).toBeTruthy());

    fireEvent.press(getByText('Thử lại'));

    await waitFor(() => expect(getByText('Bài viết đã tải lại')).toBeTruthy());
  });
});
