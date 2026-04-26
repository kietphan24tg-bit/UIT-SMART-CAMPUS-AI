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
    listSessions: jest.fn(),
    getMessages: jest.fn(),
  },
}));

const mockChatbotApi = chatbotApi as unknown as {
  query: jest.Mock;
  listSessions: jest.Mock;
  getMessages: jest.Mock;
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
    mockChatbotApi.listSessions.mockResolvedValue([]);
    mockChatbotApi.getMessages.mockResolvedValue([]);
    mockChatbotApi.query.mockResolvedValue({
      sessionId: 'session-1',
      answer: 'Bạn có 1 đơn canteen đang chờ thanh toán.',
      citations: [{ type: 'db', table: 'canteen_orders' }],
      deepLinks: ['/services/canteen'],
      confidence: 0.95,
      intent: 'canteen_order_status',
    });
  });

  it('submits question and renders chatbot answer', async () => {
    const { getByPlaceholderText, getByText } = renderWithClient(<ChatbotScreen />);

    fireEvent.changeText(getByPlaceholderText(/Ví dụ:/i), 'Đơn canteen của tôi');
    fireEvent.press(getByText('Gửi câu hỏi'));

    await waitFor(() => {
      expect(mockChatbotApi.query).toHaveBeenCalledWith({
        message: 'Đơn canteen của tôi',
      });
    });
    await waitFor(() =>
      expect(getByText('Bạn có 1 đơn canteen đang chờ thanh toán.')).toBeTruthy(),
    );
  });
});
