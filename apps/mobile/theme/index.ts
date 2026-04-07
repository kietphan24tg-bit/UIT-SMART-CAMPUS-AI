import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export interface AppTheme {
  mode: ThemeMode;
  isDark: boolean;
  colors: {
    primary: string;
    primaryMuted: string;
    primarySurface: string;
    background: string;
    backgroundMuted: string;
    surface: string;
    surfaceElevated: string;
    surfaceSubtle: string;
    text: string;
    textMuted: string;
    textSoft: string;
    border: string;
    divider: string;
    hero: string;
    heroMuted: string;
    heroText: string;
    heroSubtext: string;
    success: string;
    successSurface: string;
    warning: string;
    warningSurface: string;
    danger: string;
    dangerSurface: string;
    info: string;
    infoSurface: string;
    emergency: string;
    emergencySurface: string;
    input: string;
    inputBorder: string;
    disabled: string;
    shadow: string;
    tabBar: string;
    overlay: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  radii: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    pill: number;
  };
  typography: {
    caption: number;
    body: number;
    bodyLg: number;
    title: number;
    headline: number;
    hero: number;
  };
}

export const lightTheme: AppTheme = {
  mode: 'light',
  isDark: false,
  colors: {
    primary: '#1E40AF',
    primaryMuted: '#4666CC',
    primarySurface: '#E9F0FF',
    background: '#F5F7FB',
    backgroundMuted: '#EDEFF5',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceSubtle: '#F7F9FC',
    text: '#10203B',
    textMuted: '#475569',
    textSoft: '#7C8AA5',
    border: '#D8E1EF',
    divider: '#E5EBF4',
    hero: '#163D9A',
    heroMuted: '#2452BE',
    heroText: '#FFFFFF',
    heroSubtext: '#C7D7FF',
    success: '#177B52',
    successSurface: '#E9F8F0',
    warning: '#A56600',
    warningSurface: '#FFF4D9',
    danger: '#BF2F36',
    dangerSurface: '#FDEBED',
    info: '#0C6EA8',
    infoSurface: '#E7F5FD',
    emergency: '#B42318',
    emergencySurface: '#FCEAE8',
    input: '#F7F9FC',
    inputBorder: '#CCD6E7',
    disabled: '#A8B6CC',
    shadow: '#0F172A',
    tabBar: '#FFFFFF',
    overlay: 'rgba(15, 23, 42, 0.08)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radii: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    pill: 999,
  },
  typography: {
    caption: 12,
    body: 14,
    bodyLg: 16,
    title: 20,
    headline: 26,
    hero: 30,
  },
};

export const darkTheme: AppTheme = {
  mode: 'dark',
  isDark: true,
  colors: {
    primary: '#7DA2FF',
    primaryMuted: '#9DBBFF',
    primarySurface: '#152655',
    background: '#0E172A',
    backgroundMuted: '#13213A',
    surface: '#111D32',
    surfaceElevated: '#16233B',
    surfaceSubtle: '#182742',
    text: '#F3F7FF',
    textMuted: '#CAD6EA',
    textSoft: '#91A4C4',
    border: '#243753',
    divider: '#1E304C',
    hero: '#112B6A',
    heroMuted: '#173A8B',
    heroText: '#F7FAFF',
    heroSubtext: '#C9D9FF',
    success: '#53D2A0',
    successSurface: '#12392D',
    warning: '#F7B955',
    warningSurface: '#433315',
    danger: '#FF8B8F',
    dangerSurface: '#4A1F28',
    info: '#74CAFF',
    infoSurface: '#13374A',
    emergency: '#FF766A',
    emergencySurface: '#4F1F25',
    input: '#122038',
    inputBorder: '#27405F',
    disabled: '#607796',
    shadow: '#020817',
    tabBar: '#101C31',
    overlay: 'rgba(2, 8, 23, 0.28)',
  },
  spacing: lightTheme.spacing,
  radii: lightTheme.radii,
  typography: lightTheme.typography,
};

export function useAppTheme() {
  const colorScheme = useColorScheme();

  return colorScheme === 'dark' ? darkTheme : lightTheme;
}

export function useThemedStyles<T>(factory: (theme: AppTheme) => T) {
  const theme = useAppTheme();

  return useMemo(() => factory(theme), [factory, theme]);
}
