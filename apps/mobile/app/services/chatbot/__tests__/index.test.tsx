import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import ChatbotScreen from '../index';

import { chatbotApi } from '@/services/api/chatbot';
import { useAuthStore } from '@/stores/auth-store';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));
jest.mock('@/stores/auth-store');
jest.mock('@/services/api/chatbot', () => ({
  chatbotApi: {
    query: jest.fn(),
    getSummary: jest.fn(),
    getCapabilities: jest.fn(),
  },
  buildChatbotActionsFromDeepLinks: jest.fn((deepLinks: unknown) => {
    if (!Array.isArray(deepLinks)) {
      return [];
    }

    return deepLinks.map((route) => ({
      label: route === '/services/canteen' ? 'Mở canteen' : 'Mở chi tiết',
      route,
      kind: 'navigate',
    }));
  }),
}));

const mockChatbotApi = chatbotApi as unknown as {
  query: jest.Mock;
  getSummary: jest.Mock;
  getCapabilities: jest.Mock;
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

describe('ChatbotScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: { role: 'student' } };
      return selector(state);
    });
    mockChatbotApi.query.mockResolvedValue({
      sessionId: 'session-1',
      answer: 'Bạn có 1 đơn canteen đang chờ thanh toán.',
      citations: [{ type: 'db', table: 'canteen_orders' }],
      deepLinks: ['/services/canteen'],
      actions: undefined,
      suggestedQuestions: ['Canteen mở cửa giờ nào?', 'Làm sao thanh toán online?'],
      confidence: 0.95,
      intent: 'canteen_order_status',
      domain: 'canteen',
      answerType: 'live',
    });
    mockChatbotApi.getCapabilities.mockResolvedValue({
      quickPrompts: ['Hôm nay của tôi', 'Lịch học hôm nay', 'Tài liệu mới'],
      summaryScopes: [
        { scope: 'today', label: 'Hôm nay của tôi', description: 'Tóm tắt trong ngày' },
        { scope: 'work', label: 'Học vụ của tôi', description: 'Tóm tắt học vụ' },
      ],
      domains: [],
    });
    mockChatbotApi.getSummary.mockResolvedValue({
      answer: 'Tóm tắt hôm nay: bạn có 2 tiết và 1 thông báo chưa đọc.',
      citations: [{ type: 'derived', label: 'Daily snapshot', sourceId: 'summary-1' }],
      deepLinks: ['/schedule', '/alerts'],
      actions: [
        { label: 'Mở lịch', route: '/schedule', kind: 'navigate' },
        { label: 'Mở cảnh báo', route: '/alerts', kind: 'navigate' },
      ],
      suggestedQuestions: ['Lịch học hôm nay', 'Thông báo chưa đọc'],
      confidence: 0.92,
      intent: 'summary_today',
      domain: 'general',
      answerType: 'summary',
    });
  });

  it('submits question and renders chatbot answer', async () => {
    const { getByPlaceholderText, getByLabelText, getByText } = renderWithClient(<ChatbotScreen />);

    fireEvent.changeText(getByPlaceholderText(/Nhập câu hỏi/i), 'Đơn canteen của tôi');
    fireEvent.press(getByLabelText(/Gửi câu hỏi/i));

    await waitFor(() => {
      expect(mockChatbotApi.query).toHaveBeenCalledWith({
        message: 'Đơn canteen của tôi',
      });
    });
    await waitFor(() =>
      expect(getByText('Bạn có 1 đơn canteen đang chờ thanh toán.')).toBeTruthy(),
    );
    await waitFor(() => expect(getByText('Mở canteen')).toBeTruthy());
  });

  it('shows suggested questions after receiving answer', async () => {
    const { getByPlaceholderText, getByLabelText, findByText } = renderWithClient(
      <ChatbotScreen />,
    );

    fireEvent.changeText(getByPlaceholderText(/Nhập câu hỏi/i), 'Đơn canteen của tôi');
    fireEvent.press(getByLabelText(/Gửi câu hỏi/i));

    expect(await findByText('Canteen mở cửa giờ nào?')).toBeTruthy();
  });

  it('does not render quick summary and skips summary requests on mount', async () => {
    const { queryByLabelText, queryByText, findAllByText } = renderWithClient(<ChatbotScreen />);

    expect(queryByText('Tóm tắt nhanh')).toBeNull();
    expect(queryByLabelText(/Quay lại/i)).toBeNull();
    expect(mockChatbotApi.getSummary).not.toHaveBeenCalled();
    expect((await findAllByText('Hôm nay của tôi')).length).toBeGreaterThan(0);
  });
});
