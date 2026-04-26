import { fireEvent, render } from '@testing-library/react-native';
import { USER_ROLES } from '@smart-campus/shared';
import React from 'react';

import LecturerAttendanceScreen, {
  groupAttendanceCardsByDay,
  mapScheduleToAttendanceCards,
  resolveScheduleCardToClassSection,
} from '../lecturer';

import { useScheduleScreenData } from '@/hooks/use-schedule-screen';
import { useAuthStore } from '@/stores/auth-store';

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockUseQuery = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

jest.mock('@/hooks/use-schedule-screen');
jest.mock('@/stores/auth-store');
jest.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

const mockUseScheduleScreenData = useScheduleScreenData as unknown as jest.Mock;
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

const scheduleData = [
  {
    id: 'schedule-2',
    classCode: 'SE346.Q21',
    sectionCode: 'Q21',
    dayOfWeek: 3,
    startTime: '07:30',
    endTime: '09:45',
    room: 'B1.04',
    instructor: 'Nguyen Hoang Phuc',
    sessionType: 'daytime' as const,
    course: {
      code: 'SE346',
      name: 'Lập trình trên thiết bị di động',
      credits: 4,
    },
  },
  {
    id: 'schedule-1',
    classCode: 'SE301.Q21',
    sectionCode: 'Q21',
    dayOfWeek: 2,
    startTime: '10:00',
    endTime: '11:30',
    room: 'E03.2',
    instructor: 'Nguyen Hoang Phuc',
    sessionType: 'daytime' as const,
    course: {
      code: 'SE301',
      name: 'Phát triển phần mềm mã nguồn mở',
      credits: 3,
    },
  },
];

const classSections = [
  {
    id: 'class-section-se346',
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
        sessionType: 'daytime' as const,
        note: null,
      },
    ],
  },
];

function mockRole(role: string) {
  mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
    selector({
      user: {
        id: 'user-1',
        role,
      },
    }),
  );
}

describe('lecturer attendance helpers', () => {
  it('matches class sections by priority order', () => {
    const matched = resolveScheduleCardToClassSection(scheduleData[0], classSections);

    expect(matched?.id).toBe('class-section-se346');
  });

  it('maps and groups schedule cards by day and time', () => {
    const cards = mapScheduleToAttendanceCards(scheduleData, classSections);
    const groups = groupAttendanceCardsByDay(cards);

    expect(cards.map((item) => item.id)).toEqual(['schedule-1', 'schedule-2']);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.dayOfWeek).toBe(2);
    expect(groups[1]?.dayOfWeek).toBe(3);
    expect(groups[1]?.items[0]?.attendanceSection?.id).toBe('class-section-se346');
  });
});

describe('LecturerAttendanceScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRole(USER_ROLES.LECTURER);

    mockUseScheduleScreenData.mockReturnValue({
      semesters: [
        {
          id: 'sem-current',
          name: 'HK2 2025-2026',
          academicYear: '2025-2026',
          term: 2,
          startDate: '2026-01-05T00:00:00.000Z',
          endDate: '2026-05-31T23:59:59.000Z',
          isCurrent: true,
        },
      ],
      resolvedSemesterId: 'sem-current',
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      schedule: scheduleData,
    });

    mockUseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
      const key = queryKey.join(':');

      if (key === 'attendance:lecturer:class-sections') {
        return {
          data: classSections,
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
  });

  it('renders schedule cards from lecturer mock schedule', () => {
    const { getAllByText, getByText } = render(<LecturerAttendanceScreen />);

    expect(getByText('Thứ ba')).toBeTruthy();
    expect(getByText('Thứ tư')).toBeTruthy();
    expect(getByText('SE301 · SE301.Q21')).toBeTruthy();
    expect(getAllByText('Phát triển phần mềm mã nguồn mở').length).toBeGreaterThan(0);
    expect(getByText('Danh sách lớp theo lịch học kỳ')).toBeTruthy();
  });

  it('navigates to detail workspace when pressing a mapped class card', () => {
    const { getByText } = render(<LecturerAttendanceScreen />);

    fireEvent.press(getByText('Lập trình trên thiết bị di động'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/services/attendance/class/[scheduleId]',
      params: { scheduleId: 'schedule-2' },
    });
  });

  it('shows warning state when a schedule card cannot be mapped to attendance data', () => {
    const { getAllByText } = render(<LecturerAttendanceScreen />);

    expect(getAllByText('Chưa liên kết dữ liệu điểm danh').length).toBeGreaterThan(0);
  });

  it('shows an access denied state for unsupported roles', () => {
    mockRole(USER_ROLES.CANTEEN_ADMIN);

    const { getByText } = render(<LecturerAttendanceScreen />);

    expect(getByText('Bạn không có quyền truy cập')).toBeTruthy();
  });

  it.each([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])(
    'shows admin-friendly empty state for %s role',
    (role) => {
      mockRole(role);
      mockUseScheduleScreenData.mockReturnValue({
        semesters: [],
        resolvedSemesterId: 'sem-current',
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
        schedule: [],
      });
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
      });

      const { getByText } = render(<LecturerAttendanceScreen />);

      expect(getByText('Chưa có lớp học phần')).toBeTruthy();
    },
  );
});
