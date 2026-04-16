import { Ionicons } from '@expo/vector-icons';
// TEST: kiểm tra role — bật lại khi hết giai đoạn test
// import { USER_ROLES } from '@smart-campus/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { AttendanceCtaButton, AttendanceIconCircle } from '@/components/attendance/attendance-cta-button';
import { Screen, SecondaryButton } from '@/components/ui';
import {
  clearAttendanceCheckinRetryToken,
} from '@/services/attendance/retry-token';
// import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import {
  mapAttendanceErrorToUi,
  type AttendanceErrorUi,
} from '@/utils/attendance-error-ui';

function formatCheckinDisplay(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const date = d.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return `${time} • ${date}`;
}

function readApiMessage(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const m = (err as { message: unknown }).message;
    return typeof m === 'string' ? m : undefined;
  }
  return undefined;
}

function getErrorPresentation(code?: string, recoverable?: boolean) {
  if (code === 'ALREADY_CHECKED_IN') {
    return {
      tone: 'muted' as const,
      icon: 'alert-circle-outline' as const,
    };
  }
  if (!recoverable || code === 'SESSION_CLOSED') {
    return {
      tone: 'muted' as const,
      icon: 'lock-closed-outline' as const,
    };
  }
  return {
    tone: 'warning' as const,
    icon: 'warning-outline' as const,
  };
}

function ResultEnterAnimation({ children }: { children: ReactNode }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [t]);
  const opacity = t;
  const translateY = t.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });
  const scale = t.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
  });
  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }, { scale }],
      }}
    >
      {children}
    </Animated.View>
  );
}

export default function AttendanceResultScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  // const role = useAuthStore((s) => s.user?.role);
  const params = useLocalSearchParams<{
    outcome?: string;
    sessionId?: string;
    checkinTime?: string;
    recoverable?: string;
    code?: string;
    serverMessage?: string;
  }>();

  const outcome = params.outcome ?? '';
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitedRef = useRef(false);

  const errorUi = useMemo(() => {
    if (outcome !== 'error') {
      return null;
    }
    const code = typeof params.code === 'string' ? params.code : undefined;
    const statusCode =
      code === 'RATE_LIMITED' ? 429 : code === 'ALREADY_CHECKED_IN' ? 409 : 400;
    return mapAttendanceErrorToUi({
      code,
      statusCode,
      message: typeof params.serverMessage === 'string' ? params.serverMessage : undefined,
    });
  }, [outcome, params.code, params.serverMessage]);

  const clearAutoTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const exitTo = useCallback(
    (href: Parameters<typeof router.replace>[0]) => {
      if (exitedRef.current) {
        return;
      }
      exitedRef.current = true;
      clearAutoTimer();
      clearAttendanceCheckinRetryToken();
      router.replace(href as never);
    },
    [clearAutoTimer, router],
  );

  const exitToRef = useRef(exitTo);
  exitToRef.current = exitTo;

  /*
  useEffect(() => {
    if (role !== USER_ROLES.STUDENT) {
      router.replace('/services/attendance' as never);
    }
  }, [role, router]);
  */

  useEffect(() => {
    if (outcome !== 'success') {
      return undefined;
    }
    timerRef.current = setTimeout(() => {
      exitToRef.current('/services/attendance' as never);
    }, 3000);
    return () => {
      clearAutoTimer();
    };
  }, [outcome, clearAutoTimer]);

  const activeError = errorUi;

  // if (role !== USER_ROLES.STUDENT) {
  //   return null;
  // }

  if (outcome === 'success' && params.checkinTime) {
    return (
      <Screen scroll={false} contentContainerStyle={styles.screenContent}>
        <View style={styles.rootStack}>
          <View style={styles.contentWrap}>
            <ResultEnterAnimation>
              <View style={styles.centerBlockLarge}>
                <AttendanceIconCircle tone="success">
                  <Ionicons name="checkmark" size={44} color={theme.colors.primary} />
                </AttendanceIconCircle>
                <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                  Điểm danh thành công
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                  Bạn đã điểm danh thành công cho buổi học hiện tại.
                </Text>
                <View
                  style={[
                    styles.timePill,
                    { backgroundColor: theme.colors.primarySurface, borderColor: theme.colors.primary },
                  ]}
                >
                  <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
                  <Text style={[styles.timePillText, { color: theme.colors.primary, fontFamily: theme.fonts.semibold }]}>
                    {formatCheckinDisplay(params.checkinTime)}
                  </Text>
                </View>
              </View>
            </ResultEnterAnimation>
            <View style={styles.actionsWrap}>
              <AttendanceCtaButton label="Xong" onPress={() => exitTo('/services/attendance' as never)} />
              <Text style={[styles.autoHint, { color: theme.colors.textSoft, fontFamily: theme.fonts.regular }]}>
                Tự về trang điểm danh sau 3 giây
              </Text>
            </View>
          </View>
        </View>
      </Screen>
    );
  }

  if (outcome === 'error' && activeError) {
    const recoverable = activeError.recoverable;
    const errorPresentation = getErrorPresentation(activeError.code, recoverable);
    const errorTitle = activeError.title?.trim() || 'Không điểm danh được';
    const errorMessage = activeError.message?.trim() || 'Đã xảy ra lỗi. Vui lòng thử lại.';

    return (
      <Screen scroll={false} contentContainerStyle={styles.screenContent}>
        <View style={styles.rootStack}>
          <View style={styles.contentWrap}>
            <View style={styles.centerBlockLarge}>
              <AttendanceIconCircle tone={errorPresentation.tone}>
                <Ionicons
                  name={errorPresentation.icon}
                  size={36}
                  color={errorPresentation.tone === 'warning' ? theme.colors.warning : theme.colors.textSoft}
                />
              </AttendanceIconCircle>
              <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                {errorTitle}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                {errorMessage}
              </Text>
            </View>
            <View style={styles.actionsWrap}>
              {recoverable ? (
                <>
                  <AttendanceCtaButton
                    label="Quét lại"
                    onPress={() => exitTo('/services/attendance/scan' as never)}
                  />
                  <SecondaryButton
                    label="Quay lại"
                    onPress={() => exitTo('/services/attendance' as never)}
                    style={styles.fullWidthButton}
                  />
                </>
              ) : (
                <AttendanceCtaButton label="Về Dịch vụ" onPress={() => exitTo('/services' as never)} />
              )}
            </View>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} contentContainerStyle={styles.screenContent}>
      <View style={styles.rootStack}>
        <View style={styles.contentWrap}>
          <Text style={{ color: theme.colors.text, textAlign: 'center' }}>Không có kết quả.</Text>
          <SecondaryButton
            label="Quay lại"
            onPress={() => exitTo('/services/attendance' as never)}
            style={styles.fullWidthButton}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingBottom: 0,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  rootStack: {
    alignSelf: 'stretch',
    maxWidth: 420,
  },
  contentWrap: {
    alignSelf: 'stretch',
    gap: 24,
  },
  centerBlockLarge: {
    alignItems: 'center',
    gap: 14,
    paddingTop: 8,
  },
  actionsWrap: {
    gap: 12,
    width: '100%',
    alignItems: 'stretch',
  },
  fullWidthButton: {
    width: '100%',
    alignSelf: 'stretch',
  },
  title: {
    fontSize: 40 / 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 32 / 2,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 300,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 8,
  },
  timePillText: {
    fontSize: 15,
  },
  autoHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
