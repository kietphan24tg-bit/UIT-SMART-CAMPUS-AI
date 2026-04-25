import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { USER_ROLES } from '@smart-campus/shared';

import EventDetailScreen from '../[slug]';

import { eventsApi } from '@/services/api/events';
import { useAuthStore } from '@/stores/auth-store';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ slug: 'hoi-nghi-ra-soat' }),
}));
jest.mock('@/services/api/events', () => ({
  eventsApi: {
    detail: jest.fn(),
    register: jest.fn(),
    unregister: jest.fn(),
  },
}));
jest.mock('@/stores/auth-store');

const mockEventsApi = eventsApi as unknown as {
  detail: jest.Mock;
  register: jest.Mock;
  unregister: jest.Mock;
};
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

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
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        user: {
          role: USER_ROLES.STUDENT,
        },
      }),
    );
  });

  it('fetches by slug and renders representative HTML content', async () => {
    mockEventsApi.detail.mockResolvedValue({
      slug: 'hoi-nghi-ra-soat',
      title: 'Hội nghị rà soát, đánh giá 5 năm công tác khảo sát',
      publishedAtLabel: '17-04-2026',
      contentHtml:
        '<p>Sáng ngày <strong>17/4/2026</strong> tại UIT.</p><p><a href="https://www.uit.edu.vn">Nguồn UIT</a></p><img src="/image.jpg" />',
    });

    const { getByText } = renderWithClient(<EventDetailScreen />);

    await waitFor(() =>
      expect(getByText('Hội nghị rà soát, đánh giá 5 năm công tác khảo sát')).toBeTruthy(),
    );

    expect(mockEventsApi.detail).toHaveBeenCalledWith('hoi-nghi-ra-soat');
    expect(getByText('17-04-2026')).toBeTruthy();
    expect(getByText('Sáng ngày 17/4/2026 tại UIT. Nguồn UIT')).toBeTruthy();
  });

  it('renders an error state and retries detail fetch', async () => {
    mockEventsApi.detail
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        slug: 'hoi-nghi-ra-soat',
        title: 'Bài viết đã tải lại',
        publishedAtLabel: '18-04-2026',
        contentHtml: '<p>Nội dung đã tải lại.</p>',
      });

    const { getByText } = renderWithClient(<EventDetailScreen />);

    await waitFor(() => expect(getByText('Chưa tải được bài viết')).toBeTruthy());

    fireEvent.press(getByText('Thử lại'));

    await waitFor(() => expect(getByText('Bài viết đã tải lại')).toBeTruthy());
  });

  it('does not show registration actions for non-student role', async () => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        user: {
          role: USER_ROLES.LECTURER,
        },
      }),
    );

    mockEventsApi.detail.mockResolvedValue({
      id: 'event-1',
      slug: 'hoi-nghi-ra-soat',
      title: 'Hội nghị rà soát',
      publishedAtLabel: '17-04-2026',
      contentHtml: '<p>Nội dung</p>',
      status: 'open',
      isRegistered: false,
    });

    const { queryByText } = renderWithClient(<EventDetailScreen />);

    await waitFor(() => {
      expect(queryByText('Hội nghị rà soát')).toBeTruthy();
    });

    expect(queryByText('Đăng ký tham gia')).toBeNull();
    expect(queryByText('Hủy đăng ký tham gia')).toBeNull();
  });
});
