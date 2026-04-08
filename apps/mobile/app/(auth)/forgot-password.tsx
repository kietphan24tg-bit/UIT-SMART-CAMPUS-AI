import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  ContentStack,
  FormField,
  InfoRow,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionCard,
  StatusBadge,
  TopHero,
} from '@/components/ui';
import { authApi } from '@/services/api/auth';
import { useAppTheme } from '@/theme';

type ResetStep = 'request' | 'verify' | 'reset' | 'done';
type FeedbackTone = 'success' | 'danger' | 'warning' | 'info';

function isValidUitEmail(value: string) {
  return /@(gm\.)?uit\.edu\.vn$/i.test(value.trim());
}

function isValidPassword(value: string) {
  return /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);
}

export default function ForgotPasswordScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const [step, setStep] = useState<ResetStep>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [expiresInSeconds, setExpiresInSeconds] = useState(600);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: FeedbackTone;
    label: string;
  } | null>(null);

  const resetFeedback = () => setFeedback(null);

  const handleRequestOtp = async () => {
    if (!isValidUitEmail(email)) {
      setFeedback({ tone: 'danger', label: 'Vui lòng nhập email UIT hợp lệ.' });
      return;
    }

    setLoading(true);
    resetFeedback();

    try {
      const response = await authApi.requestPasswordReset({ email: email.trim() });
      setMaskedEmail(response.maskedEmail);
      setExpiresInSeconds(response.expiresInSeconds);
      setPreviewCode(response.previewCode ?? null);
      setStep('verify');
      setFeedback({ tone: 'success', label: 'OTP đã được tạo. Kiểm tra email hoặc dùng mã thử nghiệm.' });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Không thể gửi OTP lúc này.';
      setFeedback({ tone: 'danger', label: message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(otp.trim())) {
      setFeedback({ tone: 'danger', label: 'OTP gồm 6 chữ số.' });
      return;
    }

    setLoading(true);
    resetFeedback();

    try {
      await authApi.verifyPasswordResetOtp({
        email: email.trim(),
        otp: otp.trim(),
      });
      setStep('reset');
      setFeedback({ tone: 'success', label: 'OTP hợp lệ. Bạn có thể đặt mật khẩu mới.' });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'OTP không hợp lệ hoặc đã hết hạn.';
      setFeedback({ tone: 'danger', label: message });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!isValidPassword(newPassword)) {
      setFeedback({
        tone: 'danger',
        label: 'Mật khẩu tối thiểu 8 ký tự, có 1 chữ hoa và 1 số.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({ tone: 'danger', label: 'Mật khẩu xác nhận chưa khớp.' });
      return;
    }

    setLoading(true);
    resetFeedback();

    try {
      await authApi.resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setStep('done');
      setPreviewCode(null);
      setFeedback({ tone: 'success', label: 'Mật khẩu đã được cập nhật.' });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Không thể cập nhật mật khẩu.';
      setFeedback({ tone: 'danger', label: message });
    } finally {
      setLoading(false);
    }
  };

  const heroTitle =
    step === 'request'
      ? 'Quên mật khẩu'
      : step === 'verify'
        ? 'Nhập mã OTP'
        : step === 'reset'
          ? 'Đặt mật khẩu mới'
          : 'Khôi phục hoàn tất';

  const heroSubtitle =
    step === 'request'
      ? 'Nhập email UIT để nhận mã OTP đặt lại mật khẩu.'
      : step === 'verify'
        ? 'Xác thực OTP trước khi đổi mật khẩu.'
        : step === 'reset'
          ? 'Tạo mật khẩu mới cho tài khoản UIT của bạn.'
          : 'Quay lại đăng nhập bằng mật khẩu mới.';

  return (
    <Screen>
      <TopHero
        eyebrow="Khôi phục truy cập"
        title={heroTitle}
        subtitle={heroSubtitle}
        badge={{ label: step === 'done' ? 'Hoàn tất' : 'OTP', tone: step === 'done' ? 'success' : 'warning' }}
      />

      <ContentStack narrow overlapHero={false}>
        <SectionCard
          title="Khôi phục mật khẩu"
          subtitle="Thực hiện theo từng bước để lấy lại quyền truy cập."
          variant="elevated"
        >
          <View style={styles.stack}>
            {feedback ? <StatusBadge label={feedback.label} tone={feedback.tone} /> : null}

            {step !== 'done' ? (
              <InfoRow
                label="Email"
                value={maskedEmail || email.trim() || 'Chưa nhập'}
              />
            ) : null}

            {step === 'verify' || step === 'reset' ? (
              <InfoRow
                label="Hiệu lực OTP"
                value={`${Math.round(expiresInSeconds / 60)} phút`}
              />
            ) : null}

            {previewCode ? (
              <InfoRow label="Mã thử nghiệm" value={previewCode} />
            ) : null}

            {step === 'request' ? (
              <FormField
                label="Email UIT"
                placeholder="student@gm.uit.edu.vn"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  resetFeedback();
                }}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            ) : null}

            {step === 'verify' ? (
              <FormField
                label="OTP"
                placeholder="123456"
                value={otp}
                onChangeText={(value) => {
                  setOtp(value.replace(/\D/g, '').slice(0, 6));
                  resetFeedback();
                }}
                keyboardType="number-pad"
              />
            ) : null}

            {step === 'reset' ? (
              <>
                <FormField
                  label="Mật khẩu mới"
                  placeholder="Ít nhất 8 ký tự"
                  value={newPassword}
                  onChangeText={(value) => {
                    setNewPassword(value);
                    resetFeedback();
                  }}
                  secureTextEntry
                />
                <FormField
                  label="Xác nhận mật khẩu"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    resetFeedback();
                  }}
                  secureTextEntry
                />
              </>
            ) : null}

            {step === 'done' ? (
              <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                Mật khẩu cũ đã hết hiệu lực. Đăng nhập lại để tiếp tục sử dụng ứng dụng.
              </Text>
            ) : null}
          </View>
        </SectionCard>

        {step === 'request' ? (
          <PrimaryButton
            label="Gửi OTP"
            loading={loading}
            onPress={() => void handleRequestOtp()}
          />
        ) : null}

        {step === 'verify' ? (
          <>
            <PrimaryButton
              label="Xác thực OTP"
              loading={loading}
              onPress={() => void handleVerifyOtp()}
            />
            <SecondaryButton
              label="Gửi lại OTP"
              onPress={() => void handleRequestOtp()}
            />
          </>
        ) : null}

        {step === 'reset' ? (
          <PrimaryButton
            label="Cập nhật mật khẩu"
            loading={loading}
            onPress={() => void handleResetPassword()}
          />
        ) : null}

        <SecondaryButton
          label={step === 'done' ? 'Về đăng nhập' : 'Quay lại đăng nhập'}
          onPress={() => router.back()}
        />
      </ContentStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 12,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
});
