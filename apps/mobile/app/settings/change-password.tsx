import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  ContentStack,
  FormField,
  PrimaryButton,
  Screen,
  SecondaryButton,
  StatusBadge,
  TopHero,
} from '@/components/ui';
import { authApi } from '@/services/api/auth';
import { useAppTheme } from '@/theme';
import { getLocalizedErrorMessage } from '@/utils/error-message';

type FeedbackTone = 'success' | 'danger';

function isValidPassword(value: string) {
  return /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);
}

export default function ChangePasswordScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: FeedbackTone; label: string } | null>(null);
  const [done, setDone] = useState(false);

  const resetFeedback = () => setFeedback(null);

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      setFeedback({ tone: 'danger', label: 'Vui lòng nhập mật khẩu hiện tại.' });
      return;
    }

    if (!isValidPassword(newPassword)) {
      setFeedback({ tone: 'danger', label: 'Mật khẩu mới tối thiểu 8 ký tự, có 1 chữ hoa và 1 số.' });
      return;
    }

    if (newPassword === currentPassword) {
      setFeedback({ tone: 'danger', label: 'Mật khẩu mới phải khác mật khẩu hiện tại.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({ tone: 'danger', label: 'Mật khẩu xác nhận chưa khớp.' });
      return;
    }

    setLoading(true);
    resetFeedback();

    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setDone(true);
      setFeedback({ tone: 'success', label: 'Mật khẩu đã được đổi thành công.' });
    } catch (error) {
      const message = getLocalizedErrorMessage(error, 'Không thể đổi mật khẩu lúc này.');
      setFeedback({ tone: 'danger', label: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <TopHero
        eyebrow="Bảo mật"
        title="Đổi mật khẩu"
        subtitle="Nhập mật khẩu hiện tại và tạo mật khẩu mới."
        badge={{ label: 'Tài khoản', tone: 'info' }}
      />

      <ContentStack narrow overlapHero={false} gap={16}>
        {feedback ? <StatusBadge label={feedback.label} tone={feedback.tone} /> : null}

        {done ? (
          <View
            style={[
              styles.doneCard,
              { backgroundColor: theme.colors.successSurface, borderColor: theme.colors.success },
            ]}
          >
            <Text
              style={[styles.doneTitle, { color: theme.colors.success, fontFamily: theme.fonts.bold }]}
            >
              Đổi mật khẩu thành công
            </Text>
            <Text
              style={[
                styles.doneBody,
                { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
              ]}
            >
              Mật khẩu đã được cập nhật. Bạn có thể tiếp tục sử dụng ứng dụng bình thường.
            </Text>
          </View>
        ) : (
          <View style={styles.form}>
            <FormField
              label="Mật khẩu hiện tại"
              placeholder="Nhập mật khẩu hiện tại"
              value={currentPassword}
              onChangeText={(value) => {
                setCurrentPassword(value);
                resetFeedback();
              }}
              secureTextEntry
              secureToggle
              leftIcon="lock"
            />
            <FormField
              label="Mật khẩu mới"
              placeholder="Ít nhất 8 ký tự"
              value={newPassword}
              onChangeText={(value) => {
                setNewPassword(value);
                resetFeedback();
              }}
              secureTextEntry
              secureToggle
              leftIcon="key"
            />
            <FormField
              label="Xác nhận mật khẩu mới"
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                resetFeedback();
              }}
              secureTextEntry
              secureToggle
              leftIcon="shield"
            />
          </View>
        )}

        <View style={styles.actions}>
          {done ? (
            <PrimaryButton label="Quay lại cài đặt" onPress={() => router.back()} />
          ) : (
            <>
              <PrimaryButton
                label="Đổi mật khẩu"
                loading={loading}
                onPress={() => void handleChangePassword()}
              />
              <SecondaryButton label="Hủy" onPress={() => router.back()} />
            </>
          )}
        </View>
      </ContentStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 14,
  },
  doneCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  doneTitle: {
    fontSize: 16,
  },
  doneBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
});
