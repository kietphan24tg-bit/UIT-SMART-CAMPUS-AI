import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { Platform, useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark';
export type ThemePreference = ThemeMode | 'system';

export type ThemeColorTokens = {
  primary: string;
  onPrimary: string;
  primaryMuted: string;
  primarySurface: string;
  accentCampus: string;
  accentCampusSurface: string;
  accentAcademic: string;
  accentAcademicSurface: string;
  accentTelemetry: string;
  accentTelemetrySurface: string;
  accentAlert: string;
  accentAlertSurface: string;
  background: string;
  backgroundMuted: string;
  surface: string;
  surfaceElevated: string;
  surfaceSubtle: string;
  surfaceTinted: string;
  surfaceGlass: string;
  surfaceGlassStrong: string;
  text: string;
  textMuted: string;
  textSoft: string;
  textInverse: string;
  textInverseMuted: string;
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

export type ThemePalette = Omit<ThemeColorTokens, 'text'> & {
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
    surfaceTinted: string;
    surfaceGlass: string;
    surfaceGlassStrong: string;
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

export interface AppTheme {
  mode: ThemeMode;
  isDark: boolean;
  fonts: {
    regular: string;
    medium: string;
    semibold: string;
    bold: string;
  };
  palette: ThemePalette;
  colors: ThemeColorTokens;
  motion: {
    fast: number;
    base: number;
    slow: number;
    shimmer: number;
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
  regular: Platform.select({
    ios: 'Inter_400Regular',
    android: 'Inter_400Regular',
    default: 'Inter_400Regular',
  }) as string,
  medium: Platform.select({
    ios: 'Inter_500Medium',
    android: 'Inter_500Medium',
    default: 'Inter_500Medium',
  }) as string,
  semibold: Platform.select({
    ios: 'Inter_600SemiBold',
    android: 'Inter_600SemiBold',
    default: 'Inter_600SemiBold',
  }) as string,
  bold: Platform.select({
    ios: 'Inter_600SemiBold',
    android: 'Inter_600SemiBold',
    default: 'Inter_600SemiBold',
  }) as string,
} satisfies AppTheme['fonts'];

const baseMotion = {
  fast: 120,
  base: 180,
  slow: 240,
  shimmer: 1400,
} satisfies AppTheme['motion'];

const lightColors: ThemeColorTokens = {
  primary: '#0E76FD',
  onPrimary: '#FFFFFF',
  primaryMuted: '#5EA2FF',
  primarySurface: '#EAF3FF',
  accentCampus: '#0E76FD',
  accentCampusSurface: '#EAF3FF',
  accentAcademic: '#2B8CFF',
  accentAcademicSurface: '#E8F4FF',
  accentTelemetry: '#18B7A5',
  accentTelemetrySurface: '#E3FAF6',
  accentAlert: '#FF7A6F',
  accentAlertSurface: '#FFF0EE',
  background: '#F2F7FF',
  backgroundMuted: '#E1E9F6',
  surface: '#FFFFFF',
  surfaceElevated: '#FCFEFF',
  surfaceSubtle: '#F5F8FD',
  surfaceTinted: '#EDF4FF',
  surfaceGlass: 'rgba(255, 255, 255, 0.78)',
  surfaceGlassStrong: 'rgba(255, 255, 255, 0.94)',
  text: '#172554',
  textMuted: '#334155',
  textSoft: '#64748B',
  textInverse: '#FFFFFF',
  textInverseMuted: 'rgba(255, 255, 255, 0.84)',
  border: '#D5E2F2',
  divider: '#E4EDF7',
  hero: '#F8FBFF',
  heroMuted: '#EAF3FF',
  heroText: '#172554',
  heroSubtext: '#334155',
  success: '#34C759',
  successSurface: '#E7FAEC',
  warning: '#C5912C',
  warningSurface: '#FFF6DF',
  danger: '#FF3B30',
  dangerSurface: '#FFEAE8',
  info: '#2D8CFF',
  infoSurface: '#E8F1FF',
  emergency: '#FF3B30',
  emergencySurface: '#FFEAE8',
  input: '#FFFFFF',
  inputBorder: '#C8D7EA',
  disabled: '#94A3B8',
  shadow: 'rgba(15, 23, 42, 0.12)',
  tabBar: 'rgba(255, 255, 255, 0.94)',
  overlay: 'rgba(15, 23, 42, 0.16)',
  glass: 'rgba(255, 255, 255, 0.82)',
  glassStrong: 'rgba(255, 255, 255, 0.96)',
  glow: 'rgba(14, 118, 253, 0.12)',
};

const darkColors: ThemeColorTokens = {
  primary: '#68A9FF',
  onPrimary: '#07111B',
  primaryMuted: '#9CC9FF',
  primarySurface: 'rgba(104, 169, 255, 0.18)',
  accentCampus: '#68A9FF',
  accentCampusSurface: 'rgba(104, 169, 255, 0.18)',
  accentAcademic: '#5FC4FF',
  accentAcademicSurface: 'rgba(95, 196, 255, 0.16)',
  accentTelemetry: '#5FE0D0',
  accentTelemetrySurface: 'rgba(95, 224, 208, 0.16)',
  accentAlert: '#FF8E85',
  accentAlertSurface: 'rgba(255, 142, 133, 0.16)',
  background: '#08121E',
  backgroundMuted: '#0C1827',
  surface: '#101B2B',
  surfaceElevated: '#132234',
  surfaceSubtle: '#17273B',
  surfaceTinted: '#14263A',
  surfaceGlass: 'rgba(16, 27, 43, 0.74)',
  surfaceGlassStrong: 'rgba(16, 27, 43, 0.9)',
  text: '#F3F7FF',
  textMuted: '#D5E1F0',
  textSoft: '#98ABC2',
  textInverse: '#08121E',
  textInverseMuted: '#334155',
  border: 'rgba(148, 163, 184, 0.2)',
  divider: 'rgba(148, 163, 184, 0.12)',
  hero: '#08121E',
  heroMuted: '#0C1827',
  heroText: '#F3F7FF',
  heroSubtext: '#D5E1F0',
  success: '#47D06A',
  successSurface: 'rgba(71, 208, 106, 0.16)',
  warning: '#F0B84B',
  warningSurface: 'rgba(240, 184, 75, 0.16)',
  danger: '#FF6D63',
  dangerSurface: 'rgba(255, 109, 99, 0.16)',
  info: '#7CC5FF',
  infoSurface: 'rgba(124, 197, 255, 0.16)',
  emergency: '#FF6D63',
  emergencySurface: 'rgba(255, 109, 99, 0.16)',
  input: 'rgba(19, 34, 52, 0.96)',
  inputBorder: 'rgba(148, 163, 184, 0.2)',
  disabled: '#71839A',
  shadow: 'rgba(0, 0, 0, 0.54)',
  tabBar: 'rgba(8, 18, 30, 0.94)',
  overlay: 'rgba(2, 8, 23, 0.52)',
  glass: 'rgba(16, 27, 43, 0.76)',
  glassStrong: 'rgba(16, 27, 43, 0.9)',
  glow: 'rgba(104, 169, 255, 0.18)',
};

function createTheme(mode: ThemeMode, colors: ThemeColorTokens): AppTheme {
  const { text: _text, ...flatColors } = colors;
  const palette: ThemePalette = {
    ...flatColors,
    brand: {
      primary: colors.primary,
      onPrimary: colors.onPrimary,
      primaryMuted: colors.primaryMuted,
      primarySurface: colors.primarySurface,
    },
    neutral: {
      background: colors.background,
      backgroundMuted: colors.backgroundMuted,
      surface: colors.surface,
      surfaceElevated: colors.surfaceElevated,
      surfaceSubtle: colors.surfaceSubtle,
      surfaceTinted: colors.surfaceTinted,
      surfaceGlass: colors.surfaceGlass,
      surfaceGlassStrong: colors.surfaceGlassStrong,
      border: colors.border,
      divider: colors.divider,
      overlay: colors.overlay,
    },
    text: {
      primary: colors.text,
      muted: colors.textMuted,
      soft: colors.textSoft,
      inverse: colors.textInverse,
      inverseMuted: colors.textInverseMuted,
    },
    status: {
      success: colors.success,
      successSurface: colors.successSurface,
      warning: colors.warning,
      warningSurface: colors.warningSurface,
      danger: colors.danger,
      dangerSurface: colors.dangerSurface,
      info: colors.info,
      infoSurface: colors.infoSurface,
      emergency: colors.emergency,
      emergencySurface: colors.emergencySurface,
    },
  };

  return {
    mode,
    isDark: mode === 'dark',
    fonts: baseFonts,
    palette,
    colors,
    motion: baseMotion,
    elevation: {
      level0: {},
      level1: {
        shadowColor: mode === 'dark' ? 'rgba(0, 0, 0, 0.42)' : 'rgba(15, 23, 42, 0.14)',
        shadowOpacity: mode === 'dark' ? 0.18 : 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 2,
      },
      level2: {
        shadowColor: mode === 'dark' ? 'rgba(0, 0, 0, 0.52)' : 'rgba(15, 23, 42, 0.18)',
        shadowOpacity: mode === 'dark' ? 0.24 : 0.1,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 12 },
        elevation: 4,
      },
      level3: {
        shadowColor: mode === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(15, 23, 42, 0.22)',
        shadowOpacity: mode === 'dark' ? 0.28 : 0.12,
        shadowRadius: 28,
        shadowOffset: { width: 0, height: 16 },
        elevation: 8,
      },
    },
    spacing: baseSpacing,
    radii: baseRadii,
    typography: baseTypography,
  };
}

export const lightTheme = createTheme('light', lightColors);
export const darkTheme = createTheme('dark', darkColors);

const THEME_PREFERENCE_KEY = 'theme.preference.v1';

interface ThemePreferenceContextValue {
  themePreference: ThemePreference;
  resolvedMode: ThemeMode;
  isHydrated: boolean;
  setThemePreference: (value: ThemePreference) => Promise<void>;
  resetThemePreference: () => Promise<void>;
}

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);

function normalizeThemePreference(value: string | null | undefined): ThemePreference {
  if (value === 'light' || value === 'dark' || value === 'system') {
    return value;
  }

  return 'system';
}

function resolveThemeMode(
  preference: ThemePreference,
  systemColorScheme: ReturnType<typeof useColorScheme>,
): ThemeMode {
  if (preference !== 'system') {
    return preference;
  }

  return systemColorScheme === 'dark' ? 'dark' : 'light';
}

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function hydratePreference() {
      try {
        const storedPreference = await SecureStore.getItemAsync(THEME_PREFERENCE_KEY);

        if (mounted) {
          setThemePreferenceState(normalizeThemePreference(storedPreference));
        }
      } catch {
        // Keep the system default when secure storage is not available.
      } finally {
        if (mounted) {
          setIsHydrated(true);
        }
      }
    }

    void hydratePreference();

    return () => {
      mounted = false;
    };
  }, []);

  const persistThemePreference = useCallback(async (nextPreference: ThemePreference) => {
    setThemePreferenceState(nextPreference);

    try {
      if (nextPreference === 'system') {
        await SecureStore.deleteItemAsync(THEME_PREFERENCE_KEY);
      } else {
        await SecureStore.setItemAsync(THEME_PREFERENCE_KEY, nextPreference);
      }
    } catch {
      // Local preference should never block rendering.
    }
  }, []);

  const resetThemePreference = useCallback(async () => {
    await persistThemePreference('system');
  }, [persistThemePreference]);

  const resolvedMode = resolveThemeMode(themePreference, systemColorScheme);

  const contextValue = useMemo<ThemePreferenceContextValue>(
    () => ({
      themePreference,
      resolvedMode,
      isHydrated,
      setThemePreference: persistThemePreference,
      resetThemePreference,
    }),
    [isHydrated, persistThemePreference, resetThemePreference, resolvedMode, themePreference],
  );

  return createElement(ThemePreferenceContext.Provider, { value: contextValue }, children);
}

function useThemePreferenceContext() {
  return useContext(ThemePreferenceContext);
}

export function useThemePreference() {
  return useThemePreferenceContext()?.themePreference ?? 'system';
}

export function useResolvedThemeMode() {
  const context = useThemePreferenceContext();
  const systemColorScheme = useColorScheme();

  return context?.resolvedMode ?? resolveThemeMode('system', systemColorScheme);
}

export function useSetThemePreference() {
  return useThemePreferenceContext()?.setThemePreference ?? (async () => undefined);
}

export function useResetThemePreference() {
  return useThemePreferenceContext()?.resetThemePreference ?? (async () => undefined);
}

export function useAppTheme() {
  const mode = useResolvedThemeMode();

  return mode === 'dark' ? darkTheme : lightTheme;
}

export function useThemedStyles<T>(factory: (theme: AppTheme) => T) {
  const theme = useAppTheme();

  return useMemo(() => factory(theme), [factory, theme]);
}
