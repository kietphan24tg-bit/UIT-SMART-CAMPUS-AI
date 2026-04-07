import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { TaskScreen } from '@/components/tasks';
import { ContentStack, EmptyState, Screen } from '@/components/ui';
import { useOperationsScreenData } from '@/hooks/use-schedule-screen';
import { useAuthStore } from '@/stores/auth-store';
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
            title="Khong tim thay tac vu"
            description="Route nay chua co task key hop le trong operations family."
            actionLabel="Quay lai"
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
            actionLabel="Ve van hanh"
            onActionPress={() => router.replace('/schedule')}
          />
        </ContentStack>
      </Screen>
    );
  }

  const config = getOperationsTaskConfig(task, role, operationsState.data);

  if (!config) {
    return (
      <Screen>
        <ContentStack narrow>
          <EmptyState
            title="Task chua san sang"
            description="Task key nay chua duoc khai bao trong operations flow."
            actionLabel="Ve van hanh"
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
      'UI backend-ready',
      'Action nay da co contract ro rang de backend noi mutation tuong ung.',
    );
  };

  const handleRecord = (record: TaskRecord) => {
    if (record.route) {
      router.push(record.route as never);
    }
  };

  return <TaskScreen config={config} onActionPress={handleAction} onRecordPress={handleRecord} />;
}
