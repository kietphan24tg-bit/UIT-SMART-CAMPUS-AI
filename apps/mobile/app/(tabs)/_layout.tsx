import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { getRoleScopedTabTitle, isAdminRole } from '@/utils/app';

const CORE_TAB_ROOTS = new Set(['home', 'schedule', 'services', 'alerts', 'profile']);

function getRootRouteName(routeName: string) {
  return routeName.split('/')[0] ?? routeName;
}

export default function TabLayout() {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const role = useAuthStore((state) => state.user?.role);
  const roleScopedTitle = getRoleScopedTabTitle(role);

  return (
    <Tabs
      screenOptions={({ route }) => {
        const rootName = getRootRouteName(route.name);
        const isVisibleTab = CORE_TAB_ROOTS.has(rootName);

        return {
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSoft,
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            backgroundColor: theme.colors.tabBar,
            height: layout.isCompact ? 64 : 70,
            paddingBottom: 8,
            paddingTop: 8,
            shadowColor: theme.colors.shadow,
            shadowOpacity: 0.08,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: -4 },
            elevation: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: theme.fonts.semibold,
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
