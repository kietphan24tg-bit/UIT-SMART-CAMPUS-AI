import { Ionicons } from '@expo/vector-icons';
import { USER_ROLES } from '@smart-campus/shared';
import { Camera, CameraView, type PermissionResponse } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  AppState,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { logAttendanceCheckinAnalytics } from '@/services/analytics/attendance';
import {
  attendanceCheckinWithNetworkRetry,
  isLikelyNetworkError,
} from '@/services/api/attendance';
import { AUTH_ACCESS_TOKEN_KEY } from '@/services/api/client';
import {
  clearAttendanceCheckinRetryToken,
  stashAttendanceCheckinTokenForRetry,
} from '@/services/attendance/retry-token';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { mapAttendanceErrorToUi } from '@/utils/attendance-error-ui';

const SCAN_COOLDOWN_MS = 2500;
const STALL_WARNING_MS = 8000;
const CAMERA_PERMISSION_TIMEOUT_MS = 6000;
const PROCESSING_OVERLAY_DELAY_MS = 180;
const FRAME = 260;
/** Không phủ lên nút đóng + vùng chữ gợi ý phía dưới — để khung QR căn giữa đúng chỗ. */
const OVERLAY_TOP_BELOW_CONTROLS = 52;
const OVERLAY_BOTTOM_ABOVE_HINT = 132;
const SCAN_LINE_EDGE_PAD = 16;
const ATT_TOKEN_PREFIX = 'att_';
const MIN_PROCESSING_OVERLAY_MS = 550;
const INVALID_QR_HINT_MS = 1600;

/** When native permission call fails, unblock UI instead of spinning forever. */
const CAMERA_PERMISSION_FALLBACK = {
  status: 'undetermined',
  granted: false,
  expires: 'never' as const,
  canAskAgain: true,
} as PermissionResponse;

function pickAttendanceToken(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith(ATT_TOKEN_PREFIX)) {
    return trimmed.split(/[\s,;\n]+/)[0] ?? trimmed;
  }
  const parts = trimmed.split(/[\s,;\n]+/).map((p) => p.trim()).filter(Boolean);
  return parts.find((p) => p.startsWith(ATT_TOKEN_PREFIX)) ?? null;
}

function readApiMessage(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const m = (err as { message: unknown }).message;
    return typeof m === 'string' ? m : undefined;
  }
  return undefined;
}

function ScanLoadingFallback({
  label = 'Đang khởi tạo camera',
  accentColor,
}: {
  label?: string;
  accentColor: string;
}) {
  return (
    <View style={[styles.fill, styles.loadingWrap]}>
      <View style={styles.loadingFrame}>
        <View style={[styles.corner, styles.tl, { borderColor: accentColor }]} />
        <View style={[styles.corner, styles.tr, { borderColor: accentColor }]} />
        <View style={[styles.corner, styles.bl, { borderColor: accentColor }]} />
        <View style={[styles.corner, styles.br, { borderColor: accentColor }]} />
        <ActivityIndicator size="large" color={accentColor} />
        <Text style={styles.processingTitle}>Đang ghi nhận...</Text>
        <Text style={styles.processingSub}>{label}</Text>
      </View>
    </View>
  );
}

