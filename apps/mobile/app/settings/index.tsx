import { useRouter } from 'expo-router';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { ThemePreferenceControl } from '@/components/preferences/theme-preference-control';
import {
  ContentStack,
  PrimaryButton,
  Screen,
  SectionCard,
  SecondaryButton,
  TopHero,
} from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme, useSetThemePreference, useThemePreference } from '@/theme';
import { getRoleLabel, isAdminRole, isSuperAdminRole } from '@/utils/app';

export default function SettingsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const role = useAuthStore((state) => state.user?.role);
  const preference = useThemePreference();
  const setPreference = useSetThemePreference();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <Screen>
      <TopHero
        eyebrow="Cài đặt"
        title="Tài khoản"
        subtitle="Thiết bị và hỗ trợ."
        badge={{ label: getRoleLabel(role), tone: 'info' }}
        showBrand
      />

      <ContentStack narrow overlapHero={false} gap={16}>
        <SectionCard title="Giao diện" subtitle="Lưu trên thiết bị này" variant="subtle">
          <View style={styles.column}>
            <ThemePreferenceControl value={preference} onChange={(value) => void setPreference(value)} />
            <Text style={[styles.body, { color: theme.colors.textSoft, fontFamily: theme.fonts.regular }]}>
              Đồng bộ với lựa chọn tại màn cá nhân.
            </Text>
          </View>
        </SectionCard>

        <SectionCard title="Tài khoản" subtitle="Bảo mật" variant="outlined">
          <View style={styles.column}>
            <SecondaryButton label="Khôi phục mật khẩu" onPress={() => router.push('/forgot-password')} />
            <SecondaryButton label="Xóa tài khoản" onPress={() => router.push('/account/delete')} />
          </View>
        </SectionCard>

        {isAdminRole(role) ? (
          <SectionCard
            title={isSuperAdminRole(role) ? 'Hệ thống' : 'Vận hành'}
            subtitle="Theo quyền hiện tại"
            variant="outlined"
          >
            <View style={styles.column}>
              {isSuperAdminRole(role) ? (
                <SecondaryButton
                  label="Thiết lập hệ thống"
                  onPress={() => router.push('/settings/system-controls')}
                />
              ) : (
                <SecondaryButton label="Mở vận hành campus" onPress={() => router.push('/schedule')} />
              )}
            </View>
          </SectionCard>
        ) : null}

        <SectionCard title="Hỗ trợ" subtitle="Kênh chính thức" variant="outlined">
          <View style={styles.column}>
            <SecondaryButton
              label="Gửi email hỗ trợ"
              onPress={() => void Linking.openURL('mailto:support@uit.edu.vn')}
            />
            <SecondaryButton
              label="Xem website UIT"
              onPress={() => void Linking.openURL('https://uit.edu.vn')}
            />
          </View>
        </SectionCard>

        <SectionCard title="Ứng dụng" subtitle="Phiên bản hiện tại" variant="outlined">
          <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.medium }]}>
            UIT Smart Campus 0.1.0
          </Text>
        </SectionCard>

        <PrimaryButton label="Đăng xuất" onPress={() => void handleLogout()} />
      </ContentStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  column: {
    gap: 10,
  },
});
