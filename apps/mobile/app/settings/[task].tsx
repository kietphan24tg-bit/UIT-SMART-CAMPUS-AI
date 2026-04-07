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
            title="Khong tim thay tac vu"
            description="Route nay chua co task key hop le trong settings family."
            actionLabel="Quay lai"
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
            actionLabel="Ve settings"
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
            title="Task chua san sang"
            description="Task key nay chua duoc khai bao trong settings flow."
            actionLabel="Ve settings"
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
      'UI backend-ready',
      'Action nay da duoc chot de backend noi phan role management va retention.',
    );
  };

  const handleRecord = (record: TaskRecord) => {
    if (record.route) {
      router.push(record.route as never);
    }
  };

  return <TaskScreen config={config} onActionPress={handleAction} onRecordPress={handleRecord} />;
}
