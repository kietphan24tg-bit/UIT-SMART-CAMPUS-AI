import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { NotificationComposeForm } from '@/components/notifications/notification-compose-form';
import { TaskScreen } from '@/components/tasks';
import { ContentStack, EmptyState, Screen, TopHero } from '@/components/ui';
import { attendanceApi } from '@/services/api/attendance';
import { notificationsApi } from '@/services/api/notifications';
import { useAuthStore } from '@/stores/auth-store';
import type { BroadcastNotificationRequest } from '@/services/api/notifications';
import type { UserRole } from '@/types/app-data';
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
            description="Khóa tác vụ không hợp lệ trong nhóm lịch học."
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

  if (task === 'class-notification') {
    return <LecturerClassNotificationScreen role={role} />;
  }

  const config = getScheduleTaskConfig(task);

  if (!config) {
    return (
      <Screen>
        <ContentStack narrow>
          <EmptyState
            title="Tác vụ chưa sẵn sàng"
            description="Khóa tác vụ này chưa được khai báo trong nhóm lịch học."
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

function LecturerClassNotificationScreen({ role }: { role?: string | null }) {
  const queryClient = useQueryClient();
  const classesQuery = useQuery({
    queryKey: ['attendance', 'lecturer-class-sections'],
    queryFn: attendanceApi.getLecturerClassSections,
  });
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
      Alert.alert('Không gửi được thông báo lớp', getErrorMessage(error));
      return undefined;
    }
  };

  return (
    <Screen>
      <TopHero
        eyebrow="Thông báo lớp"
        title="Soạn thông báo lớp"
        subtitle="Gửi cập nhật học vụ tới sinh viên đang đăng ký trong lớp bạn phụ trách."
        badge={{ label: 'Lecturer', tone: 'info' }}
        variant="accent"
      />
      <ContentStack narrow>
        {classesQuery.isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Không tải được danh sách lớp"
            description="Làm mới dữ liệu để chọn lớp nhận thông báo."
            actionLabel="Thử lại"
            onActionPress={() => void classesQuery.refetch()}
          />
        ) : null}
        <NotificationComposeForm
          mode="class"
          classSections={classesQuery.data ?? []}
          currentUserRole={(role as UserRole | null) ?? null}
          classesLoading={classesQuery.isLoading}
          loading={mutation.isPending}
          onRefreshClasses={() => void classesQuery.refetch()}
          onSubmit={handleSubmit}
        />
      </ContentStack>
    </Screen>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Vui lòng thử lại sau.';
}
