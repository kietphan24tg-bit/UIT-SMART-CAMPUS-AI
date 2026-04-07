import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { getRoleScopedTabTitle } from '@/utils/app';

export default function TabLayout() {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const role = useAuthStore((state) => state.user?.role);
  const roleScopedTitle = getRoleScopedTabTitle(role);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSoft,
        tabBarStyle: {
          borderTopWidth: 0,
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
          fontWeight: '700',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Trang chu',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: roleScopedTitle,
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name={roleScopedTitle === 'Van hanh' ? 'pulse-outline' : 'calendar-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Dich vu',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Canh bao',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="parking"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Ca nhan',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
