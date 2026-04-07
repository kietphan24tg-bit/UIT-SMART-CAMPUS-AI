import { StyleSheet, Text } from 'react-native';

import { ContentStack, Screen, SectionCard, TopHero } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { getRoleLabel } from '@/utils/app';

export default function LegalScreen() {
  const theme = useAppTheme();
  const role = useAuthStore((state) => state.user?.role);

  return (
    <Screen>
      <TopHero
        eyebrow="Legal & permissions"
        title="Quyền riêng tư và điều khoản"
        subtitle="Giữ gọn trong một màn để người dùng đọc nhanh các mục quan trọng trước khi đi vào hành động nhạy cảm."
        badge={{ label: getRoleLabel(role), tone: 'info' }}
      />

      <ContentStack narrow>
        <SectionCard title="Privacy policy" subtitle="Tóm tắt cách app dùng dữ liệu cá nhân.">
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>
            UIT Smart Campus chỉ dùng dữ liệu tài khoản, lịch học, thông báo và parking để cung cấp dịch vụ học tập và vận hành trong phạm vi trường.
          </Text>
        </SectionCard>

        <SectionCard title="Terms of service" subtitle="Phạm vi trách nhiệm và cách sử dụng dịch vụ.">
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>
            Người dùng chịu trách nhiệm về thông tin đăng nhập, biển số xe đã đăng ký và việc tuân thủ các quy định nội bộ của trường khi dùng dịch vụ parking.
          </Text>
        </SectionCard>

        <SectionCard title="Permissions & data usage" subtitle="Giải thích ngắn về permission và lưu trữ dữ liệu.">
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>
            Các quyền như thông báo, camera hoặc vị trí chỉ nên được xin theo đúng ngữ cảnh sử dụng thực tế. Pass đầu này ưu tiên hiển thị disclosure rõ ràng trước khi triển khai runtime permission sâu hơn.
          </Text>
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
});
