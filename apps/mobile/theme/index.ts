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
  primaryMuted: '#60A5FA',
  primarySurface: '#EFF6FF',
  accentCampus: '#0E76FD',
  accentCampusSurface: '#EFF6FF',
  accentAcademic: '#8B5CF6',
  accentAcademicSurface: '#F5F3FF',
  accentTelemetry: '#14B8A6',
  accentTelemetrySurface: '#F0FDFA',
  accentAlert: '#F43F5E',
  accentAlertSurface: '#FFF1F2',
  background: '#F8FAFC',
  backgroundMuted: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceSubtle: '#F8FAFC',
  surfaceTinted: '#F0F9FF',
  surfaceGlass: 'rgba(255, 255, 255, 0.8)',
  surfaceGlassStrong: 'rgba(255, 255, 255, 0.95)',
  text: '#0F172A',
  textMuted: '#475569',
  textSoft: '#64748B',
  textInverse: '#FFFFFF',
  textInverseMuted: 'rgba(255, 255, 255, 0.85)',
  border: '#E2E8F0',
  divider: '#F1F5F9',
  hero: '#F8FAFC',
  heroMuted: '#EFF6FF',
  heroText: '#0F172A',
  heroSubtext: '#475569',
  success: '#10B981',
  successSurface: '#ECFDF5',
  warning: '#F59E0B',
  warningSurface: '#FFFBEB',
  danger: '#EF4444',
  dangerSurface: '#FEF2F2',
  info: '#3B82F6',
  infoSurface: '#EFF6FF',
  emergency: '#EF4444',
  emergencySurface: '#FEF2F2',
  input: '#FFFFFF',
  inputBorder: '#E2E8F0',
  disabled: '#94A3B8',
  shadow: 'rgba(15, 23, 42, 0.08)',
  tabBar: 'rgba(255, 255, 255, 0.95)',
  overlay: 'rgba(15, 23, 42, 0.4)',
  glass: 'rgba(255, 255, 255, 0.8)',
  glassStrong: 'rgba(255, 255, 255, 0.95)',
  glow: 'rgba(14, 118, 253, 0.1)',
};

const darkColors: ThemeColorTokens = {
  primary: '#3B82F6',
  onPrimary: '#FFFFFF',
  primaryMuted: '#60A5FA',
  primarySurface: 'rgba(59, 130, 246, 0.15)',
  accentCampus: '#3B82F6',
  accentCampusSurface: 'rgba(59, 130, 246, 0.15)',
  accentAcademic: '#8B5CF6',
  accentAcademicSurface: 'rgba(139, 92, 246, 0.15)',
  accentTelemetry: '#14B8A6',
  accentTelemetrySurface: 'rgba(20, 184, 166, 0.15)',
  accentAlert: '#F43F5E',
  accentAlertSurface: 'rgba(244, 63, 94, 0.15)',
  background: '#0F172A',
  backgroundMuted: '#020617',
  surface: '#1E293B',
  surfaceElevated: '#1E293B',
  surfaceSubtle: '#0F172A',
  surfaceTinted: 'rgba(59, 130, 246, 0.08)',
  surfaceGlass: 'rgba(30, 41, 59, 0.7)',
  surfaceGlassStrong: 'rgba(30, 41, 59, 0.9)',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textSoft: '#64748B',
  textInverse: '#0F172A',
  textInverseMuted: '#334155',
  border: '#334155',
  divider: '#1E293B',
  hero: '#0F172A',
  heroMuted: '#1E293B',
  heroText: '#F8FAFC',
  heroSubtext: '#94A3B8',
  success: '#10B981',
  successSurface: 'rgba(16, 185, 129, 0.15)',
  warning: '#F59E0B',
  warningSurface: 'rgba(245, 158, 11, 0.15)',
  danger: '#EF4444',
  dangerSurface: 'rgba(239, 68, 68, 0.15)',
  info: '#3B82F6',
  infoSurface: 'rgba(59, 130, 246, 0.15)',
  emergency: '#EF4444',
  emergencySurface: 'rgba(239, 68, 68, 0.15)',
  input: '#1E293B',
  inputBorder: '#334155',
  disabled: '#475569',
  shadow: 'rgba(0, 0, 0, 0.5)',
  tabBar: 'rgba(15, 23, 42, 0.95)',
  overlay: 'rgba(2, 6, 23, 0.7)',
  glass: 'rgba(30, 41, 59, 0.7)',
  glassStrong: 'rgba(30, 41, 59, 0.9)',
  glow: 'rgba(59, 130, 246, 0.15)',
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
        shadowColor: mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(15, 23, 42, 0.05)',
        shadowOpacity: mode === 'dark' ? 0.1 : 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      },
      level2: {
        shadowColor: mode === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(15, 23, 42, 0.08)',
        shadowOpacity: mode === 'dark' ? 0.15 : 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      },
      level3: {
        shadowColor: mode === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(15, 23, 42, 0.12)',
        shadowOpacity: mode === 'dark' ? 0.2 : 0.12,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 8 },
        elevation: 4,
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
