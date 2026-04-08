import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export interface AppTheme {
  mode: ThemeMode;
  isDark: boolean;
  fonts: {
    regular: string;
    medium: string;
    semibold: string;
    bold: string;
  };
  palette: {
    brand: {
      primary: string;
      onPrimary: string;
      primaryMuted: string;
      primarySurface: string;
    };
    neutral: {
      background: string;
      backgroundMuted: string;
      surface: string;
      surfaceElevated: string;
      surfaceSubtle: string;
      border: string;
      divider: string;
      overlay: string;
    };
    text: {
      primary: string;
      muted: string;
      soft: string;
      inverse: string;
      inverseMuted: string;
    };
    status: {
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
    };
  };
  colors: {
    primary: string;
    onPrimary: string;
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
    glass: string;
    glassStrong: string;
    glow: string;
  };
  elevation: {
    level0: Record<string, unknown>;
    level1: Record<string, unknown>;
    level2: Record<string, unknown>;
    level3: Record<string, unknown>;
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

const baseTypography = {
  caption: 12,
  body: 14,
  bodyLg: 16,
  title: 20,
  headline: 24,
  hero: 30,
} satisfies AppTheme['typography'];

const baseSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} satisfies AppTheme['spacing'];

const baseRadii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999,
} satisfies AppTheme['radii'];

const baseFonts = {
  regular: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semibold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
} satisfies AppTheme['fonts'];

export const lightTheme: AppTheme = {
  mode: 'light',
  isDark: false,
  fonts: baseFonts,
  palette: {
    brand: {
      primary: '#2E4AD0',
      onPrimary: '#FFFFFF',
      primaryMuted: '#3B5AE8',
      primarySurface: '#E8EDFF',
    },
    neutral: {
      background: '#F7F8FA',
      backgroundMuted: '#EEF1F5',
      surface: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      surfaceSubtle: '#F2F4F7',
      border: '#E4E7EC',
      divider: '#EAECF0',
      overlay: 'rgba(15, 23, 42, 0.18)',
    },
    text: {
      primary: '#0B1220',
      muted: '#344054',
      soft: '#667085',
      inverse: '#FFFFFF',
      inverseMuted: 'rgba(255, 255, 255, 0.86)',
    },
    status: {
      success: '#027A48',
      successSurface: '#ECFDF3',
      warning: '#B54708',
      warningSurface: '#FFFAEB',
      danger: '#B42318',
      dangerSurface: '#FEF3F2',
      info: '#175CD3',
      infoSurface: '#EFF8FF',
      emergency: '#B42318',
      emergencySurface: '#FEF3F2',
    },
  },
  colors: {
    primary: '#2E4AD0',
    onPrimary: '#FFFFFF',
    primaryMuted: '#3B5AE8',
    primarySurface: '#E8EDFF',
    background: '#F7F8FA',
    backgroundMuted: '#EEF1F5',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceSubtle: '#F2F4F7',
    text: '#0B1220',
    textMuted: '#344054',
    textSoft: '#667085',
    border: '#E4E7EC',
    divider: '#EAECF0',
    hero: '#FFFFFF',
    heroMuted: '#EEF1F5',
    heroText: '#0B1220',
    heroSubtext: '#344054',
    success: '#027A48',
    successSurface: '#ECFDF3',
    warning: '#B54708',
    warningSurface: '#FFFAEB',
    danger: '#B42318',
    dangerSurface: '#FEF3F2',
    info: '#175CD3',
    infoSurface: '#EFF8FF',
    emergency: '#B42318',
    emergencySurface: '#FEF3F2',
    input: '#FFFFFF',
    inputBorder: '#D0D5DD',
    disabled: '#98A2B3',
    shadow: 'rgba(16, 24, 40, 0.22)',
    tabBar: '#FFFFFF',
    overlay: 'rgba(15, 23, 42, 0.18)',
    glass: 'rgba(255, 255, 255, 0.92)',
    glassStrong: 'rgba(255, 255, 255, 0.98)',
    glow: 'rgba(46, 74, 208, 0.10)',
  },
  elevation: {
    level0: {},
    level1: {
      shadowColor: 'rgba(16, 24, 40, 0.18)',
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 2,
    },
    level2: {
      shadowColor: 'rgba(16, 24, 40, 0.22)',
      shadowOpacity: 0.10,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 12 },
      elevation: 4,
    },
    level3: {
      shadowColor: 'rgba(16, 24, 40, 0.28)',
      shadowOpacity: 0.12,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 16 },
      elevation: 8,
    },
  },
  spacing: baseSpacing,
  radii: baseRadii,
  typography: baseTypography,
};

