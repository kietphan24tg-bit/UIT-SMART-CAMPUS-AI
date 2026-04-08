import { useRouter } from 'expo-router';
import { Linking, StyleSheet, Text, View } from 'react-native';

import {
  ContentStack,
  PrimaryButton,
  Screen,
  SectionCard,
  SecondaryButton,
  TopHero,
} from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { getRoleLabel, isAdminRole, isSuperAdminRole } from '@/utils/app';

export default function SettingsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const role = useAuthStore((state) => state.user?.role);

  return (
    <Screen>
      <TopHero
        eyebrow="Cài đặt"
        title="Tài khoản và hỗ trợ"
        subtitle="Cài đặt gọn, hỗ trợ rõ và thông tin ứng dụng."
        badge={{ label: getRoleLabel(role), tone: 'info' }}
        showBrand
      />

      <ContentStack narrow overlapHero={false}>
        <SectionCard title="Tài khoản" subtitle="Quản lý truy cập và các thông tin cơ bản.">
          <View style={styles.column}>
            <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
              Mật khẩu được quản lý qua màn đăng nhập và kênh hỗ trợ.
            </Text>
            <SecondaryButton label="Mở hỗ trợ khôi phục mật khẩu" onPress={() => router.push('/forgot-password')} />
          </View>
        </SectionCard>

        {isAdminRole(role) ? (
          <SectionCard
            title={isSuperAdminRole(role) ? 'Quản trị hệ thống' : 'Lối vào vận hành'}
            subtitle="Chỉ hiển thị đúng lối vào theo vai trò hiện tại."
          >
            <View style={styles.column}>
              <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                {isSuperAdminRole(role)
                  ? 'Bạn có thể xem và cấu hình phạm vi hệ thống.'
                  : 'Mở trung tâm vận hành để theo dõi parking, telemetry và cảnh báo.'}
              </Text>
              {isSuperAdminRole(role) ? (
                <SecondaryButton
                  label="Mở thiết lập hệ thống"
                  onPress={() => router.push('/settings/system-controls')}
                />
              ) : (
                <SecondaryButton label="Mở vận hành campus" onPress={() => router.push('/schedule')} />
              )}
            </View>
          </SectionCard>
        ) : null}

        <SectionCard title="Hỗ trợ" subtitle="Kênh hỗ trợ chính thức của ứng dụng.">
          <View style={styles.column}>
            <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
              Khi gặp lỗi đăng nhập, parking hoặc tài khoản, vui lòng liên hệ qua email hỗ trợ.
            </Text>
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

        <SectionCard title="Thông tin ứng dụng" subtitle="Thông tin chính của sản phẩm.">
          <View style={styles.column}>
            <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
              UIT Smart Campus tập trung vào xác thực, lịch học, thông báo và parking.
            </Text>
            <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
              Phiên bản ứng dụng: 0.1.0
            </Text>
          </View>
        </SectionCard>

        <PrimaryButton label="Đăng xuất" onPress={() => void logout()} />
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
