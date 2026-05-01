import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import ForgotHero from '../../assets/auth/forgot-hero.jpg';

import { AuthShell } from './auth-shell';

import { FormField, InfoRow, PrimaryButton, SecondaryButton, StatusBadge } from '@/components/ui';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
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

const STEP_META: Record<ResetStep, { title: string; subtitle: string; badge: string }> = {
  request: {
    title: 'Quên mật khẩu',
    subtitle: 'Nhập email sinh viên để nhận mã xác thực và bắt đầu khôi phục quyền truy cập.',
    badge: 'Bước 1/3',
  },
  verify: {
    title: 'Xác thực OTP',
    subtitle: 'Kiểm tra hộp thư và nhập mã OTP để tiếp tục sang bước đặt lại mật khẩu.',
    badge: 'Bước 2/3',
  },
  reset: {
    title: 'Mật khẩu mới',
    subtitle: 'Tạo một mật khẩu đủ mạnh để quay lại UIT Campus một cách an toàn.',
    badge: 'Bước 3/3',
  },
  done: {
    title: 'Hoàn tất khôi phục',
    subtitle: 'Mật khẩu đã được cập nhật. Bạn có thể quay lại đăng nhập bằng thông tin mới.',
    badge: 'Sẵn sàng',
  },
};

export function ForgotPasswordScreen() {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const [step, setStep] = useState<ResetStep>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [expiresInSeconds, setExpiresInSeconds] = useState(600);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: FeedbackTone; label: string } | null>(null);

  const currentStep = STEP_META[step];
  const stepOrder: ResetStep[] = ['request', 'verify', 'reset'];
  const activeIndex = step === 'done' ? 3 : stepOrder.indexOf(step);
  const useWideMeta = layout.isTablet || layout.isExtraLargePhone;
  const shouldShowMetaGroup = step === 'verify' || step === 'reset';
  const helperCopy =
    maskedEmail && (step === 'verify' || step === 'reset')
      ? `OTP đã được gửi tới ${maskedEmail}.`
      : null;

  const resetFeedback = () => setFeedback(null);

  const handleRequestOtp = async () => {
    if (!isValidUitEmail(email)) {
      setFeedback({ tone: 'danger', label: 'Vui lòng nhập email sinh viên hợp lệ.' });
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
      setFeedback({
        tone: 'success',
        label: 'OTP đã được tạo. Kiểm tra email của bạn để tiếp tục.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể gửi OTP lúc này.';
      setFeedback({ tone: 'danger', label: message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(otp.trim())) {
      setFeedback({ tone: 'danger', label: 'OTP cần đủ 6 chữ số.' });
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
      setFeedback({ tone: 'success', label: 'OTP hợp lệ. Bạn có thể tạo mật khẩu mới.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OTP không hợp lệ hoặc đã hết hạn.';
      setFeedback({ tone: 'danger', label: message });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!isValidPassword(newPassword)) {
      setFeedback({ tone: 'danger', label: 'Mật khẩu tối thiểu 8 ký tự, có 1 chữ hoa và 1 số.' });
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
      setPreviewCode(null);
      setStep('done');
      setFeedback({ tone: 'success', label: 'Mật khẩu đã được cập nhật thành công.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật mật khẩu.';
      setFeedback({ tone: 'danger', label: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      heroImage={ForgotHero}
      heroPosition="center"
      heroAlt="Minh họa khuôn viên UIT"
      heroLabel={currentStep.badge}
      displayTitle="Khôi Phục"
      displaySubtitle="Lấy lại quyền truy cập UIT Campus chỉ với 3 bước"
      panelTitle={currentStep.title}
      panelSubtitle={currentStep.subtitle}
      footer={
        <Text
          style={[
            styles.footerText,
            { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
          ]}
        >
          Bạn nhớ mật khẩu rồi?{' '}
          <Text
            accessibilityRole="link"
            onPress={() => router.replace('/login')}
            style={[
              styles.footerTextStrong,
              { color: theme.colors.primary, fontFamily: theme.fonts.semibold },
            ]}
          >
            Quay lại đăng nhập
          </Text>
        </Text>
      }
    >
      <View style={[styles.stepRail, useWideMeta ? styles.stepRailWide : null]}>
        {['Email', 'OTP', 'Mật khẩu'].map((label, index) => {
          const isActive = activeIndex === index;
          const isDone = activeIndex > index;

          return (
            <View
              key={label}
              style={[
                styles.stepChip,
                {
                  backgroundColor:
                    isActive || isDone ? theme.colors.primarySurface : theme.colors.surfaceSubtle,
                  borderColor: isActive || isDone ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.stepChipText,
                  {
                    color: isActive || isDone ? theme.colors.primary : theme.colors.textMuted,
                    fontFamily: theme.fonts.semibold,
                  },
                ]}
              >
                {index + 1}. {label}
              </Text>
            </View>
          );
        })}
      </View>

      {feedback ? <StatusBadge label={feedback.label} tone={feedback.tone} /> : null}

      {helperCopy ? (
        <Text
          style={[
            styles.helperCopy,
            { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
          ]}
        >
          {helperCopy}
        </Text>
      ) : null}

      {step !== 'done' && (shouldShowMetaGroup || previewCode) ? (
        <View style={styles.metaGroup}>
          {shouldShowMetaGroup ? (
            <InfoRow label="Hiệu lực OTP" value={`${Math.round(expiresInSeconds / 60)} phút`} />
          ) : null}
          {previewCode ? <InfoRow label="Mã thử nghiệm" value={previewCode} /> : null}
        </View>
      ) : null}

      {step === 'request' ? (
        <FormField
          label="Email sinh viên"
          placeholder="student@gm.uit.edu.vn"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            resetFeedback();
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          leftIcon="mail"
        />
      ) : null}

      {step === 'verify' ? (
        <FormField
          label="Mã OTP"
          placeholder="123456"
          value={otp}
          onChangeText={(value) => {
            setOtp(value.replace(/\D/g, '').slice(0, 6));
            resetFeedback();
          }}
          keyboardType="number-pad"
          leftIcon="key"
        />
      ) : null}

      {step === 'reset' ? (
        <View style={styles.form}>
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
            leftIcon="lock"
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
            secureToggle
            leftIcon="shield"
          />
        </View>
      ) : null}

      {step === 'done' ? (
        <View
          style={[
            styles.doneCard,
            { backgroundColor: theme.colors.successSurface, borderColor: theme.colors.success },
          ]}
        >
          <Text
            style={[
              styles.doneTitle,
              { color: theme.colors.success, fontFamily: theme.fonts.bold },
            ]}
          >
            Sẵn sàng quay lại
          </Text>
          <Text
            style={[
              styles.doneBody,
              { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
            ]}
          >
            Mật khẩu cũ đã hết hiệu lực. Hãy dùng mật khẩu mới để đăng nhập và tiếp tục sử dụng ứng
            dụng.
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
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
            <SecondaryButton label="Gửi lại OTP" onPress={() => void handleRequestOtp()} />
          </>
        ) : null}

        {step === 'reset' ? (
          <PrimaryButton
            label="Cập nhật mật khẩu"
            loading={loading}
            onPress={() => void handleResetPassword()}
          />
        ) : null}

        {step === 'done' ? (
          <PrimaryButton label="Về đăng nhập" onPress={() => router.replace('/login')} />
        ) : null}
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  stepRail: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  stepRailWide: {
    flexWrap: 'nowrap',
  },
  stepChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  stepChipText: {
    fontSize: 12,
  },
  metaGroup: {
    gap: 10,
  },
  helperCopy: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: -2,
  },
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
  footerText: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    width: '100%',
  },
  footerTextStrong: {
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});
