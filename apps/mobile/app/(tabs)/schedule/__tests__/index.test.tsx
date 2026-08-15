import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert, Dimensions, StyleSheet } from 'react-native';

import ScheduleScreen, {
  buildSubjectColorIndex,
  filterScheduleForLecturer,
  getSemesterColorByStatus,
  getSubjectColorByCode,
} from '../index';

import { getScheduleDaySpacing } from '@/components/schedule/schedule-day-group';
import { useEffectiveRole, useEffectiveUser } from '@/hooks/use-effective-role';
import { useOperationsScreenData, useScheduleScreenData } from '@/hooks/use-schedule-screen';
import { useAuthStore } from '@/stores/auth-store';
import { lightTheme } from '@/theme';
import type { ScheduleRecord, SemesterRecord } from '@/types/app-data';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));
jest.mock('@/hooks/use-schedule-screen');
jest.mock('@/hooks/use-effective-role');
jest.mock('@/stores/auth-store');

const mockUseEffectiveRole = useEffectiveRole as jest.Mock;
const mockUseEffectiveUser = useEffectiveUser as jest.Mock;
const mockUseScheduleScreenData = useScheduleScreenData as unknown as jest.Mock;
const mockUseOperationsScreenData = useOperationsScreenData as unknown as jest.Mock;
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockDeleteFireAlert = jest.fn();
const mockDeleteFireAlerts = jest.fn();
const mockColorTheme = {
  isDark: false,
  colors: {
    border: '#D5E2F2',
    info: '#2D8CFF',
    infoSurface: '#E8F1FF',
    primary: '#0E76FD',
    primarySurface: '#EAF2FF',
    surfaceSubtle: '#F5F8FD',
    textMuted: '#334155',
    textSoft: '#64748B',
  },
} as Parameters<typeof getSemesterColorByStatus>[0];

function makeSemester(overrides: Partial<SemesterRecord>): SemesterRecord {
  return {
    id: 'sem',
    name: 'HK2 2025-2026',
    academicYear: '2025-2026',
    term: 2,
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-05-31T00:00:00.000Z',
    isCurrent: false,
    ...overrides,
  };
}

function makeScheduleRecord(code: string): ScheduleRecord {
  return {
    id: `schedule-${code}`,
    classCode: code,
    sectionCode: `${code}.1`,
    dayOfWeek: 2,
    startTime: '09:00',
    endTime: '11:00',
    room: 'E3.1',
    instructor: 'Cô Lan',
    sessionType: 'daytime',
    course: { name: code, code, credits: 3 },
  };
}

function setWindowWidth(width: number) {
  const dimensions = { width, height: 800, scale: 2, fontScale: 1 };
  Dimensions.set({ window: dimensions, screen: dimensions });
}

