import {
  getRoleQuickActions,
  getRoleLabel,
  getRoleScopedTabTitle,
  getServiceEntries,
  getTelemetryHealthState,
  isCanteenAdminRole,
} from '../app';

describe('app utils', () => {
  it('should resolve operations label for admin roles', () => {
    expect(getRoleScopedTabTitle('admin')).toBe('Vận hành');
    expect(getRoleScopedTabTitle('super_admin')).toBe('Vận hành');
    expect(getRoleScopedTabTitle('student')).toBe('Lịch');
  });

  it('should detect stale telemetry', () => {
    const oldTimestamp = new Date(Date.now() - 31_000).toISOString();

    expect(getTelemetryHealthState(oldTimestamp, false)).toBe('stale');
    expect(getTelemetryHealthState(oldTimestamp, true)).toBe('fire-alert');
    expect(getTelemetryHealthState(null, false, true)).toBe('offline');
  });

  it('should expose canteen admin role helpers', () => {
    expect(getRoleLabel('canteen_admin')).toBe('Quản trị canteen');
    expect(isCanteenAdminRole('canteen_admin')).toBe(true);
    expect(isCanteenAdminRole('student')).toBe(false);
  });

  it('should route new live services by role', () => {
    const studentEntries = getServiceEntries('student');
    const canteenAdminEntries = getServiceEntries('canteen_admin');
    const adminEntries = getServiceEntries('admin');

    const studentCanteen = studentEntries.find((item) => item.id === 'canteen');
    const adminCanteen = canteenAdminEntries.find((item) => item.id === 'canteen');
    const operatorCanteen = adminEntries.find((item) => item.id === 'canteen');
    const operatorAttendance = adminEntries.find((item) => item.id === 'attendance');
    const library = studentEntries.find((item) => item.id === 'library');
    const adminLibrary = adminEntries.find((item) => item.id === 'library');
    const chatbot = studentEntries.find((item) => item.id === 'chatbot');
    const studentMaterials = studentEntries.find((item) => item.id === 'study-materials');
    const lecturerMaterials = getServiceEntries('lecturer').find(
      (item) => item.id === 'study-materials',
    );
    const adminMaterials = adminEntries.find((item) => item.id === 'study-materials');
    const sos = studentEntries.find((item) => item.id === 'gps-sos');

    expect(studentCanteen?.supportState).toBe('live');
    expect(studentCanteen?.route).toBe('/services/canteen');
    expect(adminCanteen?.route).toBe('/services/canteen/admin');
    expect(operatorCanteen?.route).toBe('/services/canteen/admin');
    expect(operatorAttendance?.supportState).toBe('unsupported');
    expect(operatorAttendance?.isInteractive).toBe(false);
    expect(operatorAttendance?.route).toBe('/services/attendance');
    expect(library?.supportState).toBe('live');
    expect(library?.route).toBe('/services/library');
    expect(adminLibrary?.route).toBe('/services/library/admin');
    expect(chatbot?.supportState).toBe('live');
    expect(studentMaterials?.route).toBe('/services/study-materials');
    expect(lecturerMaterials?.route).toBe('/services/study-materials');
    expect(adminMaterials).toBeUndefined();
    expect(sos?.route).toBe('/services/gps-sos');
  });

  it('should keep parking routes scoped by entry source', () => {
    const studentParkingService = getServiceEntries('student').find(
      (item) => item.id === 'parking',
    );
    const studentParkingQuickAction = getRoleQuickActions('student').find(
      (item) => item.id === 'parking',
    );
    const adminParkingQuickAction = getRoleQuickActions('admin').find(
      (item) => item.id === 'parking',
    );
    const adminQuickActions = getRoleQuickActions('admin');
    const adminCampusMapActions = adminQuickActions.filter((item) => item.id === 'campus-map');
    const adminGpsSosAction = adminQuickActions.find((item) => item.id === 'gps-sos');

    expect(studentParkingService?.route).toBe('/services/parking');
    expect(studentParkingQuickAction?.route).toBe('/parking');
    expect(adminParkingQuickAction?.route).toBe('/parking');
    expect(adminCampusMapActions).toHaveLength(1);
    expect(adminGpsSosAction?.route).toBe('/services/gps-sos');
  });

  it('should route grades by role', () => {
    const studentGrades = getServiceEntries('student').find((item) => item.id === 'grades');
    const lecturerGrades = getServiceEntries('lecturer').find((item) => item.id === 'grades');
    const adminGrades = getServiceEntries('admin').find((item) => item.id === 'grades');
    const superAdminGrades = getServiceEntries('super_admin').find((item) => item.id === 'grades');

    expect(studentGrades?.supportState).toBe('live');
    expect(studentGrades?.isInteractive).toBe(true);
    expect(studentGrades?.route).toBe('/services/grades');

    expect(lecturerGrades?.supportState).toBe('live');
    expect(lecturerGrades?.isInteractive).toBe(true);
    expect(lecturerGrades?.route).toBe('/services/grades/lecturer');

    expect(adminGrades?.supportState).toBe('unsupported');
    expect(adminGrades?.isInteractive).toBe(false);
    expect(adminGrades?.route).toBe('/services/grades');

    expect(superAdminGrades?.supportState).toBe('unsupported');
    expect(superAdminGrades?.isInteractive).toBe(false);
    expect(superAdminGrades?.route).toBe('/services/grades');
  });
});
