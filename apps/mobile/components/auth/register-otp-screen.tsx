import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLockup, PrimaryButton, Screen, SecondaryButton, StatusBadge } from '@/components/ui';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { isRegistrationSessionSetupError } from '@/utils/auth-errors';
import { getLocalizedErrorMessage } from '@/utils/error-message';

const OTP_LENGTH = 6;
const SCREEN_BASE_BOTTOM_PADDING = 32;

type Feedback = {
  tone: 'success' | 'danger' | 'warning';
  label: string;
};

function formatCountdown(totalSeconds: number) {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(totalSeconds, 0) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function RegisterOtpScreen() {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const leavingRef = useRef(false);
  const pendingRegistration = useAuthStore((state) => state.pendingRegistration);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const verifyRegistrationOtp = useAuthStore((state) => state.verifyRegistrationOtp);
  const resendRegistrationOtp = useAuthStore((state) => state.resendRegistrationOtp);
  const clearPendingRegistration = useAuthStore((state) => state.clearPendingRegistration);
  const [otp, setOtp] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [loadingAction, setLoadingAction] = useState<'verify' | 'resend' | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    if (!pendingRegistration && !isAuthenticated && !leavingRef.current) {
      router.replace('/register');
    }
  }, [isAuthenticated, pendingRegistration]);

  useEffect(() => {
    setNowMs(Date.now());
    const interval = setInterval(() => setNowMs(Date.now()), 1_000);
    return () => clearInterval(interval);
  }, [pendingRegistration?.expiresAtMs, pendingRegistration?.resendAvailableAtMs]);

  const countdown = useMemo(() => {
    if (!pendingRegistration) {
      return { expiresIn: 0, resendIn: 0 };
    }

    const rawExpiresIn = Math.ceil((pendingRegistration.expiresAtMs - nowMs) / 1_000);
    const rawResendIn = Math.ceil((pendingRegistration.resendAvailableAtMs - nowMs) / 1_000);

    return {
      expiresIn: Number.isFinite(rawExpiresIn) ? Math.max(rawExpiresIn, 0) : 0,
      resendIn: Number.isFinite(rawResendIn) ? Math.max(rawResendIn, 0) : 0,
    };
  }, [nowMs, pendingRegistration]);

  if (!pendingRegistration) {
    return null;
  }

  const { challenge } = pendingRegistration;
  const isExpired = countdown.expiresIn <= 0;
  const isBusy = loadingAction !== null;
  const screenVerticalPadding = layout.isCompact ? 12 : 20;
  const centeredStageMinHeight = Math.max(
    520,
    layout.viewportHeight -
      insets.top -
      insets.bottom -
      screenVerticalPadding * 2 -
      SCREEN_BASE_BOTTOM_PADDING,
  );
  const cardPadding = layout.isCompact ? 16 : layout.isTablet ? 28 : 22;
  const otpGap = layout.isCompact ? 6 : 8;
  const maxOtpWidth = Math.min(
    layout.viewportWidth - layout.horizontalPadding * 2 - cardPadding * 2,
    360,
  );
  const otpCellSize = Math.max(
    38,
    Math.min(layout.isTablet ? 52 : 48, Math.floor((maxOtpWidth - otpGap * 5) / OTP_LENGTH)),
  );
  const visibleFeedback =
    feedback ??
    (isExpired
      ? {
          tone: 'warning' as const,
          label: 'Mã OTP đã hết hạn. Hãy đăng ký lại để nhận mã mới.',
        }
      : null);

  const handleOtpChange = (value: string) => {
    setOtp(value.replace(/\D/g, '').slice(0, OTP_LENGTH));
    setFeedback(null);
  };

  const handleVerify = async () => {
    if (otp.length !== OTP_LENGTH) {
      setFeedback({ tone: 'danger', label: 'OTP cần đủ 6 chữ số.' });
      inputRef.current?.focus();
      return;
    }

    if (isExpired) {
      setFeedback({
        tone: 'warning',
        label: 'Mã OTP đã hết hạn. Hãy đăng ký lại để nhận mã mới.',
      });
      return;
    }

    setLoadingAction('verify');
    setFeedback(null);
    try {
      await verifyRegistrationOtp(otp);
      router.replace('/home');
    } catch (error) {
      if (isRegistrationSessionSetupError(error)) {
        leavingRef.current = true;
        Alert.alert(
          'Email đã được xác thực',
          'Tài khoản đã được tạo nhưng phiên đăng nhập chưa hoàn tất. Vui lòng đăng nhập bằng mật khẩu vừa đặt.',
        );
        router.replace('/login');
        return;
      }

      setFeedback({
        tone: 'danger',
        label: getLocalizedErrorMessage(error, 'OTP không hợp lệ hoặc đã hết hạn.'),
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResend = async () => {
    if (countdown.resendIn > 0 || isBusy) {
      return;
    }

    setLoadingAction('resend');
    setFeedback(null);
    try {
      await resendRegistrationOtp();
      setOtp('');
      setNowMs(Date.now());
      setFeedback({
        tone: 'success',
        label: 'Mã OTP mới đã được gửi. Vui lòng kiểm tra email UIT.',
      });
      inputRef.current?.focus();
    } catch (error) {
      setFeedback({
        tone: 'danger',
        label: getLocalizedErrorMessage(error, 'Không thể gửi lại OTP lúc này.'),
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleEditRegistration = () => {
    leavingRef.current = true;
    clearPendingRegistration();
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.keyboardFrame, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: layout.horizontalPadding,
          paddingVertical: screenVerticalPadding,
        }}
      >
        <View
          testID="registration-otp-center-stage"
          style={[styles.centerStage, { minHeight: centeredStageMinHeight }]}
        >
          <View
            testID="registration-otp-card"
            style={[
              styles.card,
              theme.elevation.level2 as never,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
                borderRadius: layout.isCompact ? theme.radii.lg : theme.radii.xl,
                maxWidth: layout.isTablet ? 520 : 480,
                padding: cardPadding,
              },
            ]}
          >
            <View
              testID="registration-otp-top-row"
              style={[styles.topRow, layout.isCompact ? styles.topRowCompact : null]}
            >
              <BrandLockup
                compact
                compactDensity={layout.isCompact ? 'tight' : 'default'}
                emphasis="flat"
                showSubtitle={layout.isTablet}
              />
              <StatusBadge label="Bước 2/2" tone="primary" variant="soft" size="sm" />
            </View>

            <View style={styles.heading}>
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: theme.colors.primarySurface,
                    borderColor: theme.colors.primaryMuted,
                  },
                ]}
              >
                <Feather name="mail" size={24} color={theme.colors.primary} />
              </View>
              <Text
                style={[
                  styles.title,
                  {
                    color: theme.colors.text,
                    fontFamily: theme.fonts.bold,
                    fontSize: layout.isCompact ? 24 : 28,
                  },
                ]}
              >
                Xác thực email
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
                ]}
              >
                Nhập mã gồm 6 chữ số đã gửi tới{' '}
                <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.semibold }}>
                  {challenge.maskedEmail}
                </Text>
                .
              </Text>
            </View>

            <View style={styles.otpGroup}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: theme.colors.text, fontFamily: theme.fonts.medium },
                ]}
              >
                Mã OTP
              </Text>
              <Pressable
                accessible={false}
                onPress={() => inputRef.current?.focus()}
                style={[styles.otpRail, { gap: otpGap }]}
              >
                {Array.from({ length: OTP_LENGTH }, (_, index) => {
                  const digit = otp[index] ?? '';
                  const isActive = isFocused && index === Math.min(otp.length, OTP_LENGTH - 1);
                  return (
                    <View
                      key={index}
                      testID={`registration-otp-digit-${index}`}
                      style={[
                        styles.otpCell,
                        {
                          width: otpCellSize,
                          height: otpCellSize + 6,
                          backgroundColor: theme.colors.input,
                          borderColor:
                            visibleFeedback?.tone === 'danger'
                              ? theme.colors.danger
                              : isActive
                                ? theme.colors.primary
                                : digit
                                  ? theme.colors.primaryMuted
                                  : theme.colors.inputBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.otpDigit,
                          { color: theme.colors.text, fontFamily: theme.fonts.bold },
                        ]}
                      >
                        {digit}
                      </Text>
                    </View>
                  );
                })}
                <TextInput
                  ref={inputRef}
                  testID="registration-otp-input"
                  accessibilityLabel="Mã OTP gồm 6 chữ số"
                  accessibilityHint="Nhập mã xác thực được gửi tới email UIT của bạn"
                  accessibilityState={{ disabled: isBusy }}
                  value={otp}
                  onChangeText={handleOtpChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onSubmitEditing={() => void handleVerify()}
                  autoFocus
                  autoComplete="one-time-code"
                  caretHidden
                  editable={!isBusy}
                  keyboardType="number-pad"
                  maxLength={OTP_LENGTH}
                  returnKeyType="done"
                  textContentType="oneTimeCode"
                  style={styles.hiddenInput}
                />
              </Pressable>
            </View>

            {visibleFeedback ? (
              <View
                accessibilityRole="alert"
                style={[
                  styles.feedback,
                  {
                    backgroundColor:
                      visibleFeedback.tone === 'danger'
                        ? theme.colors.dangerSurface
                        : visibleFeedback.tone === 'warning'
                          ? theme.colors.warningSurface
                          : theme.colors.successSurface,
                    borderColor:
                      visibleFeedback.tone === 'danger'
                        ? theme.colors.danger
                        : visibleFeedback.tone === 'warning'
                          ? theme.colors.warning
                          : theme.colors.success,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.feedbackText,
                    {
                      color:
                        visibleFeedback.tone === 'danger'
                          ? theme.colors.danger
                          : visibleFeedback.tone === 'warning'
                            ? theme.colors.warning
                            : theme.colors.success,
                      fontFamily: theme.fonts.medium,
                    },
                  ]}
                >
                  {visibleFeedback.label}
                </Text>
              </View>
            ) : null}

            <View style={[styles.metaRow, layout.isCompact ? styles.metaRowCompact : null]}>
              <View
                style={[
                  styles.metaCard,
                  { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.metaLabel,
                    { color: theme.colors.textSoft, fontFamily: theme.fonts.regular },
                  ]}
                >
                  Mã hết hạn sau
                </Text>
                <Text
                  accessibilityLabel={`Mã hết hạn sau ${countdown.expiresIn} giây`}
                  style={[
                    styles.metaValue,
                    {
                      color: isExpired ? theme.colors.warning : theme.colors.text,
                      fontFamily: theme.fonts.semibold,
                    },
                  ]}
                >
                  {formatCountdown(countdown.expiresIn)}
                </Text>
              </View>
              <View
                style={[
                  styles.metaCard,
                  { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.metaLabel,
                    { color: theme.colors.textSoft, fontFamily: theme.fonts.regular },
                  ]}
                >
                  Có thể gửi lại
                </Text>
                <Text
                  accessibilityLabel={`Có thể gửi lại sau ${countdown.resendIn} giây`}
                  style={[
                    styles.metaValue,
                    { color: theme.colors.text, fontFamily: theme.fonts.semibold },
                  ]}
                >
                  {countdown.resendIn > 0 ? formatCountdown(countdown.resendIn) : 'Ngay bây giờ'}
                </Text>
              </View>
            </View>

            {__DEV__ && challenge.previewCode ? (
              <View
                style={[
                  styles.previewCard,
                  { backgroundColor: theme.colors.infoSurface, borderColor: theme.colors.info },
                ]}
              >
                <Feather name="terminal" size={16} color={theme.colors.info} />
                <Text
                  style={[
                    styles.previewText,
                    { color: theme.colors.info, fontFamily: theme.fonts.medium },
                  ]}
                >
                  Mã thử nghiệm: {challenge.previewCode}
                </Text>
              </View>
            ) : null}

            <View style={styles.actions}>
              <PrimaryButton
                label="Xác thực và vào UIT Campus"
                loading={loadingAction === 'verify'}
                disabled={isBusy || otp.length !== OTP_LENGTH || isExpired}
                onPress={() => void handleVerify()}
              />
              <SecondaryButton
                label={
                  isExpired
                    ? 'Đăng ký lại để nhận mã mới'
                    : countdown.resendIn > 0
                      ? `Gửi lại mã sau ${formatCountdown(countdown.resendIn)}`
                      : 'Gửi lại mã OTP'
                }
                loading={loadingAction === 'resend'}
                disabled={isBusy || (!isExpired && countdown.resendIn > 0)}
                onPress={isExpired ? handleEditRegistration : () => void handleResend()}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Quay lại sửa thông tin đăng ký"
              disabled={isBusy}
              onPress={handleEditRegistration}
              style={({ pressed }) => [styles.backLink, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Feather name="arrow-left" size={17} color={theme.colors.primary} />
              <Text
                style={[
                  styles.backLinkText,
                  { color: theme.colors.primary, fontFamily: theme.fonts.semibold },
                ]}
              >
                Sửa thông tin đăng ký
              </Text>
            </Pressable>
          </View>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardFrame: {
    flex: 1,
  },
  centerStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  card: {
    width: '100%',
    borderWidth: 1,
    gap: 18,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },
  topRowCompact: {
    alignItems: 'flex-start',
  },
  heading: {
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  title: {
    lineHeight: 34,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 420,
  },
  otpGroup: {
    gap: 9,
  },
  fieldLabel: {
    fontSize: 13,
  },
  otpRail: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  otpCell: {
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpDigit: {
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.01,
    color: 'transparent',
  },
  feedback: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  feedbackText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metaRowCompact: {
    gap: 8,
  },
  metaCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 4,
  },
  metaLabel: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  metaValue: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  previewCard: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  previewText: {
    fontSize: 13,
    lineHeight: 19,
  },
  actions: {
    gap: 10,
  },
  backLink: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 10,
  },
  backLinkText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
