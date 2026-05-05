import { getTabBarLabel, getTabBarMetrics } from '../_layout';

describe('tab layout metrics', () => {
  it('keeps the tab bar above the gesture inset', () => {
    expect(getTabBarMetrics({ isCompact: true, bottomInset: 24 })).toEqual({
      height: 90,
      paddingBottom: 32,
    });
  });

  it('ignores invalid negative insets', () => {
    expect(getTabBarMetrics({ isCompact: false, bottomInset: -8 })).toEqual({
      height: 72,
      paddingBottom: 10,
    });
  });

  it('uses mobile-safe labels for the main tabs', () => {
    expect(getTabBarLabel('home', 'student')).toBe('Trang chủ');
    expect(getTabBarLabel('schedule', 'student')).toBe('Lịch');
    expect(getTabBarLabel('services', 'student')).toBe('Dịch vụ');
    expect(getTabBarLabel('alerts', 'student')).toBe('Cảnh báo');
    expect(getTabBarLabel('profile', 'student')).toBe('Cá nhân');
  });

  it('keeps the schedule tab role-aware for admin users', () => {
    expect(getTabBarLabel('schedule', 'admin')).toBe('Vận hành');
  });
});
