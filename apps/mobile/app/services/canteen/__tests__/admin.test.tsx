import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { USER_ROLES } from '@smart-campus/shared';
import React from 'react';
import { Alert } from 'react-native';

import CanteenAdminScreen from '../admin';

import { canteenApi } from '@/services/api/canteen';
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
    getAdminCatalog: jest.fn(),
    getAdminOrders: jest.fn(),
    deleteAdminOrder: jest.fn(),
    completeOrder: jest.fn(),
    createCategory: jest.fn(),
    createProduct: jest.fn(),
  },
}));

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockCanteenApi = canteenApi as unknown as {
  getAdminCatalog: jest.Mock;
  getAdminOrders: jest.Mock;
  deleteAdminOrder: jest.Mock;
};

function makeAdminOrder() {
  return {
    id: 'order-1',
    orderCode: 'CTN-ADMIN-001',
    status: 'completed' as const,
    totalAmount: 48000,
    note: null,
    createdAt: '2026-05-05T12:34:54.000Z',
    updatedAt: '2026-05-05T12:34:54.000Z',
    completedAt: '2026-05-05T12:40:00.000Z',
    cancelledAt: null,
    items: [
      {
        id: 'item-1',
        productId: 'product-1',
        productName: 'Com suon',
        unitPrice: 24000,
        quantity: 2,
        lineTotal: 48000,
      },
    ],
    latestPayment: {
      id: 'payment-1',
      status: 'paid',
      amount: 48000,
      checkoutUrl: null,
      createdAt: '2026-05-05T12:35:00.000Z',
      paidAt: '2026-05-05T12:36:00.000Z',
    },
    requestedBy: {
      id: 'student-1',
      email: 'student@uit.edu.vn',
      fullName: 'Nguyen Hoang Phuc',
      role: USER_ROLES.STUDENT,
    },
    completedBy: null,
    viewerRole: USER_ROLES.ADMIN,
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

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('CanteenAdminScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockCanteenApi.getAdminCatalog.mockResolvedValue([]);
    mockCanteenApi.getAdminOrders.mockResolvedValue([]);
    mockCanteenApi.deleteAdminOrder.mockResolvedValue({
      id: 'order-1',
      deleted: true,
      restoredStock: false,
    });
  });

  it.each([USER_ROLES.CANTEEN_ADMIN, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])(
    'allows %s role to access canteen admin screen',
    async (role) => {
      mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
        selector({
          user: { id: 'manager-1', role },
        }),
      );

      const { getByText } = renderWithClient(<CanteenAdminScreen />);

      await waitFor(() => {
        expect(getByText('Quản trị canteen')).toBeTruthy();
      });

      expect(mockCanteenApi.getAdminCatalog).toHaveBeenCalledTimes(1);
      expect(mockCanteenApi.getAdminOrders).toHaveBeenCalledTimes(1);
    },
  );

  it('shows access denied for non-manager role', async () => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        user: { id: 'student-1', role: USER_ROLES.STUDENT },
      }),
    );

    const { getByText } = renderWithClient(<CanteenAdminScreen />);

    await waitFor(() => {
      expect(getByText('Bạn không có quyền truy cập')).toBeTruthy();
    });

    expect(mockCanteenApi.getAdminCatalog).not.toHaveBeenCalled();
    expect(mockCanteenApi.getAdminOrders).not.toHaveBeenCalled();
  });

  it('allows admin to delete an order from history details', async () => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        user: { id: 'admin-1', role: USER_ROLES.ADMIN },
      }),
    );
    mockCanteenApi.getAdminOrders.mockResolvedValue([makeAdminOrder()]);

    const { getByText } = renderWithClient(<CanteenAdminScreen />);

    fireEvent.press(getByText('Lịch sử'));

    await waitFor(() => {
      expect(getByText('CTN-ADMIN-001')).toBeTruthy();
    });

    fireEvent.press(getByText('CTN-ADMIN-001'));

    await waitFor(() => {
      expect(getByText('Xóa lịch sử đơn')).toBeTruthy();
    });

    fireEvent.press(getByText('Xóa lịch sử đơn'));

    const alertCall = (Alert.alert as jest.Mock).mock.calls.at(-1);
    expect(alertCall?.[0]).toBe('Xóa lịch sử đơn');
    const buttons = alertCall?.[2] as Array<{ text?: string; onPress?: () => void }> | undefined;
    const confirmButton = buttons?.find((button) => button.text === 'Xóa');
    expect(confirmButton?.onPress).toBeTruthy();
    await act(async () => {
      confirmButton?.onPress?.();
    });

    await waitFor(() => {
      expect(mockCanteenApi.deleteAdminOrder).toHaveBeenCalledWith('order-1');
    });
  });
});
