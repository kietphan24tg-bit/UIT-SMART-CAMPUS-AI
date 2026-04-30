import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { NotificationComposeForm } from '@/components/notifications/notification-compose-form';
import { TaskScreen } from '@/components/tasks';
import { ContentStack, EmptyState, Screen, TopHero } from '@/components/ui';
import { useOperationsScreenData } from '@/hooks/use-schedule-screen';
import { notificationsApi } from '@/services/api/notifications';
import { useAuthStore } from '@/stores/auth-store';
import type { BroadcastNotificationRequest } from '@/services/api/notifications';
import type { OperationsTaskKey, TaskActionDescriptor, TaskRecord } from '@/types/app-data';
import { isAdminRole } from '@/utils/app';
import { getOperationsTaskConfig, getPermissionDeniedCopy } from '@/utils/role-ui';

export default function OperationsTaskScreen() {
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const params = useLocalSearchParams<{ task?: string }>();
  const operationsState = useOperationsScreenData();
  const task = params.task as OperationsTaskKey | undefined;

  if (!task) {
    return (
      <Screen>
        <ContentStack narrow>
          <EmptyState
            title="Không tìm thấy tác vụ"
            description="Task key không hợp lệ trong nhóm vận hành."
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

  const config = getOperationsTaskConfig(task, role, operationsState.data);

  if (!config) {
    return (
      <Screen>
        <ContentStack narrow>
          <EmptyState
            title="Tác vụ chưa sẵn sàng"
            description="Task key này chưa được khai báo trong nhóm vận hành."
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
        title="Broadcast thông báo"
        subtitle="Gửi thông báo in-app và push notification cho toàn trường hoặc theo vai trò."
        badge={{ label: 'Admin', tone: 'info' }}
        variant="accent"
      />
      <ContentStack narrow>
        <NotificationComposeForm
          mode="admin"
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
