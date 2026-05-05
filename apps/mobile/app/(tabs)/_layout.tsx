import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { getRoleScopedTabTitle, isAdminRole } from '@/utils/app';

const CORE_TAB_ROOTS = new Set(['home', 'schedule', 'services', 'alerts', 'profile']);
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

function getRootRouteName(routeName: string) {
  return routeName.split('/')[0] ?? routeName;
}

export function getTabBarLabel(rootName: string, role?: string | null) {
  if (rootName === 'home') {
    return 'Trang chủ';
  }

  if (rootName === 'schedule') {
    return getRoleScopedTabTitle(role);
  }

  if (rootName === 'services') {
    return 'Dịch vụ';
  }

  if (rootName === 'alerts') {
    return 'Cảnh báo';
  }

  if (rootName === 'profile') {
    return 'Cá nhân';
  }

  return rootName;
}

export default function TabLayout() {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const role = useAuthStore((state) => state.user?.role);
  const roleScopedTitle = getRoleScopedTabTitle(role);
  const isCompactTabBar = layout.isCompact;
  const tabBarMetrics = getTabBarMetrics({
    isCompact: isCompactTabBar,
    bottomInset: insets.bottom,
  });

  return (
    <Tabs
      screenOptions={({ route }) => {
        const rootName = getRootRouteName(route.name);
        const isVisibleTab = CORE_TAB_ROOTS.has(rootName);

        return {
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
          tabBarLabel: ({ color }) => (
            <Text
              style={[
                styles.tabLabel,
                {
                  color,
                  fontFamily: theme.fonts.semibold,
                  fontSize: isCompactTabBar ? 11 : 12,
                },
              ]}
              numberOfLines={1}
              allowFontScaling={false}
            >
              {getTabBarLabel(rootName, role)}
            </Text>
          ),
          tabBarItemStyle: {
            paddingTop: 2,
            paddingBottom: 2,
          },
          tabBarButton: isVisibleTab ? undefined : () => null,
          title:
            rootName === 'home'
              ? 'Trang chủ'
              : rootName === 'schedule'
                ? roleScopedTitle
                : rootName === 'services'
                  ? 'Dịch vụ'
                  : rootName === 'alerts'
                    ? 'Cảnh báo'
                    : rootName === 'profile'
                      ? 'Cá nhân'
                      : route.name,
          tabBarIcon: ({ color, size }) => {
            if (rootName === 'home') {
              return <Ionicons name="home-outline" size={size} color={color} />;
            }

            if (rootName === 'schedule') {
              return (
                <Ionicons
                  name={isAdminRole(role) ? 'speedometer-outline' : 'calendar-clear-outline'}
                  size={size}
                  color={color}
                />
              );
            }

            if (rootName === 'services') {
              return <Ionicons name="grid-outline" size={size} color={color} />;
            }

            if (rootName === 'alerts') {
              return <Ionicons name="notifications-outline" size={size} color={color} />;
            }

            return <Ionicons name="person-circle-outline" size={size} color={color} />;
          },
          headerShown: false,
        };
      }}
    >
      <Tabs.Screen name="home/index" />
      <Tabs.Screen name="schedule/index" />
      <Tabs.Screen name="services/index" />
      <Tabs.Screen name="alerts/index" />
      <Tabs.Screen name="profile/index" />
      <Tabs.Screen
        name="parking/index"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    marginTop: 2,
    textAlign: 'center',
    width: '100%',
    lineHeight: 16,
    includeFontPadding: false,
  },
});
