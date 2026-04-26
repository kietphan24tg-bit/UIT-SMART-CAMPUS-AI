import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { getRoleScopedTabTitle, isAdminRole } from '@/utils/app';

const COMPACT_TAB_BAR_HEIGHT = 66;
const REGULAR_TAB_BAR_HEIGHT = 72;
const COMPACT_TAB_BAR_PADDING_BOTTOM = 8;
const REGULAR_TAB_BAR_PADDING_BOTTOM = 10;

export function getTabBarMetrics({
  isCompact,
  bottomInset,
}: {
  isCompact: boolean;
  bottomInset: number;
}) {
  const safeInset = Math.max(bottomInset, 0);
  const baseHeight = isCompact ? COMPACT_TAB_BAR_HEIGHT : REGULAR_TAB_BAR_HEIGHT;
  const basePaddingBottom = isCompact
    ? COMPACT_TAB_BAR_PADDING_BOTTOM
    : REGULAR_TAB_BAR_PADDING_BOTTOM;

  return {
    height: baseHeight + safeInset,
    paddingBottom: basePaddingBottom + safeInset,
  };
}

export default function TabLayout() {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const role = useAuthStore((state) => state.user?.role);
  const roleScopedTitle = getRoleScopedTabTitle(role);
  const isCompactTabBar = layout.isCompact;
  const tabBarMetrics = useMemo(
    () =>
      getTabBarMetrics({
        isCompact: isCompactTabBar,
        bottomInset: insets.bottom,
      }),
    [isCompactTabBar, insets.bottom],
  );

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      sceneContainerStyle: {
        backgroundColor: theme.colors.background,
      },
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.textSoft,
      tabBarStyle: {
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.tabBar,
        height: tabBarMetrics.height,
        paddingBottom: tabBarMetrics.paddingBottom,
        paddingTop: 8,
        ...theme.elevation.level2,
      },
      tabBarLabelStyle: {
        fontSize: isCompactTabBar ? 11 : 12,
        fontFamily: theme.fonts.semibold,
        marginTop: 2,
      },
      tabBarItemStyle: {
        paddingTop: 2,
        paddingBottom: 2,
      },
    }),
    [isCompactTabBar, tabBarMetrics, theme],
  );

  const homeOptions = useMemo(
    () => ({
      title: 'Trang chủ',
      tabBarIcon: ({ color, size }: { color: string; size: number }) => (
        <Ionicons name="home-outline" size={size} color={color} />
      ),
    }),
    [],
  );

  const scheduleOptions = useMemo(
    () => ({
      title: roleScopedTitle,
      tabBarIcon: ({ color, size }: { color: string; size: number }) => (
        <Ionicons
          name={isAdminRole(role) ? 'speedometer-outline' : 'calendar-clear-outline'}
          size={size}
          color={color}
        />
      ),
    }),
    [role, roleScopedTitle],
  );

  const servicesOptions = useMemo(
    () => ({
      title: 'Dịch vụ',
      tabBarIcon: ({ color, size }: { color: string; size: number }) => (
        <Ionicons name="grid-outline" size={size} color={color} />
      ),
    }),
    [],
  );

  const alertsOptions = useMemo(
    () => ({
      title: 'Cảnh báo',
      tabBarIcon: ({ color, size }: { color: string; size: number }) => (
        <Ionicons name="notifications-outline" size={size} color={color} />
      ),
    }),
    [],
  );

  const profileOptions = useMemo(
    () => ({
      title: 'Cá nhân',
      tabBarIcon: ({ color, size }: { color: string; size: number }) => (
        <Ionicons name="person-circle-outline" size={size} color={color} />
      ),
    }),
    [],
  );

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="home/index" options={homeOptions} />
      <Tabs.Screen name="schedule/index" options={scheduleOptions} />
      <Tabs.Screen name="services/index" options={servicesOptions} />
      <Tabs.Screen name="alerts/index" options={alertsOptions} />
      <Tabs.Screen name="profile/index" options={profileOptions} />
    </Tabs>
  );
}
