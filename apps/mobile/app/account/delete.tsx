import { Linking, StyleSheet, Text, View } from 'react-native';

import { ContentStack, PrimaryButton, Screen, SectionCard, SecondaryButton, TopHero } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { getRoleLabel } from '@/utils/app';

export default function DeleteAccountScreen() {
  const theme = useAppTheme();
  const role = useAuthStore((state) => state.user?.role);

  return (
    <Screen>
      <TopHero
        eyebrow="Account deletion"
        title="Xóa tài khoản"
        subtitle="Điểm vào riêng cho thao tác nhạy cảm, trình bày rõ dữ liệu bị ảnh hưởng và kênh xử lý phù hợp."
        badge={{ label: getRoleLabel(role), tone: 'warning' }}
      />

      <ContentStack narrow>
        <SectionCard title="Bạn sẽ mất gì?" subtitle="Thông tin cần hiểu trước khi gửi yêu cầu xóa tài khoản.">
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>
            Việc xóa tài khoản sẽ ảnh hưởng đến hồ sơ đăng nhập, thiết bị đã lưu phiên và các bản ghi liên quan đến trải nghiệm trong app. Một số dữ liệu vận hành hoặc giao dịch parking có thể cần lưu theo chính sách nội bộ.
          </Text>
        </SectionCard>

        <SectionCard title="Cách gửi yêu cầu" subtitle="Pass đầu dùng entry point rõ ràng thay vì xóa trực tiếp trong app.">
          <View style={styles.column}>
            <SecondaryButton
              label="Gửi email yêu cầu xóa tài khoản"
              onPress={() => void Linking.openURL('mailto:support@uit.edu.vn?subject=Yêu cầu xóa tài khoản UIT Smart Campus')}
            />
            <PrimaryButton
              label="Xác nhận đã hiểu"
              onPress={() => void Linking.openURL('mailto:support@uit.edu.vn')}
            />
          </View>
        </SectionCard>
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
    gap: 12,
  },
});