export default function AttendanceScanScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const role = useAuthStore((state) => state.user?.role ?? USER_ROLES.STUDENT);
  const [permission, setPermission] = useState<PermissionResponse | null>(null);
  const [sessionResolved, setSessionResolved] = useState(false);
  const [hasSessionToken, setHasSessionToken] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [stallWarning, setStallWarning] = useState(false);
  const [invalidQrHintVisible, setInvalidQrHintVisible] = useState(false);
  const lockedRef = useRef(false);
  const lastScanAtRef = useRef(0);
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const invalidHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const stallFade = useRef(new Animated.Value(0)).current;

  const clearStallTimer = useCallback(() => {
    if (stallTimerRef.current != null) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
  }, []);

  const clearProcessingDelayTimer = useCallback(() => {
    if (processingDelayTimerRef.current != null) {
      clearTimeout(processingDelayTimerRef.current);
      processingDelayTimerRef.current = null;
    }
  }, []);

  const showInvalidQrHint = useCallback(() => {
    setInvalidQrHintVisible(true);
    if (invalidHintTimerRef.current != null) {
      clearTimeout(invalidHintTimerRef.current);
    }
    invalidHintTimerRef.current = setTimeout(() => {
      setInvalidQrHintVisible(false);
      invalidHintTimerRef.current = null;
    }, INVALID_QR_HINT_MS);
  }, []);

  const refreshCameraPermission = useCallback(() => {
    const withTimeout = <T,>(promise: Promise<T>) => {
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('camera_permission_timeout')), CAMERA_PERMISSION_TIMEOUT_MS);
      });
      return Promise.race([promise, timeout]);
    };

    void (async () => {
      try {
        const currentPermission = await withTimeout(Camera.getCameraPermissionsAsync());
        if (currentPermission.granted || currentPermission.canAskAgain === false) {
          setPermission(currentPermission);
          return;
        }

        const requestedPermission = await withTimeout(Camera.requestCameraPermissionsAsync());
        setPermission(requestedPermission);
      } catch {
        setPermission(CAMERA_PERMISSION_FALLBACK);
      }
    })();
  }, []);

  const resolveSession = useCallback(() => {
    const inMemory = Boolean(useAuthStore.getState().accessToken);
    if (inMemory) {
      setHasSessionToken(true);
      setSessionResolved(true);
    }
    void SecureStore.getItemAsync(AUTH_ACCESS_TOKEN_KEY)
      .then((stored) => {
        const ok = Boolean(stored) || Boolean(useAuthStore.getState().accessToken);
        setHasSessionToken(ok);
        setSessionResolved(true);
      })
      .catch(() => {
        setHasSessionToken(Boolean(useAuthStore.getState().accessToken));
        setSessionResolved(true);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      lockedRef.current = false;
      setProcessing(false);
      setStallWarning(false);
      setInvalidQrHintVisible(false);
      clearProcessingDelayTimer();
      refreshCameraPermission();
      resolveSession();
    }, [clearProcessingDelayTimer, refreshCameraPermission, resolveSession]),
  );

  useEffect(() => {
    if (role !== USER_ROLES.STUDENT) {
      router.replace('/services/attendance' as never);
    }
  }, [role, router]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshCameraPermission();
        resolveSession();
      }
    });

    return () => subscription.remove();
  }, [refreshCameraPermission, resolveSession]);

  useEffect(() => {
    const t = setTimeout(() => setStallWarning(true), STALL_WARNING_MS);
    stallTimerRef.current = t;
    return () => {
      clearTimeout(t);
      stallTimerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scanLineAnim]);

  useEffect(() => {
    Animated.timing(stallFade, {
      toValue: stallWarning ? 1 : 0,
      duration: stallWarning ? 260 : 200,
      useNativeDriver: true,
    }).start();
  }, [stallFade, stallWarning]);

  useEffect(() => {
    return () => {
      clearProcessingDelayTimer();
      if (invalidHintTimerRef.current != null) {
        clearTimeout(invalidHintTimerRef.current);
      }
    };
  }, [clearProcessingDelayTimer]);

  const frameColor = stallWarning ? theme.colors.warning : theme.colors.primary;

  const submitToken = useCallback(
    async (raw: string) => {
      const token = pickAttendanceToken(raw);
      if (!token || !token.startsWith(ATT_TOKEN_PREFIX)) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
        showInvalidQrHint();
        return;
      }
      if (lockedRef.current) {
        return;
      }
      const now = Date.now();
      if (now - lastScanAtRef.current < SCAN_COOLDOWN_MS) {
        return;
      }
      lastScanAtRef.current = now;
      lockedRef.current = true;
      clearStallTimer();
      clearProcessingDelayTimer();
      processingDelayTimerRef.current = setTimeout(() => {
        setProcessing(true);
        processingDelayTimerRef.current = null;
      }, PROCESSING_OVERLAY_DELAY_MS);
      setStallWarning(false);
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // optional
      }

      try {
        const data = await attendanceCheckinWithNetworkRetry(token);
        await new Promise((resolve) => setTimeout(resolve, MIN_PROCESSING_OVERLAY_MS));
        clearAttendanceCheckinRetryToken();
        logAttendanceCheckinAnalytics({ outcome: 'success', phase: 'initial' });
        router.replace({
          pathname: '/services/attendance/result',
          params: {
            outcome: 'success',
            sessionId: data.sessionId,
            checkinTime: data.checkinTime,
          },
        } as never);
      } catch (err) {
        const ui = mapAttendanceErrorToUi(err);
        const serverMessage = readApiMessage(err);
        if (ui.code === 'NETWORK' || isLikelyNetworkError(err)) {
          stashAttendanceCheckinTokenForRetry(token);
        } else {
          clearAttendanceCheckinRetryToken();
        }
        logAttendanceCheckinAnalytics({ outcome: 'error', phase: 'initial', error_code: ui.code });
        router.replace({
          pathname: '/services/attendance/result',
          params: {
            outcome: 'error',
            recoverable: ui.recoverable ? '1' : '0',
            code: ui.code,
            ...(serverMessage && ui.code === 'ALREADY_CHECKED_IN' ? { serverMessage } : {}),
          },
        } as never);
      } finally {
        clearProcessingDelayTimer();
        setProcessing(false);
      }
    },
    [clearProcessingDelayTimer, clearStallTimer, router, showInvalidQrHint],
  );

  const handleBarcodeScanned = useCallback(
    (event: { data: string }) => {
      void submitToken(event.data);
    },
    [submitToken],
  );

  if (!sessionResolved) {
    return <ScanLoadingFallback label="Đang kiểm tra phiên đăng nhập" accentColor={theme.colors.primary} />;
  }

  if (role !== USER_ROLES.STUDENT) {
    return null;
  }

  if (!hasSessionToken) {
    return (
      <View style={[styles.fill, { paddingTop: insets.top + 12, paddingHorizontal: 24 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng"
          onPress={() => router.back()}
          style={[styles.closeBtn, { top: insets.top + 8 }]}
        >
          <View style={styles.closeCircle}>
            <Ionicons name="close" size={22} color="#fff" />
          </View>
        </Pressable>
        <View style={[styles.centerMessage, { flex: 1 }]}>
          <Text style={styles.whiteText}>Cần đăng nhập để điểm danh.</Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
            <Text style={[styles.link, { color: theme.colors.primary }]}>Quay lại</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!permission) {
    return <ScanLoadingFallback label="Vui lòng chờ trong giây lát" accentColor={theme.colors.primary} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.fill, { backgroundColor: '#000', paddingTop: insets.top }]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={[styles.closeBtn, { top: insets.top + 8 }]}
        >
          <View style={styles.closeCircle}>
            <Ionicons name="close" size={22} color="#fff" />
          </View>
        </Pressable>
        <View style={[styles.centerMessage, { paddingHorizontal: 24 }]}>
          <Text style={styles.whiteText}>Cần quyền camera để quét mã.</Text>
          <Pressable onPress={() => void Linking.openSettings()} style={{ marginTop: 16 }}>
            <Text style={[styles.link, { color: theme.colors.primary }]}>Mở Cài đặt</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.fill, { paddingTop: insets.top, justifyContent: 'center', padding: 24 }]}>
        <Text style={styles.whiteText}>Quét QR chưa hỗ trợ trên web. Dùng ứng dụng iOS hoặc Android.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={[styles.link, { color: theme.colors.primary }]}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  const lineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCAN_LINE_EDGE_PAD, FRAME - SCAN_LINE_EDGE_PAD - 4],
  });

  const overlayInsets = {
    paddingTop: insets.top + OVERLAY_TOP_BELOW_CONTROLS,
    paddingBottom: insets.bottom + OVERLAY_BOTTOM_ABOVE_HINT,
  };

  return (
    <View style={styles.fill}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={processing ? undefined : handleBarcodeScanned}
      />

      {!processing ? (
        <View style={styles.overlayRoot} pointerEvents="box-none">
          <View
            style={[styles.dimBandTop, { height: insets.top + OVERLAY_TOP_BELOW_CONTROLS }]}
          />
          <View
            style={[styles.dimBandBottom, { height: insets.bottom + OVERLAY_BOTTOM_ABOVE_HINT }]}
          />
          <View style={[styles.overlayColumn, overlayInsets]} pointerEvents="box-none">
            <View style={styles.dimTop} />
            <View style={styles.middleRow}>
              <View style={styles.dimSide} />
              <View style={styles.frame}>
                <View style={[styles.corner, styles.tl, { borderColor: frameColor }]} />
                <View style={[styles.corner, styles.tr, { borderColor: frameColor }]} />
                <View style={[styles.corner, styles.bl, { borderColor: frameColor }]} />
                <View style={[styles.corner, styles.br, { borderColor: frameColor }]} />
                {!stallWarning ? (
                  <Animated.View
                    style={[
                      styles.scanLine,
                      {
                        backgroundColor: theme.colors.primary,
                        transform: [{ translateY: lineTranslate }],
                      },
                    ]}
                  />
                ) : null}
              </View>
              <View style={styles.dimSide} />
            </View>
            <View style={styles.dimBottom} />
          </View>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Đóng"
        onPress={() => router.back()}
        style={[styles.closeBtn, { top: insets.top + 8 }]}
      >
        <View style={styles.closeCircle}>
          <Ionicons name="close" size={22} color="#fff" />
        </View>
      </Pressable>

      {!processing ? (
        <View style={[styles.bottomWrap, { paddingBottom: insets.bottom + 20 }]} pointerEvents="box-none">
          {invalidQrHintVisible ? (
            <View style={[styles.warnPill, { borderColor: theme.colors.warning, opacity: 0.92 }]}>
              <Ionicons name="qr-code-outline" size={18} color={theme.colors.warning} />
              <Text style={[styles.warnPillText, { color: theme.colors.warning }]}>
                Không phải mã điểm danh
              </Text>
            </View>
          ) : null}
          {stallWarning ? (
            <Animated.View style={{ opacity: stallFade, alignSelf: 'stretch' }}>
              <View style={[styles.warnPill, { borderColor: theme.colors.warning }]}>
                <Ionicons name="sunny-outline" size={18} color={theme.colors.warning} />
                <Text style={[styles.warnPillText, { color: theme.colors.warning }]}>
                  Đưa máy lại gần, đảm bảo đủ sáng
                </Text>
              </View>
            </Animated.View>
          ) : null}
          <Text style={styles.hint}>
            {stallWarning ? 'Không nhận được mã. Thử lại gần hơn' : 'Đưa mã vào khung'}
          </Text>
        </View>
      ) : null}

      {processing ? (
        <View style={styles.processingOverlay}>
          <View style={styles.processingCenterWrap} pointerEvents="none">
            <View style={styles.frame}>
              <View style={[styles.processingCard, styles.fillFrame]} />
              <View style={[styles.corner, styles.tl, { borderColor: theme.colors.primary }]} />
              <View style={[styles.corner, styles.tr, { borderColor: theme.colors.primary }]} />
              <View style={[styles.corner, styles.bl, { borderColor: theme.colors.primary }]} />
              <View style={[styles.corner, styles.br, { borderColor: theme.colors.primary }]} />
              <View style={styles.processingContent}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.processingTitle}>Đang ghi nhận...</Text>
                <Text style={styles.processingSub}>Vui lòng giữ nguyên</Text>
              </View>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
  },
  dimBandTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  dimBandBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  overlayColumn: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },
  dimTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  dimBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  middleRow: {
    flexDirection: 'row',
    height: FRAME,
  },
  dimSide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  frame: {
    width: FRAME,
    height: FRAME,
    position: 'relative',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#fff',
  },
  tl: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  tr: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bl: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 4,
    opacity: 0.85,
    top: 0,
    borderRadius: 1,
    shadowColor: '#00E5FF',
    shadowOpacity: 0.45,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  closeBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 20,
  },
  closeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  hint: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 15,
    textAlign: 'center',
  },
  link: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  warnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  warnPillText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  processingCenterWrap: {
    width: FRAME,
    height: FRAME,
  },
  fillFrame: {
    ...StyleSheet.absoluteFillObject,
  },
  processingCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    borderRadius: 14,
  },
  processingContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingFrame: {
    width: FRAME,
    height: FRAME,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    position: 'relative',
  },
  processingTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  processingSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
  },
  centerMessage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});
