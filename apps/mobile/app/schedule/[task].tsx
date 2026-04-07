import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { TaskScreen } from '@/components/tasks';
import { ContentStack, EmptyState, Screen } from '@/components/ui';
import { useScheduleScreenData } from '@/hooks/use-schedule-screen';
import { useAuthStore } from '@/stores/auth-store';
import type { ScheduleTaskKey, TaskActionDescriptor, TaskRecord } from '@/types/app-data';
import { isLecturerRole } from '@/utils/app';
import { getPermissionDeniedCopy, getScheduleTaskConfig } from '@/utils/role-ui';

export default function ScheduleTaskScreen() {
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const params = useLocalSearchParams<{ task?: string }>();
  const scheduleState = useScheduleScreenData();
  const task = params.task as ScheduleTaskKey | undefined;

  if (!task) {
    return (
      <Screen>
        <ContentStack narrow>
          <EmptyState
            title="Khong tim thay tac vu"
            description="Route nay chua co task key hop le trong schedule family."
            actionLabel="Quay lai"
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
            actionLabel="Ve lich"
            onActionPress={() => router.replace('/schedule')}
          />
        </ContentStack>
      </Screen>
    );
  }

  const config = getScheduleTaskConfig(task, scheduleState.schedule);

  if (!config) {
    return (
      <Screen>
        <ContentStack narrow>
          <EmptyState
            title="Task chua san sang"
            description="Task key nay chua duoc khai bao trong role-complete schedule flow."
            actionLabel="Ve lich"
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
      'Action nay da duoc chot giao dien va contract de backend noi mutation o pass tiep theo.',
    );
  };

  const handleRecord = (record: TaskRecord) => {
    if (record.route) {
      router.push(record.route as never);
    }
  };

  return <TaskScreen config={config} onActionPress={handleAction} onRecordPress={handleRecord} />;
}
