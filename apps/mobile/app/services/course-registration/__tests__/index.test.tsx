import { USER_ROLES } from '@smart-campus/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react-native';
import React from 'react';

import CourseRegistrationScreen from '../index';

import { registrationsApi } from '@/services/api/registrations';
import { useAuthStore } from '@/stores/auth-store';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));
jest.mock('@/services/api/registrations', () => ({
  registrationsApi: {
    listAvailableClassSections: jest.fn(),
    listMyRegistrations: jest.fn(),
    registerClassSection: jest.fn(),
    dropRegistration: jest.fn(),
  },
}));
jest.mock('@/stores/auth-store');

const mockRegistrationsApi = registrationsApi as unknown as {
  listAvailableClassSections: jest.Mock;
  listMyRegistrations: jest.Mock;
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

describe('CourseRegistrationScreen', () => {
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

  it('shows access denied for non-student role', async () => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        user: {
          role: USER_ROLES.LECTURER,
        },
      }),
    );

    const { getByText } = renderWithClient(<CourseRegistrationScreen />);

    await waitFor(() => {
      expect(getByText('Bạn không có quyền truy cập')).toBeTruthy();
    });
  });

  it('renders available class sections for student role', async () => {
    mockRegistrationsApi.listAvailableClassSections.mockResolvedValue([
      {
        id: 'section-1',
        classCode: 'SE346.Q11',
        sectionCode: 'Q11',
        note: null,
        registrationOpen: true,
        capacity: 60,
        enrolledCount: 25,
        seatsRemaining: 35,
        isRegistered: false,
        hasConflict: false,
        canRegister: true,
        course: {
          code: 'SE346',
          name: 'Internet of Things',
          credits: 4,
        },
        semester: {
          id: 'sem-2025-2026-2',
          name: 'HK2 2025-2026',
          isCurrent: true,
        },
        lecturer: {
          id: 'lecturer-1',
          email: 'lecturer@uit.edu.vn',
          fullName: 'Le Thanh Son',
        },
        meetings: [],
      },
    ]);
    mockRegistrationsApi.listMyRegistrations.mockResolvedValue([]);

    const { getByText } = renderWithClient(<CourseRegistrationScreen />);

    await waitFor(() => {
      expect(getByText('SE346 · SE346.Q11')).toBeTruthy();
    });
  });
});
