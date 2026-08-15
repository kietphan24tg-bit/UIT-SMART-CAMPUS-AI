import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';

import SemesterScheduleDetailScreen from '../[id]';

import { getScheduleDaySpacing } from '@/components/schedule/schedule-day-group';
import { scheduleApi } from '@/services/api/schedule';
import { lightTheme } from '@/theme';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

let mockRouteId = 'sem-1';

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ id: mockRouteId }),
}));
jest.mock('@/services/api/schedule', () => ({
  scheduleApi: {
    getScheduleBySemesterId: jest.fn(),
  },
}));

const mockGetScheduleBySemesterId = scheduleApi.getScheduleBySemesterId as jest.Mock;

function setWindowWidth(width: number) {
  const dimensions = { width, height: 800, scale: 2, fontScale: 1 };
  Dimensions.set({ window: dimensions, screen: dimensions });
}

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });

  const screen = render(
    <QueryClientProvider client={queryClient}>
      <SemesterScheduleDetailScreen />
    </QueryClientProvider>,
  );

  return { ...screen, queryClient };
}

describe('SemesterScheduleDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteId = 'sem-1';
    setWindowWidth(390);
  });

  it('should fetch and render semester detail grouped by day', async () => {
    setWindowWidth(320);
    mockGetScheduleBySemesterId.mockResolvedValue({
      id: 'sem-1',
      name: 'HK2 2024-2025',
      academicYear: '2024-2025',
      term: 2,
      startDate: '2026-01-26T00:00:00.000Z',
      endDate: '2026-05-30T00:00:00.000Z',
      isCurrent: true,
      sessions: [
        {
          id: 'session-1',
          classCode: 'SE361.Q21',
          sectionCode: 'SE361.Q21',
          dayOfWeek: 1,
          startTime: '06:30',
          endTime: '09:45',
          startPeriod: 1,
          endPeriod: 3,
          room: 'C314',
          instructor: 'Nguyễn Duy Khánh',
          sessionType: 'daytime',
          course: { name: 'Phát triển PM - Microsoft', code: 'SE361', credits: 3 },
        },
        {
          id: 'session-2',
          classCode: 'SE101.Q22',
          sectionCode: 'SE101.Q22',
          dayOfWeek: 2,
          startTime: '06:30',
          endTime: '09:45',
          startPeriod: 1,
          endPeriod: 3,
          room: 'C302',
          instructor: 'Nguyễn Công Hoan',
          sessionType: 'daytime',
          course: { name: 'Phương pháp mô hình hóa', code: 'SE101', credits: 3 },
        },
        {
          id: 'session-3',
          classCode: 'PE231.Q24',
          sectionCode: 'PE231.Q24',
          dayOfWeek: 2,
          startTime: '13:00',
          endTime: '14:30',
          startPeriod: 6,
          endPeriod: 7,
          room: 'Sân',
          instructor: 'Phạm Thị Dịu',
          sessionType: 'evening',
          course: { name: 'Giáo dục thể chất 1', code: 'PE231', credits: 2 },
        },
      ],
    });

    const { getAllByText, getByText, getByTestId, queryByText, queryClient } = renderScreen();

    await waitFor(() => {
      expect(mockGetScheduleBySemesterId).toHaveBeenCalledWith('sem-1');
    });

    await waitFor(() => {
      expect(getByText('HK2 2024-2025')).toBeTruthy();
    });
    const spacing = getScheduleDaySpacing(lightTheme);

    expect(getAllByText('Lịch chính').length).toBeGreaterThan(0);
    expect(getByText('Hình thức 2')).toBeTruthy();
    expect(getByText('THỨ HAI')).toBeTruthy();
    expect(getByText('THỨ BA')).toBeTruthy();
    expect(getByText('Phát triển PM - Microsoft')).toBeTruthy();
    expect(queryByText('Giáo dục thể chất 1')).toBeNull();
    expect(StyleSheet.flatten(getByTestId('semester-schedule-day-list').props.style).gap).toBe(
      spacing.daySectionGap,
    );
    expect(StyleSheet.flatten(getByTestId('semester-schedule-day-1').props.style).gap).toBe(
      spacing.dayContentGap,
    );
    expect(StyleSheet.flatten(getByTestId('semester-schedule-day-2').props.style).gap).toBe(
      spacing.dayContentGap,
    );
    expect(StyleSheet.flatten(getByTestId('semester-schedule-day-header-1').props.style)).toEqual(
      StyleSheet.flatten(getByTestId('semester-schedule-day-header-2').props.style),
    );
    expect(
      StyleSheet.flatten(getByTestId('semester-schedule-session-list-1').props.style).gap,
    ).toBe(spacing.scheduleItemGap);
    expect(
      StyleSheet.flatten(getByTestId('semester-schedule-session-list-2').props.style).gap,
    ).toBe(spacing.scheduleItemGap);
    expect(
      StyleSheet.flatten(getByTestId('semester-schedule-day-1').props.style).paddingTop,
    ).toBeUndefined();
    expect(
      StyleSheet.flatten(getByTestId('semester-schedule-day-2').props.style).paddingTop,
    ).toBeUndefined();
    expect(
      StyleSheet.flatten(getByTestId('semester-schedule-day-1').props.style).marginTop,
    ).toBeUndefined();
    expect(
      StyleSheet.flatten(getByTestId('semester-schedule-day-2').props.style).marginTop,
    ).toBeUndefined();
    expect(
      StyleSheet.flatten(getByTestId('semester-session-header-session-1').props.style)
        .flexDirection,
    ).toBe('column');
    expect(
      StyleSheet.flatten(getByTestId('semester-session-time-session-1').props.style),
    ).toMatchObject({ alignItems: 'flex-start', minWidth: 0, width: '100%' });
    expect(
      StyleSheet.flatten(getByTestId('semester-session-header-main-session-1').props.style),
    ).toMatchObject({ flex: 0, minWidth: 0, width: '100%' });
    expect(
      StyleSheet.flatten(getByTestId('semester-session-card-session-1').props.style),
    ).toMatchObject({ alignSelf: 'stretch', width: '100%' });
    expect(
      StyleSheet.flatten(getByTestId('semester-session-card-session-2').props.style),
    ).toMatchObject({ alignSelf: 'stretch', width: '100%' });
    queryClient.clear();
  });

  it('should switch to the second segment and render evening schedule', async () => {
    mockGetScheduleBySemesterId.mockResolvedValue({
      id: 'sem-1',
      name: 'HK2 2024-2025',
      academicYear: '2024-2025',
      term: 2,
      startDate: '2026-01-26T00:00:00.000Z',
      endDate: '2026-05-30T00:00:00.000Z',
      isCurrent: true,
      sessions: [
        {
          id: 'session-1',
          classCode: 'SE361.Q21',
          sectionCode: 'SE361.Q21',
          dayOfWeek: 1,
          startTime: '06:30',
          endTime: '09:45',
          startPeriod: 1,
          endPeriod: 3,
          room: 'C314',
          instructor: 'Nguyễn Duy Khánh',
          sessionType: 'daytime',
          course: { name: 'Phát triển PM - Microsoft', code: 'SE361', credits: 3 },
        },
        {
          id: 'session-3',
          classCode: 'PE231.Q24',
          sectionCode: 'PE231.Q24',
          dayOfWeek: 2,
          startTime: '13:00',
          endTime: '14:30',
          startPeriod: 6,
          endPeriod: 7,
          room: 'Sân',
          instructor: 'Phạm Thị Dịu',
          sessionType: 'evening',
          course: { name: 'Giáo dục thể chất 1', code: 'PE231', credits: 2 },
        },
      ],
    });

    const { getByText, queryByText, queryClient } = renderScreen();

    await waitFor(() => {
      expect(getByText('HK2 2024-2025')).toBeTruthy();
    });

    fireEvent.press(getByText('Hình thức 2'));

    expect(getByText('Giáo dục thể chất 1')).toBeTruthy();
    expect(queryByText('Phát triển PM - Microsoft')).toBeNull();
    queryClient.clear();
  });

  it('should show an empty state when the selected segment has no sessions', async () => {
    mockGetScheduleBySemesterId.mockResolvedValue({
      id: 'sem-1',
      name: 'HK2 2024-2025',
      academicYear: '2024-2025',
      term: 2,
      startDate: '2026-01-26T00:00:00.000Z',
      endDate: '2026-05-30T00:00:00.000Z',
      isCurrent: true,
      sessions: [],
    });

    const { getByText, queryClient } = renderScreen();

    await waitFor(() => {
      expect(getByText('Không có lịch cho mục này')).toBeTruthy();
    });
    queryClient.clear();
  });

  it('should show an error state when fetching fails', async () => {
    mockGetScheduleBySemesterId.mockRejectedValue(new Error('boom'));

    const { getByText, queryClient } = renderScreen();

    await waitFor(() => {
      expect(getByText('Không tải được lịch học kỳ')).toBeTruthy();
    });
    queryClient.clear();
  });
});
