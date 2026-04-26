import {
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

    const studentCanteen = studentEntries.find((item) => item.id === 'canteen');
    const adminCanteen = canteenAdminEntries.find((item) => item.id === 'canteen');
    const library = studentEntries.find((item) => item.id === 'library');
    const chatbot = studentEntries.find((item) => item.id === 'chatbot');
    const sos = studentEntries.find((item) => item.id === 'gps-sos');

    expect(studentCanteen?.supportState).toBe('live');
    expect(studentCanteen?.route).toBe('/services/canteen');
    expect(adminCanteen?.route).toBe('/services/canteen/admin');
    expect(library?.supportState).toBe('live');
    expect(chatbot?.supportState).toBe('live');
    expect(sos?.route).toBe('/services/gps-sos');
  });
});
