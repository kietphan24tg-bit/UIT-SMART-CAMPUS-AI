import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemePreferenceControl } from '@/components/preferences/theme-preference-control';
import {
  ContentStack,
  EmptyState,
  InfoRow,
  Screen,
  SectionCard,
  StatusBadge,
  TopHero,
} from '@/components/ui';
import { usersApi } from '@/services/api';
import { useAuthStore } from '@/stores/auth-store';
import {
  type ThemePreference,
  useAppTheme,
  useSetThemePreference,
  useThemePreference,
} from '@/theme';
import {
  getGreetingName,
  getRoleLabel,
  isAdminRole,
  isLecturerRole,
  isSuperAdminRole,
} from '@/utils/app';

function resolveMimeType(mimeType?: string | null) {
  if (mimeType === 'image/png' || mimeType === 'image/webp') {
    return mimeType;
  }

  return 'image/jpeg';
}

function resolveFileName(fileName?: string | null, mimeType?: string | null) {
  if (fileName) {
    return fileName;
  }

  const extension =
    mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';

  return `avatar.${extension}`;
}

function resolveAvatarErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object') {
    return 'Không thể cập nhật ảnh đại diện.';
  }

  const maybeError = error as {
    message?: unknown;
    error?: { message?: unknown } | unknown;
  };

  if (typeof maybeError.message === 'string' && maybeError.message.trim()) {
    return maybeError.message;
  }

  if (
    maybeError.error &&
    typeof maybeError.error === 'object' &&
    'message' in maybeError.error &&
    typeof maybeError.error.message === 'string' &&
    maybeError.error.message.trim()
  ) {
    return maybeError.error.message;
  }

  return 'Không thể cập nhật ảnh đại diện.';
}

