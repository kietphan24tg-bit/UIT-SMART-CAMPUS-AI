import { apiClient } from './client';

export type RegistrationClassSection = {
  id: string;
  classCode: string;
  sectionCode: string;
  note: string | null;
  registrationOpen: boolean;
  capacity: number;
  enrolledCount: number;
  seatsRemaining: number;
  isRegistered?: boolean;
  hasConflict?: boolean;
  canRegister?: boolean;
  course: {
    code: string;
    name: string;
    credits: number;
  };
  semester: {
    id: string;
    name: string;
    isCurrent: boolean;
  };
  lecturer: {
    id: string;
    email: string;
    fullName: string;
  } | null;
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

export type StudentRegistrationRecord = {
  id: string;
  status: 'active' | 'dropped';
  registeredAt: string;
  droppedAt: string | null;
  classSection: RegistrationClassSection;
};

export const registrationsApi = {
  listAvailableClassSections: async (): Promise<RegistrationClassSection[]> => {
    return (await apiClient.get('/registrations/available-class-sections')) as RegistrationClassSection[];
  },

  listMyRegistrations: async (
    status?: 'active' | 'dropped',
  ): Promise<StudentRegistrationRecord[]> => {
    return (await apiClient.get('/registrations/me', {
      params: {
        ...(status ? { status } : {}),
      },
    })) as StudentRegistrationRecord[];
  },

  registerClassSection: async (classSectionId: string): Promise<StudentRegistrationRecord> => {
    return (await apiClient.post('/registrations', { classSectionId })) as StudentRegistrationRecord;
  },

  dropRegistration: async (registrationId: string): Promise<StudentRegistrationRecord> => {
    return (await apiClient.patch(
      `/registrations/${encodeURIComponent(registrationId)}/drop`,
    )) as StudentRegistrationRecord;
  },
};

