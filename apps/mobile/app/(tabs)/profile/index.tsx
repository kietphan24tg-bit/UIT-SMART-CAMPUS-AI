import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ContentStack,
  EmptyState,
  Screen,
  SectionCard,
  StatusBadge,
  TopHero,
} from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import {
  getGreetingName,
  getRoleLabel,
  isAdminRole,
  isLecturerRole,
  isSuperAdminRole,
} from '@/utils/app';

export default function ProfileScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <Screen>
      <TopHero
        eyebrow="Hồ sơ"
        title={getGreetingName(user)}
        subtitle="Tài khoản, quyền hiện tại và lối vào hỗ trợ."
        badge={{ label: getRoleLabel(user?.role), tone: 'info' }}
        showBrand
      />

      <ContentStack gap={16} overlapHero={false}>
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              ...theme.elevation.level1,
            },
          ]}
        >
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: theme.colors.primarySurface,
              },
            ]}
          >
            <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
              {user?.lastName?.charAt(0) ?? 'U'}
            </Text>
          </View>
          <Text
            style={[
              styles.name,
              { color: theme.colors.text, fontFamily: theme.fonts.bold },
            ]}
          >
            {getGreetingName(user)}
          </Text>
          <Text style={[styles.meta, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
            {user?.studentId || 'Chưa có mã định danh'} · {user?.email || 'Chưa có email'}
          </Text>
          {user ? <StatusBadge label={getRoleLabel(user.role)} tone="info" /> : null}
        </View>

        <SectionCard title="Lối vào theo vai trò" subtitle="Chỉ hiển thị đúng công cụ theo quyền hiện tại.">
          <View style={styles.linkGroup}>
            {isLecturerRole(user?.role) ? (
              <ProfileLink
                icon="school-outline"
                label="Lịch dạy"
                description="Mở lịch và công cụ lớp học."
                onPress={() => router.push('/schedule')}
              />
            ) : null}
            {isAdminRole(user?.role) ? (
              <ProfileLink
                icon="pulse-outline"
                label="Vận hành campus"
                description="Theo dõi parking, telemetry và cảnh báo."
                onPress={() => router.push('/schedule')}
              />
            ) : null}
            {isSuperAdminRole(user?.role) ? (
              <ProfileLink
                icon="settings-outline"
                label="Thiết lập hệ thống"
                description="Đi tới phạm vi thiết lập được cấp."
                onPress={() => router.push('/settings/system-controls')}
              />
            ) : null}
          </View>
        </SectionCard>

        <SectionCard title="Tài khoản và hỗ trợ" subtitle="Các lối vào chính cho mọi người dùng.">
          <View style={styles.linkGroup}>
            <ProfileLink
              icon="settings-outline"
              label="Cài đặt"
              description="Quản lý tài khoản và hỗ trợ."
              onPress={() => router.push('/settings')}
            />
            <ProfileLink
              icon="shield-checkmark-outline"
              label="Quyền riêng tư"
              description="Điều khoản, chính sách và quyền truy cập."
              onPress={() => router.push('/legal')}
            />
            <ProfileLink
              icon="trash-outline"
              label="Xóa tài khoản"
              description="Xem lưu ý trước khi gửi yêu cầu."
              onPress={() => router.push('/account/delete')}
            />
          </View>
        </SectionCard>

        <SectionCard title="Thông tin ứng dụng" subtitle="Tóm tắt sản phẩm và phiên bản hiện tại.">
          {user ? (
            <View style={styles.linkGroup}>
              <Text style={[styles.metaLeft, { color: theme.colors.textMuted }]}>
                UIT Smart Campus tập trung vào xác thực, lịch học, thông báo và parking.
              </Text>
              <Text style={[styles.metaLeft, { color: theme.colors.textMuted }]}>
                Phiên bản ứng dụng: 0.1.0
              </Text>
            </View>
          ) : (
            <EmptyState
              icon="person-outline"
              title="Chưa có dữ liệu hồ sơ"
              description="Ứng dụng sẽ đưa bạn về màn đăng nhập nếu phiên làm việc hết hạn."
            />
          )}
        </SectionCard>

        <Pressable
          onPress={() => void logout()}
          style={[
            styles.logoutButton,
            {
              backgroundColor: theme.colors.dangerSurface,
              borderColor: theme.colors.danger,
            },
          ]}
        >
          <Ionicons name="log-out-outline" size={20} color={theme.colors.danger} />
          <Text style={[styles.logoutText, { color: theme.colors.danger }]}>Đăng xuất</Text>
        </Pressable>
      </ContentStack>
    </Screen>
  );
}

function ProfileLink({
  icon,
  label,
  description,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.profileLink,
        {
          backgroundColor: theme.colors.surfaceSubtle,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: theme.colors.primarySurface,
          },
        ]}
      >
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.linkLabel, { color: theme.colors.text }]}>{label}</Text>
        <Text style={[styles.linkDescription, { color: theme.colors.textMuted }]}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textSoft} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    padding: 20,
    gap: 10,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 30,
  },
  name: {
    fontSize: 22,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  metaLeft: {
    fontSize: 13,
    lineHeight: 18,
  },
  linkGroup: {
    gap: 10,
  },
  profileLink: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkLabel: {
    fontSize: 15,
  },
  linkDescription: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
  },
  logoutButton: {
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexDirection: 'row',
  },
  logoutText: {
    fontSize: 15,
  },
});
