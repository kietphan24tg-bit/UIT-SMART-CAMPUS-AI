import { Ionicons } from '@expo/vector-icons';
import {
  ACTIVE_USER_ROLES,
  formatFullName,
  isLegacyUserRole,
  USER_ROLES,
  type ActiveUserRole,
  type AdminUserListItem,
} from '@smart-campus/shared';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  EmptyState,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionCard,
  SkeletonBlock,
  StatusBadge,
  TopHero,
} from '@/components/ui';
import { usersApi } from '@/services/api';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { getRoleLabel } from '@/utils/app';

const ACTIVE_ROLE_LABELS: Record<ActiveUserRole, string> = {
  [USER_ROLES.STUDENT]: 'Sinh viên',
  [USER_ROLES.LECTURER]: 'Giảng viên',
  [USER_ROLES.ADMIN]: 'Admin',
};

const USERS_PAGE_LIMIT = 25;

export function AdminUserManagementScreen() {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const currentRole = useAuthStore((state) => state.user?.role ?? null);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  const usersQuery = useInfiniteQuery({
    queryKey: ['admin-users', debouncedSearch],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      usersApi.listUsers({
        page: pageParam,
        limit: USERS_PAGE_LIMIT,
        search: debouncedSearch || undefined,
      }),
    getNextPageParam: (lastPage) => {
      const meta = lastPage?.meta;
      if (!meta) {
        return undefined;
      }

      return meta.page < meta.totalPages ? meta.page + 1 : undefined;
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: ActiveUserRole }) =>
      usersApi.updateRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', currentRole] });
    },
  });

  const activeMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      usersApi.updateActive(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', currentRole] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) => usersApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', currentRole] });
    },
  });

  const users = useMemo(
    () => usersQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [usersQuery.data],
  );
  const totalUsers = usersQuery.data?.pages[0]?.meta.total ?? 0;
  const isInitialLoading = usersQuery.isLoading && users.length === 0;

  const handleRoleChange = (user: AdminUserListItem, nextRole: ActiveUserRole) => {
    if (user.role === nextRole || user.id === currentUserId || roleMutation.isPending) {
      return;
    }

    Alert.alert(
      'Cập nhật vai trò',
      `Chuyển ${formatUserName(user)} sang ${ACTIVE_ROLE_LABELS[nextRole]}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Cập nhật',
          onPress: () => {
            void roleMutation.mutateAsync({ userId: user.id, role: nextRole }).catch((error) => {
              Alert.alert('Không cập nhật được vai trò', getErrorMessage(error));
            });
          },
        },
      ],
    );
  };

  const handleActiveChange = (user: AdminUserListItem, nextIsActive: boolean) => {
    if (user.isActive === nextIsActive || user.id === currentUserId || activeMutation.isPending) {
      return;
    }

    Alert.alert(
      nextIsActive ? 'Kích hoạt tài khoản' : 'Tạm khóa tài khoản',
      nextIsActive
        ? `Cho phép ${formatUserName(user)} đăng nhập lại?`
        : `Tạm khóa đăng nhập của ${formatUserName(user)}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: nextIsActive ? 'Kích hoạt' : 'Tạm khóa',
          style: nextIsActive ? 'default' : 'destructive',
          onPress: () => {
            void activeMutation
              .mutateAsync({ userId: user.id, isActive: nextIsActive })
              .catch((error) => {
                Alert.alert('Không cập nhật được trạng thái', getErrorMessage(error));
              });
          },
        },
      ],
    );
  };

  const handleDeleteUser = (user: AdminUserListItem) => {
    if (user.id === currentUserId || deleteMutation.isPending) {
      return;
    }

    Alert.alert(
      'Xóa tài khoản',
      `Xóa vĩnh viễn tài khoản của ${formatUserName(user)}? Dữ liệu gắn với tài khoản này sẽ bị gỡ khỏi hệ thống.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            void deleteMutation.mutateAsync({ userId: user.id }).catch((error) => {
              Alert.alert('Không xóa được tài khoản', getErrorMessage(error));
            });
          },
        },
      ],
    );
  };

  return (
    <Screen scroll={false}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={usersQuery.isRefetching}
            onRefresh={() => void usersQuery.refetch()}
            tintColor={theme.colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerStack}>
            <TopHero
              eyebrow="Vận hành"
              title="Tài khoản người dùng"
              subtitle="Quản lý vai trò, trạng thái đăng nhập và xóa tài khoản người dùng."
              badge={{ label: 'Admin', tone: 'info' }}
              variant="accent"
            />

            <SectionCard
              title="Tìm kiếm tài khoản"
              subtitle={
                totalUsers > 0
                  ? `${totalUsers} tài khoản trong hệ thống`
                  : 'Nhập tên, email hoặc MSSV'
              }
              variant="highlight"
              tone="academic"
            >
              <TextInput
                value={searchInput}
                onChangeText={setSearchInput}
                placeholder="Tìm theo tên, email, MSSV"
                placeholderTextColor={theme.colors.textSoft}
                style={[
                  styles.searchInput,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surfaceElevated,
                    fontFamily: theme.fonts.medium,
                  },
                ]}
              />
            </SectionCard>
          </View>
        }
        renderItem={({ item }) => {
          const isCurrentUser = item.id === currentUserId;
          const roleUpdating = roleMutation.isPending && roleMutation.variables?.userId === item.id;
          const activeUpdating =
            activeMutation.isPending && activeMutation.variables?.userId === item.id;
          const deleteUpdating =
            deleteMutation.isPending && deleteMutation.variables?.userId === item.id;

          return (
            <AdminUserCard
              user={item}
              isCurrentUser={isCurrentUser}
              isRoleUpdating={roleUpdating}
              isActiveUpdating={activeUpdating}
              isDeleteUpdating={deleteUpdating}
              onRoleChange={handleRoleChange}
              onActiveChange={handleActiveChange}
              onDeleteUser={handleDeleteUser}
            />
          );
        }}
        ListEmptyComponent={
          isInitialLoading ? (
            <View style={styles.loadingStack}>
              <SkeletonBlock height={212} />
              <SkeletonBlock height={212} />
              <SkeletonBlock height={212} />
            </View>
          ) : usersQuery.isError ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="Không tải được danh sách tài khoản"
              description="Vui lòng kiểm tra kết nối và thử lại."
              actionLabel="Thử lại"
              onActionPress={() => void usersQuery.refetch()}
            />
          ) : (
            <EmptyState
              icon={debouncedSearch ? 'search-outline' : 'people-outline'}
              title={debouncedSearch ? 'Không tìm thấy tài khoản phù hợp' : 'Chưa có tài khoản'}
              description={
                debouncedSearch
                  ? 'Thử tìm theo tên, email hoặc MSSV khác.'
                  : 'Danh sách người dùng sẽ hiển thị khi hệ thống có dữ liệu.'
              }
            />
          )
        }
        onEndReached={() => {
          if (usersQuery.hasNextPage && !usersQuery.isFetchingNextPage) {
            void usersQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.35}
        ListFooterComponent={
          usersQuery.isFetchingNextPage ? (
            <View style={styles.loadingStack}>
              <SkeletonBlock height={180} />
            </View>
          ) : (
            <View style={styles.bottomSpacer} />
          )
        }
      />
    </Screen>
  );
}

function AdminUserCard({
  user,
  isCurrentUser,
  isRoleUpdating,
  isActiveUpdating,
  isDeleteUpdating,
  onRoleChange,
  onActiveChange,
  onDeleteUser,
}: {
  user: AdminUserListItem;
  isCurrentUser: boolean;
  isRoleUpdating: boolean;
  isActiveUpdating: boolean;
  isDeleteUpdating: boolean;
  onRoleChange: (user: AdminUserListItem, nextRole: ActiveUserRole) => void;
  onActiveChange: (user: AdminUserListItem, nextIsActive: boolean) => void;
  onDeleteUser: (user: AdminUserListItem) => void;
}) {
  const theme = useAppTheme();
  const isActionLocked = isRoleUpdating || isActiveUpdating || isDeleteUpdating;
  const deleteDisabled = isCurrentUser || isRoleUpdating || isActiveUpdating;

  return (
    <SectionCard
      title={formatUserName(user)}
      subtitle={user.email}
      variant="outlined"
      headerAccessory={
        <View style={styles.badgeRow}>
          <StatusBadge
            label={user.isActive ? 'Đang hoạt động' : 'Đã khóa'}
            tone={user.isActive ? 'success' : 'warning'}
            size="sm"
          />
          <StatusBadge label={getRoleLabel(user.role)} tone="info" size="sm" />
          {isLegacyUserRole(user.role) ? (
            <StatusBadge label="legacy" tone="warning" size="sm" />
          ) : null}
          {isCurrentUser ? <StatusBadge label="Bạn" tone="primary" size="sm" /> : null}
        </View>
      }
    >
      <View style={styles.cardStack}>
        <View style={styles.infoGrid}>
          <InfoLine label="Mã" value={user.studentId || '--'} />
          <InfoLine label="Khoa" value={user.faculty || '--'} />
          <InfoLine label="Ngành" value={user.major || '--'} />
        </View>

        <View style={styles.controlBlock}>
          <Text
            style={[
              styles.sectionLabel,
              { color: theme.colors.text, fontFamily: theme.fonts.semibold },
            ]}
          >
            Vai trò
          </Text>
          <View style={styles.chipRow}>
            {ACTIVE_USER_ROLES.map((role) => {
              const active = user.role === role;
              const disabled = isCurrentUser || isActionLocked;

              return (
                <Pressable
                  key={`${user.id}-${role}`}
                  accessibilityRole="button"
                  disabled={disabled}
                  onPress={() => onRoleChange(user, role)}
                  style={[
                    styles.choiceChip,
                    {
                      backgroundColor: active
                        ? theme.colors.primarySurface
                        : theme.colors.surfaceSubtle,
                      borderColor: active ? theme.colors.primary : theme.colors.border,
                      opacity: disabled ? 0.6 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceChipLabel,
                      {
                        color: active ? theme.colors.primary : theme.colors.textMuted,
                        fontFamily: theme.fonts.semibold,
                      },
                    ]}
                  >
                    {ACTIVE_ROLE_LABELS[role]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.controlBlock}>
          <Text
            style={[
              styles.sectionLabel,
              { color: theme.colors.text, fontFamily: theme.fonts.semibold },
            ]}
          >
            Trạng thái đăng nhập
          </Text>
          <PrimaryButton
            label={user.isActive ? 'Tạm khóa tài khoản' : 'Kích hoạt tài khoản'}
            disabled={isCurrentUser || isDeleteUpdating || isRoleUpdating}
            loading={isActiveUpdating}
            onPress={() => onActiveChange(user, !user.isActive)}
          />
          {isCurrentUser ? (
            <Text
              style={[
                styles.helperText,
                { color: theme.colors.textSoft, fontFamily: theme.fonts.regular },
              ]}
            >
              Tài khoản đang đăng nhập không thể tự đổi vai trò, tự khóa hoặc tự xóa.
            </Text>
          ) : null}
        </View>

        <View style={styles.controlBlock}>
          <Text
            style={[
              styles.sectionLabel,
              { color: theme.colors.text, fontFamily: theme.fonts.semibold },
            ]}
          >
            Xóa tài khoản
          </Text>
          <SecondaryButton
            label="Xóa tài khoản"
            disabled={deleteDisabled}
            loading={isDeleteUpdating}
            onPress={() => onDeleteUser(user)}
            icon={<Ionicons name="trash-outline" size={18} color={theme.colors.danger} />}
            style={{
              backgroundColor: deleteDisabled
                ? theme.colors.surfaceTinted
                : theme.colors.dangerSurface,
              borderColor: deleteDisabled ? theme.colors.inputBorder : theme.colors.danger,
            }}
            labelStyle={{ color: theme.colors.danger }}
          />
          <Text
            style={[
              styles.helperText,
              styles.deleteHelperText,
              { color: theme.colors.danger, fontFamily: theme.fonts.regular },
            ]}
          >
            Hành động này sẽ xóa vĩnh viễn tài khoản và dữ liệu
          </Text>
        </View>
      </View>
    </SectionCard>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();

  return (
    <View style={styles.infoLine}>
      <Text
        style={[styles.infoLabel, { color: theme.colors.textSoft, fontFamily: theme.fonts.medium }]}
      >
        {label}
      </Text>
      <Text
        style={[styles.infoValue, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}
      >
        {value}
      </Text>
    </View>
  );
}

function formatUserName(user: AdminUserListItem) {
  return formatFullName(user.firstName, user.lastName) || user.email;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Vui lòng thử lại sau.';
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 24,
  },
  headerStack: {
    gap: 16,
    marginBottom: 16,
  },
  separator: {
    height: 12,
  },
  searchInput: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  loadingStack: {
    gap: 12,
    paddingHorizontal: 24,
  },
  bottomSpacer: {
    height: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardStack: {
    gap: 16,
  },
  infoGrid: {
    gap: 10,
  },
  infoLine: {
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  infoValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  controlBlock: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceChip: {
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  choiceChipLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 18,
  },
  deleteHelperText: {
    paddingHorizontal: 12,
    textAlign: 'center',
  },
});
