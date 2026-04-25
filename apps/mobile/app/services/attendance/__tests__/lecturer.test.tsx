import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { USER_ROLES } from '@smart-campus/shared';

import LecturerAttendanceScreen from '../lecturer';

import { attendanceApi } from '@/services/api/attendance';
import { useAuthStore } from '@/stores/auth-store';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('@/services/api/attendance', () => ({
  attendanceApi: {
    getLecturerClassSections: jest.fn(),
    startSession: jest.fn(),
    stopSession: jest.fn(),
    getSessionRecords: jest.fn(),
    getLecturerHistory: jest.fn(),
  },
}));

jest.mock('@/stores/auth-store');

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockAttendanceApi = attendanceApi as unknown as {
  getLecturerClassSections: jest.Mock;
  getLecturerHistory: jest.Mock;
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

describe('LecturerAttendanceScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAttendanceApi.getLecturerClassSections.mockResolvedValue([]);
    mockAttendanceApi.getLecturerHistory.mockResolvedValue({ items: [], meta: { total: 0 } });
  });

  it('shows access denied for non-lecturer role', async () => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        user: {
          role: USER_ROLES.STUDENT,
        },
      }),
    );

    const { getByText } = renderWithClient(<LecturerAttendanceScreen />);

    await waitFor(() => {
      expect(getByText('Bạn không có quyền truy cập')).toBeTruthy();
    });
    expect(mockAttendanceApi.getLecturerClassSections).not.toHaveBeenCalled();
  });

  it('renders lecturer empty state when no class sections are assigned', async () => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        user: {
          role: USER_ROLES.LECTURER,
        },
      }),
    );

    const { getByText } = renderWithClient(<LecturerAttendanceScreen />);

    await waitFor(() => {
      expect(getByText('Chưa có lớp được phân công')).toBeTruthy();
    });
    expect(mockAttendanceApi.getLecturerClassSections).toHaveBeenCalledTimes(1);
  });
});
