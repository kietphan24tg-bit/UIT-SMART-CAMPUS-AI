import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import ChatbotScreen from '../index';

import { chatbotApi } from '@/services/api/chatbot';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));
jest.mock('@/services/api/chatbot', () => ({
  chatbotApi: {
    query: jest.fn(),
  },
}));

const mockChatbotApi = chatbotApi as unknown as {
  query: jest.Mock;
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

describe('ChatbotScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChatbotApi.query.mockResolvedValue({
      sessionId: 'session-1',
      answer: 'Bạn có 1 đơn canteen đang chờ thanh toán.',
      citations: [{ type: 'db', table: 'canteen_orders' }],
      deepLinks: ['/services/canteen'],
      suggestedQuestions: ['Canteen mở cửa giờ nào?', 'Làm sao thanh toán online?'],
      confidence: 0.95,
      intent: 'canteen_order_status',
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
  });

  it('shows suggested questions after receiving answer', async () => {
    const { getByPlaceholderText, getByLabelText, findByText } = renderWithClient(
      <ChatbotScreen />,
    );

    fireEvent.changeText(getByPlaceholderText(/Nhập câu hỏi/i), 'Đơn canteen của tôi');
    fireEvent.press(getByLabelText(/Gửi câu hỏi/i));

    expect(await findByText('Canteen mở cửa giờ nào?')).toBeTruthy();
  });

  it('shows initial suggested questions when no messages exist', () => {
    const { getByText } = renderWithClient(<ChatbotScreen />);
    expect(getByText('Đơn canteen của tôi')).toBeTruthy();
    expect(getByText('Lịch học hôm nay')).toBeTruthy();
  });
});
