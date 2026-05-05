import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { TaskScreen } from '@/components/tasks';
import { ContentStack, EmptyState, Screen } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import type { SettingsTaskKey, TaskActionDescriptor, TaskRecord } from '@/types/app-data';
import { getPermissionDeniedCopy, getSettingsTaskConfig, isSuperAdminRole } from '@/utils/role-ui';

export default function SettingsTaskScreen() {
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const params = useLocalSearchParams<{ task?: string }>();
  const task = params.task as SettingsTaskKey | undefined;

  if (!task) {
    return (
      <Screen>
        <ContentStack narrow>
          <EmptyState
            title="Không tìm thấy tác vụ"
            description="Khóa tác vụ không hợp lệ trong nhóm cài đặt."
            actionLabel="Quay lại"
            onActionPress={() => router.back()}
          />
        </ContentStack>
      </Screen>
    );
  }

  if (!isSuperAdminRole(role)) {
    const copy = getPermissionDeniedCopy(role);

    return (
      <Screen>
        <ContentStack narrow>
          <EmptyState
            icon="lock-closed-outline"
            title={copy.title}
            description={copy.description}
            actionLabel="Về cài đặt"
            onActionPress={() => router.replace('/settings')}
          />
        </ContentStack>
      </Screen>
    );
  }

  const config = getSettingsTaskConfig(task, role);

  if (!config) {
    return (
      <Screen>
        <ContentStack narrow>
          <EmptyState
            title="Tác vụ chưa sẵn sàng"
            description="Khóa tác vụ này chưa được khai báo trong nhóm cài đặt."
            actionLabel="Về cài đặt"
            onActionPress={() => router.replace('/settings')}
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
