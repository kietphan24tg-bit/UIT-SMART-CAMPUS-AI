import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ContentStack, FormField, PrimaryButton, Screen, StatusBadge, TopHero } from '@/components/ui';
import { useAppTheme } from '@/theme';

export default function ForgotPasswordScreen() {
  const theme = useAppTheme();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = () => {
    if (!email.trim()) {
      setStatus('error');
      return;
    }

    setStatus('success');
  };

  return (
    <Screen>
      <TopHero
        eyebrow="Khôi phục truy cập"
        title="Quên mật khẩu"
        subtitle="Ở pass đầu, màn này hỗ trợ luồng yêu cầu đặt lại mật khẩu ngắn gọn và rõ trạng thái."
        badge={{ label: '1 bước xác nhận', tone: 'info' }}
      />

      <ContentStack narrow>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.title, { color: theme.colors.text }]}>Gửi yêu cầu đặt lại mật khẩu</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Nhập email UIT để hệ thống ghi nhận yêu cầu và điều hướng bạn sang kênh hỗ trợ phù hợp.
          </Text>

          {status === 'success' ? (
            <StatusBadge label="Đã ghi nhận yêu cầu. Vui lòng kiểm tra email hoặc liên hệ hỗ trợ." tone="success" />
          ) : null}
          {status === 'error' ? (
            <StatusBadge label="Vui lòng nhập email trước khi gửi yêu cầu." tone="danger" />
          ) : null}

          <FormField
            label="Email UIT"
            placeholder="student@gm.uit.edu.vn"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <PrimaryButton label="Gửi yêu cầu" onPress={handleSubmit} />
        </View>
      </ContentStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
});
