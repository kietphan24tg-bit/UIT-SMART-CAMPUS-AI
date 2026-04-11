import { getTabBarMetrics } from '../_layout';

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
});
