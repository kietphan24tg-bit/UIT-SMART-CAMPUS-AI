import { Stack, useRouter } from 'expo-router';

import { ContentStack, EmptyState, Screen } from '@/components/ui';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Không tìm thấy trang' }} />
      <Screen>
        <ContentStack narrow>
          <EmptyState
            title="Trang này không tồn tại"
            description="Đường dẫn bạn mở không còn hợp lệ hoặc chưa được hỗ trợ trong ứng dụng."
            actionLabel="Quay lại"
            onActionPress={() => router.replace('/home')}
          />
        </ContentStack>
      </Screen>
    </>
  );
}
