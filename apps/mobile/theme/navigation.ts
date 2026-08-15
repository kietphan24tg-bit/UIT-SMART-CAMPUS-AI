import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  type Theme as NavigationTheme,
} from '@react-navigation/native';

import type { AppTheme } from '@/theme';

export function createAppNavigationTheme(theme: AppTheme): NavigationTheme {
  const baseTheme = theme.isDark ? NavigationDarkTheme : NavigationDefaultTheme;

  return {
    ...baseTheme,
    dark: theme.isDark,
    colors: {
      ...baseTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.danger,
    },
  };
}

export function createRootStackScreenOptions(theme: AppTheme) {
  return {
    headerShown: false as const,
    animation: 'none' as const,
    contentStyle: {
      backgroundColor: theme.colors.background,
    },
  };
}
