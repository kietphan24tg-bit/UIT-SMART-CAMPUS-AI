import { darkTheme, lightTheme } from '@/theme';
import { createAppNavigationTheme, createRootStackScreenOptions } from '@/theme/navigation';

describe('root navigation theme', () => {
  it.each([
    ['light', lightTheme],
    ['dark', darkTheme],
  ] as const)('uses an opaque matching scene background in %s mode', (_mode, appTheme) => {
    const navigationTheme = createAppNavigationTheme(appTheme);
    const screenOptions = createRootStackScreenOptions(appTheme);

    expect(navigationTheme.dark).toBe(appTheme.isDark);
    expect(navigationTheme.colors.background).toBe(appTheme.colors.background);
    expect(navigationTheme.colors.card).toBe(appTheme.colors.surface);
    expect(screenOptions.contentStyle.backgroundColor).toBe(appTheme.colors.background);
    expect(screenOptions.contentStyle.backgroundColor).not.toBe('transparent');
    expect(screenOptions.animation).toBe('none');
  });
});
