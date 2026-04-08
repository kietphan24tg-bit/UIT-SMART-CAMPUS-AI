import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { TaskScreen } from '@/components/tasks';
import { ContentStack, EmptyState, Screen } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import type { ScheduleTaskKey, TaskActionDescriptor, TaskRecord } from '@/types/app-data';
import { isLecturerRole } from '@/utils/app';
import { getPermissionDeniedCopy, getScheduleTaskConfig } from '@/utils/role-ui';

export default function ScheduleTaskScreen() {
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const params = useLocalSearchParams<{ task?: string }>();
  const task = params.task as ScheduleTaskKey | undefined;

  if (!task) {
    return (
      <Screen>
        <ContentStack narrow>
          <EmptyState
            title="Không tìm thấy tác vụ"
            description="Task key không hợp lệ trong nhóm lịch học."
            actionLabel="Quay lại"
            onActionPress={() => router.back()}
          />
        </ContentStack>
      </Screen>
    );
  }

  if (!isLecturerRole(role)) {
    const copy = getPermissionDeniedCopy(role);

    return (
      <Screen>
        <ContentStack narrow>
          <EmptyState
            icon="lock-closed-outline"
            title={copy.title}
            description={copy.description}
            actionLabel="Về lịch"
            onActionPress={() => router.replace('/schedule')}
          />
        </ContentStack>
      </Screen>
    );
  }

  const config = getScheduleTaskConfig(task);

  if (!config) {
    return (
      <Screen>
        <ContentStack narrow>
          <EmptyState
            title="Tác vụ chưa sẵn sàng"
            description="Task key này chưa được khai báo trong nhóm lịch học."
            actionLabel="Về lịch"
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