export const darkTheme: AppTheme = {
  mode: 'dark',
  isDark: true,
  fonts: baseFonts,
  palette: {
    brand: {
      primary: '#2E4AD0',
      onPrimary: '#FFFFFF',
      primaryMuted: '#5D72F0',
      primarySurface: 'rgba(46, 74, 208, 0.22)',
    },
    neutral: {
      background: '#0B1220',
      backgroundMuted: '#0F172A',
      surface: '#0F172A',
      surfaceElevated: '#111B33',
      surfaceSubtle: '#111C34',
      border: 'rgba(255, 255, 255, 0.12)',
      divider: 'rgba(255, 255, 255, 0.08)',
      overlay: 'rgba(2, 8, 23, 0.48)',
    },
    text: {
      primary: '#F2F4F7',
      muted: '#D0D5DD',
      soft: '#98A2B3',
      inverse: '#0B1220',
      inverseMuted: '#344054',
    },
    status: {
      success: '#47CD89',
      successSurface: 'rgba(71, 205, 137, 0.14)',
      warning: '#FDB022',
      warningSurface: 'rgba(253, 176, 34, 0.14)',
      danger: '#FDA29B',
      dangerSurface: 'rgba(253, 162, 155, 0.14)',
      info: '#84CAFF',
      infoSurface: 'rgba(132, 202, 255, 0.12)',
      emergency: '#FDA29B',
      emergencySurface: 'rgba(253, 162, 155, 0.14)',
    },
  },
  colors: {
    primary: '#2E4AD0',
    onPrimary: '#FFFFFF',
    primaryMuted: '#5D72F0',
    primarySurface: 'rgba(46, 74, 208, 0.22)',
    background: '#0B1220',
    backgroundMuted: '#0F172A',
    surface: '#0F172A',
    surfaceElevated: '#111B33',
    surfaceSubtle: '#111C34',
    text: '#F2F4F7',
    textMuted: '#D0D5DD',
    textSoft: '#98A2B3',
    border: 'rgba(255, 255, 255, 0.12)',
    divider: 'rgba(255, 255, 255, 0.08)',
    hero: '#0B1220',
    heroMuted: '#0F172A',
    heroText: '#F2F4F7',
    heroSubtext: '#D0D5DD',
    success: '#47CD89',
    successSurface: 'rgba(71, 205, 137, 0.14)',
    warning: '#FDB022',
    warningSurface: 'rgba(253, 176, 34, 0.14)',
    danger: '#FDA29B',
    dangerSurface: 'rgba(253, 162, 155, 0.14)',
    info: '#84CAFF',
    infoSurface: 'rgba(132, 202, 255, 0.12)',
    emergency: '#FDA29B',
    emergencySurface: 'rgba(253, 162, 155, 0.14)',
    input: 'rgba(17, 27, 51, 0.92)',
    inputBorder: 'rgba(255, 255, 255, 0.14)',
    disabled: '#667085',
    shadow: 'rgba(0, 0, 0, 0.62)',
    tabBar: 'rgba(11, 18, 32, 0.94)',
    overlay: 'rgba(2, 8, 23, 0.48)',
    glass: 'rgba(15, 23, 42, 0.72)',
    glassStrong: 'rgba(15, 23, 42, 0.86)',
    glow: 'rgba(46, 74, 208, 0.16)',
  },
  elevation: {
    level0: {},
    level1: {
      shadowColor: 'rgba(0, 0, 0, 0.68)',
      shadowOpacity: 0.22,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 2,
    },
    level2: {
      shadowColor: 'rgba(0, 0, 0, 0.74)',
      shadowOpacity: 0.26,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 12 },
      elevation: 4,
    },
    level3: {
      shadowColor: 'rgba(0, 0, 0, 0.78)',
      shadowOpacity: 0.30,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 16 },
      elevation: 8,
    },
  },
  spacing: baseSpacing,
  radii: baseRadii,
  typography: baseTypography,
};

export function useAppTheme() {
  const colorScheme = useColorScheme();

  return colorScheme === 'dark' ? darkTheme : lightTheme;
}

export function useThemedStyles<T>(factory: (theme: AppTheme) => T) {
  const theme = useAppTheme();

  return useMemo(() => factory(theme), [factory, theme]);
}
