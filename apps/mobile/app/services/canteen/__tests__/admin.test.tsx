import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react-native';
import { USER_ROLES } from '@smart-campus/shared';
import React from 'react';

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
    getCatalog: jest.fn(),
    getAdminOrders: jest.fn(),
    completeOrder: jest.fn(),
    createCategory: jest.fn(),
    createProduct: jest.fn(),
  },
}));

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockCanteenApi = canteenApi as unknown as {
  getCatalog: jest.Mock;
  getAdminOrders: jest.Mock;
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

describe('CanteenAdminScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanteenApi.getCatalog.mockResolvedValue([]);
    mockCanteenApi.getAdminOrders.mockResolvedValue([]);
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
        expect(getByText('Snapshot quản trị')).toBeTruthy();
      });
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
    expect(mockCanteenApi.getAdminOrders).not.toHaveBeenCalled();
  });
});
