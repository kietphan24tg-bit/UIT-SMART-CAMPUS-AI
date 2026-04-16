import { Ionicons } from '@expo/vector-icons';
import { Camera, type PermissionResponse } from 'expo-camera';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { AttendanceCtaButton } from '@/components/attendance/attendance-cta-button';
import { ContentStack, Screen } from '@/components/ui';
import { useAppTheme } from '@/theme';

export default function AttendanceHubScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const [cameraPerm, setCameraPerm] = useState<PermissionResponse | null>(null);
  const hubNavLockRef = useRef(false);
  // Dev-only: bật true để giả lập "chưa cấp quyền camera" khi test UI.
  const DEV_FORCE_CAMERA_PERMISSION_DENIED = false;

  useFocusEffect(
    useCallback(() => {
      hubNavLockRef.current = false;
      void Camera.getCameraPermissionsAsync().then(setCameraPerm);
    }, []),
  );

  const hasCameraPermission =
    !(__DEV__ && DEV_FORCE_CAMERA_PERMISSION_DENIED) && cameraPerm?.granted === true;

  const handlePrimaryCta = useCallback(() => {
    if (hubNavLockRef.current) {
      return;
    }
    if (!hasCameraPermission) {
      void Linking.openSettings();
      return;
    }
    hubNavLockRef.current = true;
    router.push('/services/attendance/scan' as never);
  }, [hasCameraPermission, router]);

  // Role guard placeholder (giữ lại trong comment theo yêu cầu):
  // if (!isStudent) {
  //   return (
  //     <Screen>
  //       <View style={[styles.headerRow, { paddingTop: theme.spacing.sm, paddingHorizontal: theme.spacing.lg }]}>
  //         <Pressable
  //           accessibilityRole="button"
  //           accessibilityLabel="Quay lại"
  //           onPress={() => router.back()}
  //           style={styles.backHit}
  //         >
  //           <Ionicons name="chevron-back" size={26} color={theme.colors.text} />
  //         </Pressable>
  //         <Text style={[styles.headerTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
  //           Điểm danh QR
  //         </Text>
  //         <View style={styles.backHit} />
  //       </View>
  //       <ContentStack narrow overlapHero={false}>
  //         <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
  //           {isLecturerRole(role)
  //             ? 'Điểm danh bằng QR hiện dành cho sinh viên. Giảng viên có thể quản lý phiên điểm danh từ lịch giảng dạy.'
  //             : 'Điểm danh bằng QR hiện dành cho sinh viên. Vui lòng đăng nhập tài khoản sinh viên để sử dụng.'}
  //         </Text>
  //         {isLecturerRole(role) ? (
  //           <AttendanceCtaButton
  //             label="Mở lịch giảng dạy"
  //             onPress={() => router.push('/schedule/attendance-session' as never)}
  //           />
  //         ) : null}
  //         <SecondaryButton label="Quay lại" onPress={() => router.back()} />
  //       </ContentStack>
  //     </Screen>
  //   );
  // }

  return (
    <Screen>
      <View style={[styles.headerRow, { paddingTop: theme.spacing.sm, paddingHorizontal: theme.spacing.lg }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={() => router.back()}
          style={styles.backHit}
        >
          <Ionicons name="chevron-back" size={26} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
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
          <Text style={[styles.guideTitle, { color: theme.colors.primary, fontFamily: theme.fonts.semibold }]}>
            Hướng dẫn
          </Text>
          <Text style={[styles.guideText, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
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
            <Text style={[styles.readyHint, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
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
            <View style={[styles.permissionIconWrap, { backgroundColor: theme.colors.dangerSurface }]}>
              <Ionicons name="videocam-off-outline" size={28} color={theme.colors.danger} />
            </View>
            <Text style={[styles.permissionTitle, { color: theme.colors.danger, fontFamily: theme.fonts.semibold }]}>
              Chưa có quyền camera
            </Text>
            <Text style={[styles.permissionDescription, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
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
          <Text style={[styles.historyTitle, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>
            Lịch sử điểm danh
          </Text>
          <View style={styles.historyRight}>
            <Text style={{ color: theme.colors.textSoft, fontFamily: theme.fonts.semibold }}>Sắp cập nhật</Text>
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
    fontSize: 30 / 2,
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
    fontSize: 30 / 2,
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
