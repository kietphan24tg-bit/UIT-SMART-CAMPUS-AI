import { getRoleScopedTabTitle, getTelemetryHealthState } from '../app';

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
});
