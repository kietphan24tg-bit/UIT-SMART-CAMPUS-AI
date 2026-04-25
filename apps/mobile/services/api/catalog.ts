import { apiClient } from './client';

export type CatalogSemester = {
  id: string;
  name: string;
  academicYear: string;
  term: number;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
};

export type CatalogCourse = {
  id: string;
  code: string;
  name: string;
  credits: number;
  faculty: string | null;
  description: string | null;
};

export type CatalogLecturer = {
  id: string;
  email: string;
  fullName: string;
};

export type CatalogClassSection = {
  id: string;
  classCode: string;
  sectionCode: string;
  note: string | null;
  capacity: number;
  registrationOpen: boolean;
  enrolledCount: number;
  course: {
    id: string;
    code: string;
    name: string;
    credits: number;
  };
  semester: {
    id: string;
    name: string;
    isCurrent: boolean;
  };
  lecturer: CatalogLecturer | null;
  meetings: Array<{
    id: string;
    dayOfWeek: number;
    room: string | null;
    startTime: string;
    endTime: string;
    startPeriod: number | null;
    endPeriod: number | null;
    sessionType: 'daytime' | 'evening';
    note: string | null;
  }>;
};

export const catalogApi = {
  listSemesters: async (): Promise<CatalogSemester[]> => {
    return (await apiClient.get('/catalog/semesters')) as CatalogSemester[];
  },

  listCourses: async (): Promise<CatalogCourse[]> => {
    return (await apiClient.get('/catalog/courses')) as CatalogCourse[];
  },

  createCourse: async (payload: {
    code: string;
    name: string;
    credits: number;
    faculty?: string;
    description?: string;
  }) => {
    return (await apiClient.post('/catalog/courses', payload)) as CatalogCourse;
  },

  listLecturers: async (): Promise<CatalogLecturer[]> => {
    return (await apiClient.get('/catalog/lecturers')) as CatalogLecturer[];
  },

  listClassSections: async (semesterId?: string): Promise<CatalogClassSection[]> => {
    return (await apiClient.get('/catalog/class-sections', {
      params: {
        ...(semesterId ? { semesterId } : {}),
      },
    })) as CatalogClassSection[];
  },

  createClassSection: async (payload: {
    semesterId: string;
    courseCode: string;
    classCode: string;
    sectionCode: string;
    note?: string;
    lecturerId?: string;
    capacity?: number;
    registrationOpen?: boolean;
  }) => {
    return (await apiClient.post('/catalog/class-sections', payload)) as CatalogClassSection;
  },

  updateClassSection: async (
    classSectionId: string,
    payload: {
      sectionCode?: string;
      note?: string;
      lecturerId?: string | null;
      capacity?: number;
      registrationOpen?: boolean;
    },
  ) => {
    return (await apiClient.patch(
      `/catalog/class-sections/${encodeURIComponent(classSectionId)}`,
      payload,
    )) as CatalogClassSection;
  },

  replaceClassMeetings: async (
    classSectionId: string,
    payload: {
      meetings: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        startPeriod?: number;
        endPeriod?: number;
        room?: string;
        sessionType?: 'daytime' | 'evening';
        note?: string;
      }>;
    },
  ) => {
    return (await apiClient.patch(
      `/catalog/class-sections/${encodeURIComponent(classSectionId)}/meetings`,
      payload,
    )) as CatalogClassSection;
  },
};

