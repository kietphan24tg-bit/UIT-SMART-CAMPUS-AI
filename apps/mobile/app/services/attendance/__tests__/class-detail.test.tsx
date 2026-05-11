import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import LecturerAttendanceClassDetailScreen from '../class/[scheduleId]';

import { useScheduleScreenData } from '@/hooks/use-schedule-screen';

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockExportSessionExcel = jest.fn();
const mockExportClassSectionSummaryExcel = jest.fn();
const mockShareAsync = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
  }),
  useLocalSearchParams: () => ({
    scheduleId: 'schedule-2',
  }),
}));

jest.mock('@/hooks/use-schedule-screen');
jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///cache/',
  documentDirectory: 'file:///documents/',
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: (...args: unknown[]) => mockShareAsync(...args),
}));
jest.mock('@/services/api/attendance', () => {
  const actual = jest.requireActual('@/services/api/attendance');
  return {
    ...actual,
    attendanceApi: {
      ...actual.attendanceApi,
      exportSessionExcel: (...args: unknown[]) => mockExportSessionExcel(...args),
      exportClassSectionSummaryExcel: (...args: unknown[]) => mockExportClassSectionSummaryExcel(...args),
    },
  };
});
jest.mock('@tanstack/react-query', () => ({
  QueryClient: class QueryClient {
    invalidateQueries = jest.fn();
  },
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
  }),
}));

const mockUseScheduleScreenData = useScheduleScreenData as unknown as jest.Mock;

describe('LecturerAttendanceClassDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseScheduleScreenData.mockReturnValue({
      semesters: [],
      resolvedSemesterId: 'sem-current',
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      schedule: [
        {
          id: 'schedule-2',
          classCode: 'SE346.Q21',
          sectionCode: 'Q21',
          dayOfWeek: 3,
          startTime: '07:30',
          endTime: '09:45',
          room: 'B1.04',
          instructor: 'Nguyen Hoang Phuc',
          sessionType: 'daytime',
          course: {
            code: 'SE346',
            name: 'Lập trình trên thiết bị di động',
            credits: 4,
          },
        },
      ],
    });

    mockUseQuery.mockImplementation(({ queryKey, enabled }: { queryKey: unknown[]; enabled?: boolean }) => {
      const key = queryKey.join(':');

      if (key === 'attendance:lecturer:class-sections') {
        return {
          data: [
            {
              id: 'section-1',
              classCode: 'SE346.Q21',
              sectionCode: 'Q21',
              note: null,
              capacity: 60,
              enrolledCount: 55,
              registrationOpen: true,
              course: {
                code: 'SE346',
                name: 'Lập trình trên thiết bị di động',
                credits: 4,
              },
              semester: {
                id: 'sem-current',
                name: 'HK2 2025-2026',
                isCurrent: true,
              },
              meetings: [
                {
                  id: 'meeting-1',
                  dayOfWeek: 3,
                  room: 'B1.04',
                  startTime: '07:30',
                  endTime: '09:45',
                  startPeriod: 1,
                  endPeriod: 3,
                  sessionType: 'daytime',
                  note: null,
                },
              ],
            },
          ],
          isLoading: false,
          isError: false,
          refetch: jest.fn(),
        };
      }

      if (key.startsWith('attendance:lecturer:history')) {
        return {
          data: enabled
            ? {
                items: [
                  {
                    id: 'session-1',
                    status: 'closed',
                    startedAt: '2026-04-25T00:30:00.000Z',
                    expiresAt: '2026-04-25T00:45:00.000Z',
                    closedAt: '2026-04-25T00:40:00.000Z',
                    classSection: {
                      id: 'section-1',
                      classCode: 'SE346.Q21',
                      sectionCode: 'Q21',
                    },
                    checkedInCount: 48,
                  },
                ],
                meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
              }
            : undefined,
          isLoading: false,
          isError: false,
          refetch: jest.fn(),
        };
      }

      if (key.startsWith('attendance:lecturer:records')) {
        return {
          data: undefined,
          isLoading: false,
          isError: false,
          refetch: jest.fn(),
        };
      }

      return {
        data: undefined,
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
      };
    });

    mockUseMutation.mockImplementation(() => ({
      mutate: jest.fn(),
      isPending: false,
    }));
    mockExportSessionExcel.mockResolvedValue({
      uri: 'file:///cache/attendance-session-session-1.xlsx',
    });
    mockExportClassSectionSummaryExcel.mockResolvedValue({
      uri: 'file:///cache/attendance-class-summary-section-1.xlsx',
    });
  });

  it('exports and shares an Excel file from history tab', async () => {
    const { getByText } = render(<LecturerAttendanceClassDetailScreen />);

    fireEvent.press(getByText('Lịch sử'));
    fireEvent.press(getByText('Xuất Excel'));

    await waitFor(() => {
      expect(mockExportSessionExcel).toHaveBeenCalledWith(
        'session-1',
        'file:///cache/attendance-session-session-1.xlsx',
      );
      expect(mockShareAsync).toHaveBeenCalled();
    });
  });

  it('exports and shares a class summary Excel file from history header', async () => {
    const { getByText } = render(<LecturerAttendanceClassDetailScreen />);

    fireEvent.press(getByText('Lịch sử'));
    fireEvent.press(getByText('Tổng hợp'));

    await waitFor(() => {
      expect(mockExportClassSectionSummaryExcel).toHaveBeenCalledWith(
        'section-1',
        'file:///cache/attendance-class-summary-section-1.xlsx',
      );
      expect(mockShareAsync).toHaveBeenCalled();
    });
  });
});