export default function ProfileScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const setUser = useAuthStore((state) => state.setUser);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const themePreference = useThemePreference();
  const setThemePreference = useSetThemePreference();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleThemeChange = async (nextPreference: ThemePreference) => {
    await setThemePreference(nextPreference);
  };

  const handleAvatarPick = async () => {
    try {
      setAvatarError(null);

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Cần quyền truy cập', 'Hãy cho phép ứng dụng truy cập thư viện ảnh.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        selectionLimit: 1,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      setIsUploadingAvatar(true);

      const processedAsset = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1024, height: 1024 } }],
        {
          compress: 0.82,
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );

      const updatedUser = await usersApi.uploadAvatar(
        processedAsset.uri,
        resolveFileName(asset.fileName, 'image/jpeg'),
        resolveMimeType('image/jpeg'),
      );

      if (user) {
        setUser({
          ...user,
          avatarUrl: updatedUser.avatarUrl,
          phone: updatedUser.phone,
          address: updatedUser.address,
        });
      }

      await refreshProfile();
    } catch (error) {
      setAvatarError(resolveAvatarErrorMessage(error));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <Screen>
      <TopHero
        eyebrow="Cá nhân"
        title={getGreetingName(user)}
        subtitle="Tài khoản và giao diện."
        badge={{ label: getRoleLabel(user?.role), tone: 'info' }}
        showBrand
      />

      <ContentStack gap={16} overlapHero={false}>
        <SectionCard title="Hồ sơ" subtitle="Thông tin chính" variant="elevated">
          {user ? (
            <View style={styles.sectionStack}>
              <View
                style={[
                  styles.profileCard,
                  {
                    backgroundColor: theme.colors.surfaceSubtle,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Đổi ảnh đại diện"
                  onPress={() => void handleAvatarPick()}
                  style={[
                    styles.avatarButton,
                    {
                      backgroundColor: theme.colors.primarySurface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  {user.avatarUrl ? (
                    <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} contentFit="cover" />
                  ) : (
                    <Text
                      style={[
                        styles.avatarText,
                        { color: theme.colors.primary, fontFamily: theme.fonts.bold },
                      ]}
                    >
                      {user.lastName?.charAt(0)?.toUpperCase() ?? 'U'}
                    </Text>
                  )}

                  <View
                    style={[
                      styles.avatarAction,
                      {
                        backgroundColor: theme.colors.glassStrong,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    {isUploadingAvatar ? (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                      <Ionicons name="camera-outline" size={16} color={theme.colors.primary} />
                    )}
                  </View>
                </Pressable>

                <View style={styles.profileMeta}>
                  <Text style={[styles.name, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>
                    {getGreetingName(user)}
                  </Text>
                  <Text
                    style={[
                      styles.secondaryMeta,
                      { color: theme.colors.textMuted, fontFamily: theme.fonts.medium },
                    ]}
                  >
                    {user.studentId || 'Chưa có mã định danh'}
                  </Text>
                  <StatusBadge label={getRoleLabel(user.role)} tone="info" />
                </View>
              </View>

              <InfoRow label="Email" value={user.email || '--'} />
              <InfoRow label="Mã định danh" value={user.studentId || '--'} />

              <Text
                style={[
                  styles.inlineMessage,
                  {
                    color: avatarError ? theme.colors.danger : theme.colors.textSoft,
                    fontFamily: avatarError ? theme.fonts.medium : theme.fonts.regular,
                  },
                ]}
              >
                {avatarError || 'Ảnh đại diện được lưu vào tài khoản.'}
              </Text>
            </View>
          ) : (
            <EmptyState
              icon="person-outline"
              title="Chưa có dữ liệu"
              description="Vui lòng đăng nhập lại."
            />
          )}
        </SectionCard>

        <SectionCard title="Giao diện" subtitle="Lưu trên thiết bị này" variant="subtle">
          <View style={styles.sectionStack}>
            <ThemePreferenceControl value={themePreference} onChange={handleThemeChange} />
            <Text
              style={[
                styles.inlineMessage,
                { color: theme.colors.textSoft, fontFamily: theme.fonts.regular },
              ]}
            >
              Áp dụng ngay cho light mode và dark mode.
            </Text>
          </View>
        </SectionCard>

        <SectionCard title="Lối tắt" subtitle="Theo vai trò" variant="outlined">
          <View style={styles.linkGroup}>
            {isLecturerRole(user?.role) ? (
              <ProfileLink
                icon="school-outline"
                label="Lịch dạy"
                meta="Giảng dạy"
                onPress={() => router.push('/schedule')}
              />
            ) : null}
            {isAdminRole(user?.role) ? (
              <ProfileLink
                icon="pulse-outline"
                label="Vận hành campus"
                meta="Giám sát"
                onPress={() => router.push('/schedule')}
              />
            ) : null}
            {isSuperAdminRole(user?.role) ? (
              <ProfileLink
                icon="settings-outline"
                label="Hệ thống"
                meta="Quản trị"
                onPress={() => router.push('/settings/system-controls')}
              />
            ) : null}
            <ProfileLink
              icon="settings-outline"
              label="Cài đặt"
              meta="Tài khoản"
              onPress={() => router.push('/settings')}
            />
            <ProfileLink
              icon="shield-checkmark-outline"
              label="Quyền riêng tư"
              meta="Điều khoản"
              onPress={() => router.push('/legal')}
            />
            <ProfileLink
              icon="trash-outline"
              label="Xóa tài khoản"
              meta="Yêu cầu"
              onPress={() => router.push('/account/delete')}
            />
          </View>
        </SectionCard>

        <Pressable
          accessibilityRole="button"
          onPress={() => void handleLogout()}
          style={[
            styles.logoutButton,
            {
              backgroundColor: theme.colors.dangerSurface,
              borderColor: theme.colors.danger,
            },
          ]}
        >
          <Ionicons name="log-out-outline" size={20} color={theme.colors.danger} />
          <Text style={[styles.logoutText, { color: theme.colors.danger, fontFamily: theme.fonts.bold }]}>
            Đăng xuất
          </Text>
        </Pressable>
      </ContentStack>
    </Screen>
  );
}

function ProfileLink({
  icon,
  label,
  meta,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  meta: string;
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
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.primarySurface }]}>
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <View style={styles.linkCopy}>
        <Text style={[styles.linkLabel, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
          {label}
        </Text>
        <Text style={[styles.linkMeta, { color: theme.colors.textSoft, fontFamily: theme.fonts.medium }]}>
          {meta}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textSoft} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionStack: {
    gap: 12,
  },
  profileCard: {
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
  },
  avatarButton: {
    width: 92,
    height: 92,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 32,
  },
  avatarAction: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileMeta: {
    flex: 1,
    gap: 8,
  },
  name: {
    fontSize: 22,
  },
  secondaryMeta: {
    fontSize: 13,
  },
  inlineMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  linkGroup: {
    gap: 10,
  },
  profileLink: {
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkCopy: {
    flex: 1,
    gap: 2,
  },
  linkLabel: {
    fontSize: 15,
  },
  linkMeta: {
    fontSize: 12,
  },
  logoutButton: {
    minHeight: 56,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  logoutText: {
    fontSize: 15,
  },
});

