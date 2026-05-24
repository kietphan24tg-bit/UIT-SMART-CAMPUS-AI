import { Ionicons } from '@expo/vector-icons';
import { USER_ROLES } from '@smart-campus/shared';
import { Camera, type PermissionResponse } from 'expo-camera';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { AttendanceCtaButton } from '@/components/attendance/attendance-cta-button';
import { ContentStack, EmptyState, Screen } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { canManageAttendanceRole } from '@/utils/app';

const CAMERA_PERMISSION_FALLBACK = {
  status: 'undetermined',
  granted: false,
  expires: 'never' as const,
  canAskAgain: true,
} as PermissionResponse;

export default function AttendanceHubScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role ?? USER_ROLES.STUDENT);
  const [cameraPerm, setCameraPerm] = useState<PermissionResponse | null>(null);
  const hubNavLockRef = useRef(false);
  const devForceCameraPermissionDenied = false;

  const refreshCameraPermission = useCallback(() => {
    void Camera.getCameraPermissionsAsync()
      .then(setCameraPerm)
      .catch(() => setCameraPerm(CAMERA_PERMISSION_FALLBACK));
  }, []);

  useFocusEffect(
    useCallback(() => {
      hubNavLockRef.current = false;
      refreshCameraPermission();
    }, [refreshCameraPermission]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshCameraPermission();
      }
    });

    return () => subscription.remove();
  }, [refreshCameraPermission]);

  const handlePrimaryCta = useCallback(() => {
    void (async () => {
      if (hubNavLockRef.current) {
        return;
      }

      let nextPermission = cameraPerm;
      if (!nextPermission?.granted) {
        try {
          nextPermission = await Camera.requestCameraPermissionsAsync();
          setCameraPerm(nextPermission);
        } catch {
          nextPermission = CAMERA_PERMISSION_FALLBACK;
          setCameraPerm(nextPermission);
        }
      }

      if (!nextPermission?.granted) {
        if (nextPermission?.canAskAgain === false) {
          void Linking.openSettings();
        }
        return;
      }

      hubNavLockRef.current = true;
      router.push('/services/attendance/scan' as never);
    })();
  }, [cameraPerm, router]);

  const hasCameraPermission =
    !(__DEV__ && devForceCameraPermissionDenied) && cameraPerm?.granted === true;

  if (canManageAttendanceRole(role)) {
    return <Redirect href="/services/attendance/lecturer" />;
  }

  if (role !== USER_ROLES.STUDENT) {
    return (
      <Screen>
        <ContentStack narrow overlapHero={false}>
          <EmptyState
            icon="lock-closed-outline"
            title="Bạn không có quyền truy cập"
            description="Chỉ có giảng viên mới thực hiện điểm danh"
            actionLabel="Quay lại"
            onActionPress={() => router.back()}
          />
        </ContentStack>
      </Screen>
    );
  }

  return (
    <Screen>
      <View
        style={[
          styles.headerRow,
          { paddingTop: theme.spacing.sm, paddingHorizontal: theme.spacing.lg },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={() => router.back()}
          style={styles.backHit}
        >
          <Ionicons name="chevron-back" size={26} color={theme.colors.text} />
        </Pressable>
        <Text
          style={[
            styles.headerTitle,
            { color: theme.colors.text, fontFamily: theme.fonts.semibold },
          ]}
        >
          Quét QR điểm danh
        </Text>
        <View style={styles.backHit} />
      </View>

      <ContentStack narrow overlapHero={false} style={{ marginTop: theme.spacing.sm }}>
        <View
          style={[
            styles.guideCard,
            {
              backgroundColor: theme.colors.primarySurface,
              borderColor: theme.colors.primary,
            },
          ]}
        >
          <View style={[styles.guideIcon, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="qr-code-outline" size={22} color={theme.colors.onPrimary} />
          </View>
          <Text
            style={[
              styles.guideTitle,
              { color: theme.colors.primary, fontFamily: theme.fonts.semibold },
            ]}
          >
            Hướng dẫn
          </Text>
          <Text
            style={[
              styles.guideText,
              { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
            ]}
          >
            Quét mã QR trên màn hình lớp học.
          </Text>
        </View>

        <AttendanceCtaButton
          label={hasCameraPermission ? 'Mở camera quét QR' : 'Bật quyền camera để tiếp tục'}
          onPress={handlePrimaryCta}
        />

        {hasCameraPermission ? (
          <View
            style={[
              styles.readyCard,
              {
                backgroundColor: theme.colors.surfaceSubtle,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Ionicons name="qr-code-outline" size={46} color={theme.colors.primary} />
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: theme.colors.primary }]} />
              <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.semibold }}>
                Sẵn sàng quét
              </Text>
            </View>
            <Text
              style={[
                styles.readyHint,
                { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
              ]}
            >
              Đưa mã vào camera để bắt đầu
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.permissionCard,
              {
                backgroundColor: theme.colors.dangerSurface,
                borderColor: theme.colors.danger,
              },
            ]}
          >
            <View
              style={[
                styles.permissionIconWrap,
                { backgroundColor: theme.colors.dangerSurface },
              ]}
            >
              <Ionicons name="videocam-off-outline" size={28} color={theme.colors.danger} />
            </View>
            <Text
              style={[
                styles.permissionTitle,
                { color: theme.colors.danger, fontFamily: theme.fonts.semibold },
              ]}
            >
              Chưa có quyền camera
            </Text>
            <Text
              style={[
                styles.permissionDescription,
                { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
              ]}
            >
              Vào Cài đặt {'>'} Ứng dụng {'>'} Camera để bật, sau đó quay lại đây.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mở Cài đặt ứng dụng"
              onPress={() => void Linking.openSettings()}
              style={[styles.dangerButton, { backgroundColor: theme.colors.danger }]}
            >
              <Text style={[styles.dangerButtonLabel, { fontFamily: theme.fonts.semibold }]}>
                Mở Cài đặt ứng dụng
              </Text>
            </Pressable>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Xem lịch sử điểm danh"
          onPress={() => router.push('/services/attendance/history' as never)}
          style={[
            styles.historyCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <Text
            style={[
              styles.historyTitle,
              { color: theme.colors.text, fontFamily: theme.fonts.medium },
            ]}
          >
            Lịch sử điểm danh
          </Text>
          <View style={styles.historyRight}>
            <Text style={{ color: theme.colors.textSoft, fontFamily: theme.fonts.semibold }}>
              Mở
            </Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSoft} />
          </View>
        </Pressable>
      </ContentStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backHit: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
  },
  guideCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
    opacity: 0.94,
  },
  guideIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  guideTitle: {
    fontSize: 15,
  },
  guideText: {
    fontSize: 14,
    lineHeight: 20,
  },
  readyCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    minHeight: 156,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
  },
  readyHint: {
    fontSize: 14,
    textAlign: 'center',
  },
  permissionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    alignItems: 'center',
  },
  permissionIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  permissionDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 2,
  },
  dangerButton: {
    marginTop: 4,
    alignSelf: 'stretch',
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  historyTitle: {
    fontSize: 18,
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
