import { Linking, StyleSheet, Text, View } from 'react-native';

import {
  ContentStack,
  InfoRow,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionCard,
  TopHero,
} from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { getRoleLabel } from '@/utils/app';

export default function DeleteAccountScreen() {
  const theme = useAppTheme();
  const role = useAuthStore((state) => state.user?.role);

  const handleDeleteRequest = () => {
    const subject = encodeURIComponent('Yêu cầu xóa tài khoản UIT Smart Campus');
    void Linking.openURL(`mailto:support@uit.edu.vn?subject=${subject}`);
  };

  return (
    <Screen>
      <TopHero
        eyebrow="Tài khoản"
        title="Xóa tài khoản"
        subtitle="Gửi yêu cầu xóa qua kênh hỗ trợ chính thức."
        badge={{ label: getRoleLabel(role), tone: 'warning' }}
      />

      <ContentStack narrow overlapHero={false}>
        <SectionCard title="Trước khi gửi yêu cầu" subtitle="Những dữ liệu có thể bị ảnh hưởng.">
          <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
            Yêu cầu xóa tài khoản có thể ảnh hưởng hồ sơ đăng nhập, thông tin xe đã đăng ký và cấu hình gắn với tài khoản.
          </Text>
        </SectionCard>

        <SectionCard title="Cách xử lý" subtitle="Quy trình xử lý hiện tại.">
          <View style={styles.column}>
            <InfoRow label="Tiếp nhận" value="Qua email hỗ trợ chính thức" />
            <InfoRow label="Xác minh" value="Kiểm tra thông tin tài khoản trước khi xử lý" />
            <InfoRow label="Theo dõi" value="Nhận phản hồi qua email" />
          </View>
        </SectionCard>

        <PrimaryButton label="Gửi yêu cầu qua email" onPress={handleDeleteRequest} />
        <SecondaryButton
          label="Liên hệ hỗ trợ chung"
          onPress={() => void Linking.openURL('mailto:support@uit.edu.vn')}
        />
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