describe('ScheduleScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockDeleteFireAlert.mockResolvedValue({ deleted: true });
    mockDeleteFireAlerts.mockResolvedValue({ count: 1 });
    mockUseEffectiveRole.mockReturnValue('student');
    mockUseEffectiveUser.mockReturnValue(null);
    setWindowWidth(390);

    mockUseOperationsScreenData.mockReturnValue({
      data: {
        parking: {
          availableSlots: 1,
          totalSlots: 2,
          activeSessions: 1,
          occupiedSlots: 1,
          gateId: 'uit-gate-a',
          lastUpdated: '2026-04-07T05:00:00.000Z',
          sensors: {
            temperature: 29,
            humidity: 65,
            rainDetected: false,
            fireDetected: false,
            deviceIp: '192.168.1.10',
            reportedAt: '2026-04-07T05:00:00.000Z',
          },
        },
        telemetry: {
          gateId: 'uit-gate-a',
          fireDetected: false,
          rainDetected: false,
          temperature: 29,
          humidity: 65,
          deviceIp: '192.168.1.10',
          reportedAt: '2026-04-07T05:00:00.000Z',
        },
        fireAlerts: {
          items: [
            {
              id: 'fire-1',
              gateId: 'uit-gate-a',
              message: 'Phát hiện khói',
              isResolved: false,
              reportedAt: '2026-04-07T05:00:00.000Z',
              resolvedAt: null,
              telemetrySnapshot: {
                id: 'snap-1',
                gateId: 'uit-gate-a',
                deviceIp: '192.168.1.10',
                slotBitmap: null,
                slots: [],
                temperature: 29,
                humidity: 65,
                rainDetected: false,
                fireDetected: true,
                reportedAt: '2026-04-07T05:00:00.000Z',
              },
            },
          ],
          meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
        },
        unreadCount: 3,
      },
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
      deleteFireAlert: mockDeleteFireAlert,
      deleteFireAlerts: mockDeleteFireAlerts,
      isMutatingFireAlerts: false,
    });
  });

  it('uses status-based colors for semester cards', () => {
    const current = getSemesterColorByStatus(mockColorTheme, makeSemester({ isCurrent: true }));
    const finishedA = getSemesterColorByStatus(
      mockColorTheme,
      makeSemester({ name: 'HK1 2024-2025', startDate: '2024-09-01T00:00:00.000Z' }),
    );
    const finishedB = getSemesterColorByStatus(
      mockColorTheme,
      makeSemester({ name: 'HK2 2023-2024', startDate: '2024-01-01T00:00:00.000Z' }),
    );
    const future = getSemesterColorByStatus(
      mockColorTheme,
      makeSemester({ name: 'HK1 2100-2101', startDate: '2100-09-01T00:00:00.000Z' }),
    );

    expect(current.borderColor).toBe(mockColorTheme.colors.primary);
    expect(finishedA.borderColor).toBe(mockColorTheme.colors.border);
    expect(finishedB.borderColor).toBe(finishedA.borderColor);
    expect(finishedB.titleColor).toBe(finishedA.titleColor);
    expect(future.borderStyle).toBe('dashed');
  });

  it('maps daily schedule colors by subject code', () => {
    const subjectColorIndex = buildSubjectColorIndex([
      makeScheduleRecord('SE346'),
      makeScheduleRecord('CS312'),
      makeScheduleRecord('SE346'),
    ]);

    const se346 = getSubjectColorByCode(mockColorTheme, 'SE346', subjectColorIndex);
    const cs312 = getSubjectColorByCode(mockColorTheme, 'CS312', subjectColorIndex);

    expect(subjectColorIndex.size).toBe(2);
    expect(se346).toEqual(getSubjectColorByCode(mockColorTheme, 'SE346', subjectColorIndex));
    expect(se346.accent).not.toBe(cs312.accent);
  });

  it('filters lecturer schedules by normalized full name', () => {
    const filtered = filterScheduleForLecturer(
      [
        {
          ...makeScheduleRecord('SE346'),
          instructor: 'Nguyen Hoang Phuc',
        },
        {
          ...makeScheduleRecord('CS312'),
          instructor: 'Phạm Thu Hà',
        },
      ],
      {
        firstName: 'Hoàng Phúc',
        lastName: 'Nguyễn',
      },
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.classCode).toBe('SE346');
  });

  it('renders academic schedule for student', () => {
    setWindowWidth(320);
    mockUseEffectiveRole.mockReturnValue('student');
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: { role: 'student' } };
      return selector(state);
    });
    mockUseScheduleScreenData.mockReturnValue({
      semesters: [
        {
          id: 'sem-1',
          name: 'HK2 2024-2025',
          academicYear: '2024-2025',
          term: 2,
          startDate: '2025-01-01T00:00:00.000Z',
          endDate: '2025-05-31T00:00:00.000Z',
          isCurrent: true,
        },
      ],
      resolvedSemesterId: 'sem-1',
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      schedule: [
        {
          id: 'schedule-1',
          classCode: 'SE346',
          sectionCode: 'SE346.1',
          dayOfWeek: 2,
          startTime: '09:00',
          endTime: '11:00',
          room: 'E3.1',
          instructor: 'Cô Lan',
          sessionType: 'daytime',
          course: { name: 'SE346', code: 'SE346', credits: 3 },
        },
        {
          id: 'schedule-2',
          classCode: 'CS312',
          sectionCode: 'CS312.1',
          dayOfWeek: 3,
          startTime: '13:00',
          endTime: '15:00',
          room: 'E3.2',
          instructor: 'Cô Lan',
          sessionType: 'daytime',
          course: { name: 'CS312', code: 'CS312', credits: 3 },
        },
      ],
    });

    const { getByText, getAllByText, getByTestId } = render(<ScheduleScreen />);
    const spacing = getScheduleDaySpacing(lightTheme);

    expect(getByText('Lịch học trong học kỳ')).toBeTruthy();
    expect(getAllByText('HK2 2024-2025').length).toBeGreaterThan(0);
    expect(getAllByText('SE346').length).toBeGreaterThan(0);
    expect(getByText('Buổi học gần nhất')).toBeTruthy();
    expect(StyleSheet.flatten(getByTestId('schedule-day-list').props.style).gap).toBe(
      spacing.daySectionGap,
    );
    expect(StyleSheet.flatten(getByTestId('schedule-day-2').props.style).gap).toBe(
      spacing.dayContentGap,
    );
    expect(StyleSheet.flatten(getByTestId('schedule-day-3').props.style).gap).toBe(
      spacing.dayContentGap,
    );
    expect(StyleSheet.flatten(getByTestId('schedule-day-header-2').props.style)).toEqual(
      StyleSheet.flatten(getByTestId('schedule-day-header-3').props.style),
    );
    expect(StyleSheet.flatten(getByTestId('schedule-session-list-2').props.style).gap).toBe(
      spacing.scheduleItemGap,
    );
    expect(StyleSheet.flatten(getByTestId('schedule-session-list-3').props.style).gap).toBe(
      spacing.scheduleItemGap,
    );
    expect(
      StyleSheet.flatten(getByTestId('schedule-day-2').props.style).paddingTop,
    ).toBeUndefined();
    expect(
      StyleSheet.flatten(getByTestId('schedule-day-3').props.style).paddingTop,
    ).toBeUndefined();
    expect(StyleSheet.flatten(getByTestId('schedule-day-2').props.style).marginTop).toBeUndefined();
    expect(StyleSheet.flatten(getByTestId('schedule-day-3').props.style).marginTop).toBeUndefined();
    expect(
      StyleSheet.flatten(getByTestId('schedule-session-header-schedule-1').props.style)
        .flexDirection,
    ).toBe('column');
    expect(
      StyleSheet.flatten(getByTestId('schedule-session-time-schedule-1').props.style),
    ).toMatchObject({ alignItems: 'flex-start', minWidth: 0, width: '100%' });
    expect(
      StyleSheet.flatten(getByTestId('schedule-session-header-main-schedule-1').props.style),
    ).toMatchObject({ flex: 0, minWidth: 0, width: '100%' });
    expect(
      StyleSheet.flatten(getByTestId('schedule-session-card-schedule-1').props.style),
    ).toMatchObject({ alignSelf: 'stretch', width: '100%' });
    expect(
      StyleSheet.flatten(getByTestId('schedule-session-card-schedule-2').props.style),
    ).toMatchObject({ alignSelf: 'stretch', width: '100%' });
  });

  it('navigates to semester detail when pressing a semester chip', () => {
    mockUseEffectiveRole.mockReturnValue('student');
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: { role: 'student' } };
      return selector(state);
    });
    mockUseScheduleScreenData.mockReturnValue({
      semesters: [
        {
          id: 'sem-1',
          name: 'HK2 2024-2025',
          academicYear: '2024-2025',
          term: 2,
          startDate: '2025-01-01T00:00:00.000Z',
          endDate: '2025-05-31T00:00:00.000Z',
          isCurrent: true,
        },
        {
          id: 'sem-2',
          name: 'HK1 2024-2025',
          academicYear: '2024-2025',
          term: 1,
          startDate: '2024-09-01T00:00:00.000Z',
          endDate: '2024-12-31T00:00:00.000Z',
          isCurrent: false,
        },
      ],
      resolvedSemesterId: 'sem-1',
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      schedule: [],
    });

    const { getByText } = render(<ScheduleScreen />);

    fireEvent.press(getByText('HK1 2024-2025'));

    expect(mockRouter.push).toHaveBeenCalledWith('/schedule/semester/sem-2');
  });

  it('renders lecturer support entries', () => {
    mockUseEffectiveRole.mockReturnValue('lecturer');
    mockUseEffectiveUser.mockReturnValue({
      role: 'lecturer',
      firstName: 'Hoàng Phúc',
      lastName: 'Nguyễn',
    });
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        user: {
          role: 'lecturer',
          firstName: 'Hoàng Phúc',
          lastName: 'Nguyễn',
        },
      };
      return selector(state);
    });
    mockUseScheduleScreenData.mockReturnValue({
      semesters: [
        {
          id: 'sem-1',
          name: 'HK2 2024-2025',
          academicYear: '2024-2025',
          term: 2,
          startDate: '2025-01-01T00:00:00.000Z',
          endDate: '2025-05-31T00:00:00.000Z',
          isCurrent: true,
        },
      ],
      resolvedSemesterId: 'sem-1',
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      schedule: [
        {
          id: 'schedule-1',
          classCode: 'SE346',
          sectionCode: 'SE346.1',
          dayOfWeek: 2,
          startTime: '09:00',
          endTime: '11:00',
          room: 'E3.1',
          instructor: 'Nguyễn Hoàng Phúc',
          sessionType: 'daytime',
          course: { name: 'SE346', code: 'SE346', credits: 3 },
        },
        {
          id: 'schedule-2',
          classCode: 'CS312',
          sectionCode: 'CS312.1',
          dayOfWeek: 3,
          startTime: '13:00',
          endTime: '15:00',
          room: 'E3.2',
          instructor: 'Phạm Thu Hà',
          sessionType: 'daytime',
          course: { name: 'CS312', code: 'CS312', credits: 3 },
        },
      ],
    });

    const { getByText, getAllByText, queryByText } = render(<ScheduleScreen />);

    expect(getByText('Lịch dạy trong học kỳ')).toBeTruthy();
    expect(getByText('Công cụ giảng dạy')).toBeTruthy();
    expect(getByText('Điểm danh QR')).toBeTruthy();
    expect(queryByText('Bảng lớp học')).toBeNull();
    expect(getByText('Bảng nhập điểm')).toBeTruthy();
    expect(queryByText('Chọn kỳ cần xem.')).toBeNull();
    expect(getAllByText('Nguyễn Hoàng Phúc').length).toBeGreaterThan(0);
    expect(queryByText('CS312')).toBeNull();
  });

  it('does not fall back to full schedule when lecturer name does not match', () => {
    mockUseEffectiveRole.mockReturnValue('lecturer');
    mockUseEffectiveUser.mockReturnValue({
      role: 'lecturer',
      firstName: 'Không',
      lastName: 'Khớp',
    });
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        user: {
          role: 'lecturer',
          firstName: 'Không',
          lastName: 'Khớp',
        },
      };
      return selector(state);
    });
    mockUseScheduleScreenData.mockReturnValue({
      semesters: [
        {
          id: 'sem-1',
          name: 'HK2 2024-2025',
          academicYear: '2024-2025',
          term: 2,
          startDate: '2025-01-01T00:00:00.000Z',
          endDate: '2025-05-31T00:00:00.000Z',
          isCurrent: true,
        },
      ],
      resolvedSemesterId: 'sem-1',
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      schedule: [
        {
          id: 'schedule-1',
          classCode: 'SE346',
          sectionCode: 'SE346.1',
          dayOfWeek: 2,
          startTime: '09:00',
          endTime: '11:00',
          room: 'E3.1',
          instructor: 'Nguyễn Hoàng Phúc',
          sessionType: 'daytime',
          course: { name: 'SE346', code: 'SE346', credits: 3 },
        },
      ],
    });

    const { getByText, queryByText } = render(<ScheduleScreen />);

    expect(getByText('Theo ngày')).toBeTruthy();
    expect(getByText('Chưa có lịch')).toBeTruthy();
    expect(queryByText('SE346')).toBeNull();
  });

  it('renders operations dashboard for admin users', () => {
    mockUseEffectiveRole.mockReturnValue('admin');
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: { role: 'admin' } };
      return selector(state);
    });
    mockUseScheduleScreenData.mockReturnValue({
      semesters: [],
      resolvedSemesterId: undefined,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      schedule: [],
    });

    const { getByText } = render(<ScheduleScreen />);

    expect(getByText('Vận hành')).toBeTruthy();
    expect(getByText('Điều phối campus')).toBeTruthy();
    expect(getByText('Broadcast')).toBeTruthy();
    expect(getByText('Tài khoản')).toBeTruthy();
  });

  it('confirms fire alert delete actions from the admin operations summary', () => {
    mockUseEffectiveRole.mockReturnValue('admin');
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: { role: 'admin' } };
      return selector(state);
    });
    mockUseScheduleScreenData.mockReturnValue({
      semesters: [],
      resolvedSemesterId: undefined,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      schedule: [],
    });

    const { getByTestId } = render(<ScheduleScreen />);

    fireEvent.press(getByTestId('operations-delete-fire-alert-fire-1'));
    let alertCall = (Alert.alert as jest.Mock).mock.calls.at(-1);
    expect(alertCall?.[0]).toBe('Xóa cảnh báo');
    let buttons = alertCall?.[2] as Array<{ text?: string; onPress?: () => void }> | undefined;
    buttons?.find((button) => button.text === 'Xóa')?.onPress?.();
    expect(mockDeleteFireAlert).toHaveBeenCalledWith('fire-1');

    fireEvent.press(getByTestId('operations-delete-all-fire-alerts'));
    alertCall = (Alert.alert as jest.Mock).mock.calls.at(-1);
    expect(alertCall?.[0]).toBe('Xóa tất cả cảnh báo');
    buttons = alertCall?.[2] as Array<{ text?: string; onPress?: () => void }> | undefined;
    buttons?.find((button) => button.text === 'Xóa tất cả')?.onPress?.();
    expect(mockDeleteFireAlerts).toHaveBeenCalledTimes(1);
  });

  it('shows a localized error when deleting a fire alert fails', async () => {
    mockUseEffectiveRole.mockReturnValue('admin');
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: { role: 'admin' } };
      return selector(state);
    });
    mockUseScheduleScreenData.mockReturnValue({
      semesters: [],
      resolvedSemesterId: undefined,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      schedule: [],
    });
    mockDeleteFireAlert.mockRejectedValueOnce(new Error('Network Error'));

    const { getByTestId } = render(<ScheduleScreen />);

    fireEvent.press(getByTestId('operations-delete-fire-alert-fire-1'));
    const confirmCall = (Alert.alert as jest.Mock).mock.calls.at(-1);
    const buttons = confirmCall?.[2] as Array<{ text?: string; onPress?: () => void }> | undefined;
    buttons?.find((button) => button.text === 'Xóa')?.onPress?.();

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenLastCalledWith(
        'Không xóa được cảnh báo',
        'Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng và thử lại.',
      );
    });
  });

  it('keeps admin entry tiles scoped to the operations route tree', () => {
    mockUseEffectiveRole.mockReturnValue('admin');
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: { role: 'admin' } };
      return selector(state);
    });
    mockUseScheduleScreenData.mockReturnValue({
      semesters: [],
      resolvedSemesterId: undefined,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      schedule: [],
    });

    const { getByText } = render(<ScheduleScreen />);

    fireEvent.press(getByText('Fire alert'));
    fireEvent.press(getByText('Parking + IoT'));

    expect(mockRouter.push).toHaveBeenNthCalledWith(1, '/operations/fire-alerts');
    expect(mockRouter.push).toHaveBeenNthCalledWith(2, '/operations/parking-ops');
  });
});
