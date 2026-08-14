import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Keyboard, Platform } from 'react-native';

import LecturerGradeSheetScreen from '../[classSectionId]';

import { gradesApi } from '@/services/api/grades';
import { useAuthStore } from '@/stores/auth-store';

const keyboardListeners = new Map<string, Array<(event?: { endCoordinates: { height: number } }) => void>>();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    replace: jest.fn(),
    push: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    classSectionId: 'section-1',
  }),
}));

jest.mock('@/stores/auth-store');
jest.mock('@/services/api/grades', () => ({
  gradesApi: {
    getClassSectionGradeSheet: jest.fn(),
    updateClassSectionGradeWeights: jest.fn(),
    upsertClassSectionGradeSheet: jest.fn(),
  },
}));

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockGradesApi = gradesApi as unknown as {
  getClassSectionGradeSheet: jest.Mock;
  updateClassSectionGradeWeights: jest.Mock;
  upsertClassSectionGradeSheet: jest.Mock;
};
const activeQueryClients: QueryClient[] = [];

const keyboardShowEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
const keyboardHideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

function emitKeyboardEvent(
  eventName: string,
  payload?: {
    endCoordinates: {
      height: number;
    };
  },
) {
  for (const listener of keyboardListeners.get(eventName) ?? []) {
    listener(payload);
  }
}

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        gcTime: 0,
      },
    },
  });

  activeQueryClients.push(queryClient);

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('LecturerGradeSheetScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    keyboardListeners.clear();

    jest.spyOn(Keyboard, 'addListener').mockImplementation((eventName, listener) => {
      const listeners = keyboardListeners.get(eventName) ?? [];
      listeners.push(listener as (event?: { endCoordinates: { height: number } }) => void);
      keyboardListeners.set(eventName, listeners);

      return {
        remove: jest.fn(() => {
          const nextListeners = (keyboardListeners.get(eventName) ?? []).filter(
            (entry) => entry !== listener,
          );
          keyboardListeners.set(eventName, nextListeners);
        }),
      } as never;
    });

    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        user: {
          id: 'lecturer-1',
          role: 'lecturer',
        },
      }),
    );

    const sheetData = {
      classSection: {
        id: 'section-1',
        classCode: 'SE104.Q21',
        sectionCode: 'Q21',
        capacity: 60,
        course: {
          id: 'course-1',
          code: 'SE104',
          name: 'Phân tích yêu cầu phần mềm - VN',
          credits: 4,
        },
        semester: {
          id: 'semester-1',
          name: 'HK2 2025-2026',
          academicYear: '2025-2026',
          term: 2,
          isCurrent: true,
        },
      },
      weights: {
        processWeight: 10,
        practiceWeight: 0,
        midtermWeight: 30,
        finalWeight: 60,
      },
      students: [
        {
          id: 'student-1',
          email: 'student-1@uit.edu.vn',
          firstName: 'An',
          lastName: 'Nguyen Van',
          studentId: '22520001',
          grade: {
            id: 'grade-1',
            processScore: 10,
            practiceScore: 5,
            midtermScore: 3,
            finalScore: 1,
            totalScore: 2.5,
            letterGrade: null,
            gradePoint: null,
            earnedCredits: null,
          },
        },
        {
          id: 'student-2',
          email: 'student-2@uit.edu.vn',
          firstName: 'Binh',
          lastName: 'Le Thi',
          studentId: '22520002',
          grade: {
            id: 'grade-2',
            processScore: 8,
            practiceScore: 7,
            midtermScore: 6,
            finalScore: 5,
            totalScore: 5.9,
            letterGrade: null,
            gradePoint: null,
            earnedCredits: null,
          },
        },
        {
          id: 'student-3',
          email: 'student-3@uit.edu.vn',
          firstName: 'Cuong',
          lastName: 'Tran Minh',
          studentId: '22520003',
          grade: {
            id: 'grade-3',
            processScore: 9,
            practiceScore: 8,
            midtermScore: 7,
            finalScore: 6,
            totalScore: 6.8,
            letterGrade: null,
            gradePoint: null,
            earnedCredits: null,
          },
        },
      ],
    };

    mockGradesApi.getClassSectionGradeSheet.mockResolvedValue(sheetData);
    mockGradesApi.updateClassSectionGradeWeights.mockResolvedValue(sheetData);
    mockGradesApi.upsertClassSectionGradeSheet.mockResolvedValue(sheetData);
  });

  afterEach(() => {
    for (const queryClient of activeQueryClients.splice(0)) {
      queryClient.clear();
    }
    jest.restoreAllMocks();
  });

  it('renders multiple students and keeps keyboard lift space hidden by default', async () => {
    const { findByText, queryByTestId } = renderWithClient(<LecturerGradeSheetScreen />);

    await waitFor(() =>
      expect(mockGradesApi.getClassSectionGradeSheet).toHaveBeenCalledWith('section-1'),
    );

    expect(await findByText('22520001')).toBeTruthy();
    expect(await findByText('Nguyen Van An')).toBeTruthy();
    expect(await findByText('Le Thi Binh')).toBeTruthy();
    expect(await findByText('Tran Minh Cuong')).toBeTruthy();
    expect(queryByTestId('keyboard-lift-space')).toBeNull();
  });

  it('adds extra bottom space only while editing a student grade input', async () => {
    const { findByPlaceholderText, findByTestId, queryByTestId } = renderWithClient(
      <LecturerGradeSheetScreen />,
    );

    await waitFor(() =>
      expect(mockGradesApi.getClassSectionGradeSheet).toHaveBeenCalledWith('section-1'),
    );

    const searchInput = await findByPlaceholderText('Tìm MSSV hoặc họ tên...');
    fireEvent(searchInput, 'focus', { target: 11 });

    act(() => {
      emitKeyboardEvent(keyboardShowEvent, {
        endCoordinates: { height: 280 },
      });
    });

    expect(queryByTestId('keyboard-lift-space')).toBeNull();

    const gradeInput = await findByTestId('grade-input-student-3-finalScore');
    fireEvent(gradeInput, 'focus', { target: 101 });

    act(() => {
      emitKeyboardEvent(keyboardShowEvent, {
        endCoordinates: { height: 280 },
      });
    });

    expect((await findByTestId('keyboard-lift-space')).props.style.height).toBe(420);

    fireEvent(gradeInput, 'blur');

    act(() => {
      emitKeyboardEvent(keyboardHideEvent);
    });

    expect(queryByTestId('keyboard-lift-space')).toBeNull();
  });
});
