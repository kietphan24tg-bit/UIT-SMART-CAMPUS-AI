import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { AdminUserManagementScreen } from './admin-user-management-screen';

import { NotificationComposeForm } from '@/components/notifications/notification-compose-form';
import { AdminFireAlertsTaskScreen } from '@/components/operations/admin-fire-alerts-task-screen';
import { TaskScreen } from '@/components/tasks';
import { ContentStack, EmptyState, Screen, TopHero } from '@/components/ui';
import { getUnreadFireAlertsCount, useOperationsScreenData } from '@/hooks/use-schedule-screen';
import { notificationsApi } from '@/services/api/notifications';
import type { BroadcastNotificationRequest } from '@/services/api/notifications';
import { useAuthStore } from '@/stores/auth-store';
import type { FireAlertRecord, OperationsTaskKey, TaskActionDescriptor, TaskRecord, UserRole } from '@/types/app-data';
import { isAdminRole } from '@/utils/app';
import { getLocalizedErrorMessage } from '@/utils/error-message';
import { getOperationsTaskConfig, getPermissionDeniedCopy } from '@/utils/role-ui';

export default function OperationsTaskScreen() {
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const params = useLocalSearchParams<{ task?: string }>();
  const operationsState = useOperationsScreenData(role);
  const task = params.task as OperationsTaskKey | undefined;

  if (!task) {
    return (
      <Screen>
        <ContentStack narrow>
          <EmptyState
            title="Không tìm thấy tác vụ"
            description="Khóa tác vụ không hợp lệ trong nhóm vận hành."
            actionLabel="Quay lại"
            onActionPress={() => router.back()}
          />
        </ContentStack>
      </Screen>
    );
  }

  if (!isAdminRole(role)) {
    const copy = getPermissionDeniedCopy(role);

    return (
      <Screen>
        <ContentStack narrow>
          <EmptyState
            icon="lock-closed-outline"
            title={copy.title}
            description={copy.description}
            actionLabel="Về vận hành"
            onActionPress={() => router.replace('/schedule')}
          />
        </ContentStack>
      </Screen>
    );
  }

  if (task === 'notifications') {
    return <AdminNotificationBroadcastScreen role={role} />;
  }

  if (task === 'users') {
    return <AdminUserManagementScreen />;
  }

  if (task === 'fire-alerts') {
    const fireAlerts = operationsState.data?.fireAlerts.items ?? [];
    const totalFireAlerts = operationsState.data?.fireAlerts.meta.total ?? fireAlerts.length;
    const unreadFireAlerts = getUnreadFireAlertsCount(operationsState.data?.fireAlerts);
    const isMutatingFireAlerts = operationsState.isMutatingFireAlerts ?? false;
    const handleDeleteFireAlert = (item: FireAlertRecord) => {
      if (isMutatingFireAlerts) {
        return;
      }

      Alert.alert(
        'Xóa cảnh báo',
        'Cảnh báo này sẽ bị xóa khỏi danh sách vận hành. Dữ liệu telemetry gốc vẫn được giữ.',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xóa',
            style: 'destructive',
            onPress: () => {
              void operationsState.deleteFireAlert(item.id).catch((error) => {
                Alert.alert(
                  'Không xóa được cảnh báo',
                  getLocalizedErrorMessage(error, 'Vui lòng thử lại sau.'),
                );
              });
            },
          },
        ],
      );
    };

    const handleDeleteAllFireAlerts = () => {
      if (isMutatingFireAlerts || totalFireAlerts === 0) {
        return;
      }

      Alert.alert(
        'Xóa tất cả cảnh báo',
        `Xóa ${totalFireAlerts} cảnh báo khỏi danh sách vận hành? Dữ liệu telemetry gốc vẫn được giữ.`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xóa tất cả',
            style: 'destructive',
            onPress: () => {
              void operationsState.deleteFireAlerts().catch((error) => {
                Alert.alert(
                  'Không xóa được cảnh báo',
                  getLocalizedErrorMessage(error, 'Vui lòng thử lại sau.'),
                );
              });
            },
          },
        ],
      );
    };

    return (
      <AdminFireAlertsTaskScreen
        fireAlerts={fireAlerts}
        totalFireAlerts={totalFireAlerts}
        unreadFireAlerts={unreadFireAlerts}
        isMutating={isMutatingFireAlerts}
        isRefetching={operationsState.isRefetching}
        onRefresh={() => void operationsState.refetch()}
        onDeleteAlert={handleDeleteFireAlert}
        onDeleteAll={handleDeleteAllFireAlerts}
        onOpenAlert={(item) =>
          router.push({
            pathname: '/alerts/[id]',
            params: { id: item.id, kind: 'fire_alert' },
          } as never)
        }
        onOpenAlertCenter={() => router.push('/operations/alerts')}
      />
    );
  }

  const config = getOperationsTaskConfig(task, role, operationsState.data);

  if (!config) {
    return (
      <Screen>
        <ContentStack narrow>
          <EmptyState
            title="Tác vụ chưa sẵn sàng"
            description="Khóa tác vụ này chưa được khai báo trong nhóm vận hành."
            actionLabel="Về vận hành"
            onActionPress={() => router.replace('/schedule')}
          />
        </ContentStack>
      </Screen>
    );
  }

  const handleAction = (action: TaskActionDescriptor) => {
    if (action.route) {
      router.push(action.route as never);
      return;
    }

    Alert.alert(
      'Chưa hỗ trợ thao tác',
      'Tính năng này đang ở trạng thái sắp triển khai trên mobile.',
    );
  };

  const handleRecord = (record: TaskRecord) => {
    if (record.route) {
      router.push(record.route as never);
    }
  };

  return <TaskScreen config={config} onActionPress={handleAction} onRecordPress={handleRecord} />;
}

function AdminNotificationBroadcastScreen({ role }: { role?: string | null }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload: BroadcastNotificationRequest) => notificationsApi.broadcast(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-feed'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', role] });
      queryClient.invalidateQueries({ queryKey: ['operations-summary', role] });
    },
  });

  const handleSubmit = async (payload: BroadcastNotificationRequest) => {
    try {
      return await mutation.mutateAsync(payload);
    } catch (error) {
      Alert.alert('Không gửi được thông báo', getErrorMessage(error));
      return undefined;
    }
  };

  return (
    <Screen>
      <TopHero
        eyebrow="Vận hành"
        title="Thông báo diện rộng"
        subtitle="Gửi thông báo trong ứng dụng và thông báo đẩy cho toàn trường hoặc theo vai trò."
        badge={{ label: 'Admin', tone: 'info' }}
        variant="accent"
      />
      <ContentStack narrow>
        <NotificationComposeForm
          mode="admin"
          currentUserRole={(role as UserRole | null) ?? null}
          loading={mutation.isPending}
          onSubmit={handleSubmit}
        />
      </ContentStack>
    </Screen>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Vui lòng thử lại sau.';
}
