import { USER_ROLES } from '@smart-campus/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Image } from 'expo-image';
import React from 'react';
import { Alert } from 'react-native';

import CanteenScreen from '../index';

import { canteenApi, type CanteenOrderRecord } from '@/services/api/canteen';
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
jest.mock('@/services/api/canteen', () => ({
  canteenApi: {
    getCatalog: jest.fn(),
    getMyOrders: jest.fn(),
    createOrder: jest.fn(),
    createSepayPayment: jest.fn(),
    deleteOrder: jest.fn(),
  },
}));

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockCanteenApi = canteenApi as unknown as {
  getCatalog: jest.Mock;
  getMyOrders: jest.Mock;
  createOrder: jest.Mock;
  createSepayPayment: jest.Mock;
  deleteOrder: jest.Mock;
};
const mockedExpoImage = Image as unknown as { prefetch: jest.Mock };
const queryClients: QueryClient[] = [];

function makeOrder(status: CanteenOrderRecord['status']): CanteenOrderRecord {
  return {
    id: 'order-1',
    orderCode: 'ORD-001',
    status,
    totalAmount: 35000,
    note: null,
    createdAt: '2026-04-30T10:00:00.000Z',
    updatedAt: '2026-04-30T10:05:00.000Z',
    completedAt: null,
    cancelledAt: null,
    items: [
      {
        id: 'item-1',
        productId: 'product-1',
        productName: 'Chicken Rice',
        unitPrice: 35000,
        quantity: 1,
        lineTotal: 35000,
      },
    ],
    latestPayment: null,
  };
}

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });
  queryClients.push(queryClient);
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('CanteenScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        user: { id: 'student-1', role: USER_ROLES.STUDENT },
        isHydrated: true,
        isAuthenticated: true,
      }),
    );
    mockCanteenApi.getCatalog.mockResolvedValue([]);
    mockCanteenApi.getMyOrders.mockResolvedValue([]);
    mockCanteenApi.createSepayPayment.mockResolvedValue({
      transactionId: 'tx-qr-1',
      provider: 'sepay',
      mode: 'qr',
      amount: 35000,
      orderId: 'SEPAYCANTEEN-ORDER-1',
      checkoutUrl: 'https://qr.sepay.vn/img?acc=123456789',
      bankName: 'MB Bank',
      accountNumber: '123456789',
      accountName: 'SMART CAMPUS',
      transferDescription: 'TT ORDER-1',
    });
    mockCanteenApi.deleteOrder.mockResolvedValue({
      id: 'order-1',
      deleted: true,
    });
  });

  afterEach(() => {
    queryClients.forEach((queryClient) => queryClient.clear());
    queryClients.length = 0;
    jest.useRealTimers();
  });

  it.each([USER_ROLES.CANTEEN_ADMIN, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])(
    'redirects %s to management screen CTA',
    async (role) => {
      mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
        selector({
          user: { id: 'manager-1', role },
        }),
      );

      const { getByText } = renderWithClient(<CanteenScreen />);

      fireEvent.press(getByText('Mở quản trị'));

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/services/canteen/admin');
      });
    },
  );

  it('renders menu for student role', async () => {
    mockCanteenApi.getCatalog.mockResolvedValue([
      {
        id: 'cat-1',
        name: 'Rice',
        slug: 'rice',
        description: null,
        products: [
          {
            id: 'product-1',
            name: 'Chicken Rice',
            slug: 'chicken-rice',
            description: null,
            imageUrl: null,
            price: 35000,
            stock: 20,
          },
        ],
      },
    ]);

    const { getByText } = renderWithClient(<CanteenScreen />);

    await waitFor(() => expect(getByText('Chicken Rice')).toBeTruthy());
  });

  it('prefetches catalog images without prefetching QR checkout images', async () => {
    const productImageUrl = 'https://img.test/chicken-rice.jpg';
    const qrCheckoutUrl = 'https://qr.sepay.vn/img?acc=123456789';

    mockCanteenApi.getCatalog.mockResolvedValue([
      {
        id: 'cat-1',
        name: 'Rice',
        slug: 'rice',
        description: null,
        products: [
          {
            id: 'product-1',
            name: 'Chicken Rice',
            slug: 'chicken-rice',
            description: null,
            imageUrl: productImageUrl,
            price: 35000,
            stock: 20,
          },
        ],
      },
    ]);
    renderWithClient(<CanteenScreen />);

    await waitFor(() => {
      expect(mockedExpoImage.prefetch).toHaveBeenCalledWith([productImageUrl], 'disk');
    });
    expect(mockedExpoImage.prefetch).not.toHaveBeenCalledWith([qrCheckoutUrl], 'disk');
  });

  it('renders QR-only payment panel for a pending order', async () => {
    mockCanteenApi.getMyOrders.mockResolvedValue([makeOrder('pending_payment')]);

    const { getByText, queryByText, unmount } = renderWithClient(<CanteenScreen />);

    await waitFor(() => expect(getByText('ORD-001')).toBeTruthy());
    expect(queryByText('Ẩn QR')).toBeNull();
    expect(queryByText('Thanh toán MoMo')).toBeNull();

    fireEvent.press(getByText('Thanh toán QR'));

    await waitFor(() => {
      expect(mockCanteenApi.createSepayPayment).toHaveBeenCalledWith('order-1');
      expect(getByText('Ẩn QR')).toBeTruthy();
    });

    unmount();
  });

  it('shows an error alert when QR payment creation fails', async () => {
    mockCanteenApi.getMyOrders.mockResolvedValue([makeOrder('pending_payment')]);
    mockCanteenApi.createSepayPayment.mockRejectedValue({
      message: 'Cấu hình SePay chưa đầy đủ.',
    });

    const { getByText, queryByText } = renderWithClient(<CanteenScreen />);

    await waitFor(() => expect(getByText('ORD-001')).toBeTruthy());
    fireEvent.press(getByText('Thanh toán QR'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Thanh toán QR',
        'Cấu hình SePay chưa đầy đủ.',
      );
      expect(queryByText('Ẩn QR')).toBeNull();
    });
  });

  it('does not start polling when no QR panel is open', async () => {
    jest.useFakeTimers();
    mockCanteenApi.getMyOrders.mockResolvedValue([makeOrder('pending_payment')]);

    renderWithClient(<CanteenScreen />);

    await waitFor(() => {
      expect(mockCanteenApi.getMyOrders).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockCanteenApi.getMyOrders).toHaveBeenCalledTimes(1);
  });

  it('hides QR and shows paid status after polling refresh', async () => {
    jest.useFakeTimers();

    let orderState: CanteenOrderRecord['status'] = 'pending_payment';
    mockCanteenApi.getMyOrders.mockImplementation(async () => [makeOrder(orderState)]);

    const { getByText, queryByText } = renderWithClient(<CanteenScreen />);

    await waitFor(() => expect(getByText('ORD-001')).toBeTruthy());
    fireEvent.press(getByText('Thanh toán QR'));

    await waitFor(() => {
      expect(getByText('Ẩn QR')).toBeTruthy();
      expect(mockCanteenApi.getMyOrders).toHaveBeenCalledTimes(2);
    });

    orderState = 'paid';

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(queryByText('Ẩn QR')).toBeNull();
      expect(queryByText('Thanh toán QR')).toBeNull();
      expect(getByText('Đã thanh toán')).toBeTruthy();
    });
  });

  it('hides QR and allows retry when polling refresh returns payment_failed', async () => {
    jest.useFakeTimers();

    let orderState: CanteenOrderRecord['status'] = 'pending_payment';
    mockCanteenApi.getMyOrders.mockImplementation(async () => [makeOrder(orderState)]);

    const { getByText, queryByText } = renderWithClient(<CanteenScreen />);

    await waitFor(() => expect(getByText('ORD-001')).toBeTruthy());
    fireEvent.press(getByText('Thanh toán QR'));

    await waitFor(() => {
      expect(getByText('Ẩn QR')).toBeTruthy();
    });

    orderState = 'payment_failed';

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(queryByText('Ẩn QR')).toBeNull();
      expect(getByText('Thanh toán lỗi')).toBeTruthy();
      expect(getByText('Thanh toán QR')).toBeTruthy();
    });
  });

  it('deletes a pending order from history', async () => {
    mockCanteenApi.getMyOrders.mockResolvedValue([makeOrder('pending_payment')]);

    const { getByText } = renderWithClient(<CanteenScreen />);

    await waitFor(() => expect(getByText('ORD-001')).toBeTruthy());
    fireEvent.press(getByText('Xóa đơn'));

    await waitFor(() => {
      expect(mockCanteenApi.deleteOrder).toHaveBeenCalledWith('order-1');
    });
  });
});
