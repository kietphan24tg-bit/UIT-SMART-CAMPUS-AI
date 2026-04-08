import { Linking, StyleSheet, Text, View } from 'react-native';

import {
  ContentStack,
  Screen,
  SectionCard,
  SecondaryButton,
  TopHero,
} from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { getRoleLabel } from '@/utils/app';

export default function LegalScreen() {
  const theme = useAppTheme();
  const role = useAuthStore((state) => state.user?.role);

  return (
    <Screen>
      <TopHero
        eyebrow="Pháp lý"
        title="Quyền riêng tư và điều khoản"
        subtitle="Thông tin pháp lý ngắn gọn, rõ ràng và đúng phạm vi dữ liệu."
        badge={{ label: getRoleLabel(role), tone: 'info' }}
        showBrand
      />

      <ContentStack narrow overlapHero={false}>
        <SectionCard title="Chính sách dữ liệu" subtitle="Những dữ liệu đang được dùng trong ứng dụng.">
          <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
            UIT Smart Campus sử dụng dữ liệu tài khoản, lịch học, thông báo và parking cho các chức năng hiện có.
          </Text>
        </SectionCard>

        <SectionCard title="Điều khoản sử dụng" subtitle="Những điểm người dùng cần biết khi dùng ứng dụng.">
          <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
            Người dùng chịu trách nhiệm bảo mật tài khoản, kiểm tra biển số/RFID trước khi đăng ký xe và tuân thủ quy định của nhà trường.
          </Text>
        </SectionCard>

        <SectionCard title="Quyền truy cập cần thiết" subtitle="Chỉ xin quyền khi có đúng ngữ cảnh sử dụng.">
          <View style={styles.column}>
            <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
              Thông báo được dùng cho nhắc việc và cảnh báo. Các quyền khác chỉ xin khi đúng ngữ cảnh sử dụng.
            </Text>
            <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
              Các tính năng chưa khả dụng sẽ được đánh dấu rõ trong ứng dụng.
            </Text>
          </View>
        </SectionCard>

        <SectionCard title="Liên hệ" subtitle="Kênh hỗ trợ chính thức cho câu hỏi về dữ liệu và quyền riêng tư.">
          <SecondaryButton
            label="Liên hệ hỗ trợ"
            onPress={() =>
              void Linking.openURL(
                'mailto:support@uit.edu.vn?subject=Ho%20tro%20quyen%20rieng%20tu%20UIT%20Smart%20Campus',
              )
            }
          />
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
    gap: 10,
  },
});
