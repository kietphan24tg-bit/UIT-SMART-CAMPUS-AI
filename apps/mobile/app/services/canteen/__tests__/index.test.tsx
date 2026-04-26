import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { USER_ROLES } from '@smart-campus/shared';
import React from 'react';

import CanteenScreen from '../index';

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
    getMyOrders: jest.fn(),
    createOrder: jest.fn(),
    createPayment: jest.fn(),
  },
}));

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockCanteenApi = canteenApi as unknown as {
  getCatalog: jest.Mock;
  getMyOrders: jest.Mock;
  createOrder: jest.Mock;
  createPayment: jest.Mock;
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

describe('CanteenScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanteenApi.getCatalog.mockResolvedValue([]);
    mockCanteenApi.getMyOrders.mockResolvedValue([]);
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
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        user: { id: 'student-1', role: USER_ROLES.STUDENT },
      }),
    );
    mockCanteenApi.getCatalog.mockResolvedValue([
      {
        id: 'cat-1',
        name: 'Cơm phần',
        slug: 'com-phan',
        description: null,
        products: [
          {
            id: 'product-1',
            name: 'Cơm gà nướng',
            slug: 'com-ga-nuong',
            description: null,
            imageUrl: null,
            price: 35000,
            stock: 20,
          },
        ],
      },
    ]);
    mockCanteenApi.getMyOrders.mockResolvedValue([]);

    const { getByText } = renderWithClient(<CanteenScreen />);

    await waitFor(() => expect(getByText('Cơm gà nướng')).toBeTruthy());
  });
});
