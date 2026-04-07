import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { ContentStack, EmptyState, PrimaryButton, Screen, SectionCard, StatusBadge, TopHero } from '@/components/ui';
import { useAlertFeed } from '@/hooks/use-alert-feed';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { formatDateTime, getRoleLabel, getSeverityLabel } from '@/utils/app';

export default function AlertDetailScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const params = useLocalSearchParams<{ id?: string; kind?: string }>();
  const alerts = useAlertFeed(role);
  const item = alerts.data.find((entry) => entry.id === params.id && entry.kind === params.kind);

  if (!item) {
    return (
      <Screen>
        <ContentStack narrow>
          <EmptyState
            icon="notifications-off-outline"
            title="Không tìm thấy cảnh báo"
            description="Mục bạn mở có thể không còn nằm trong feed hiện tại hoặc chưa được tải vào bộ nhớ."
            actionLabel="Quay lại"
            onActionPress={() => router.back()}
          />
        </ContentStack>
      </Screen>
    );
  }

  const tone = item.severity === 'critical' ? 'danger' : item.severity === 'warning' ? 'warning' : 'info';

  return (
    <Screen>
      <TopHero
        eyebrow="Alert detail"
        title={item.title}
        subtitle={item.body}
        badge={{ label: getRoleLabel(role), tone: 'info' }}
      />

      <ContentStack narrow>
        <SectionCard title="Mức độ & thời gian" subtitle="Thông tin cốt lõi cần hiển thị ngay.">
          <StatusBadge label={getSeverityLabel(item.severity)} tone={tone} />
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>
            Ghi nhận lúc {formatDateTime(item.timestamp)}
          </Text>
        </SectionCard>

        <SectionCard title="Ngữ cảnh" subtitle="Bổ sung gate/location hoặc sensor context khi có.">
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>
            {item.gateId ? `Cổng: ${item.gateId}` : 'Không có gate context cụ thể.'}
          </Text>
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>
            {item.sensorContext || 'Không có sensor context bổ sung.'}
          </Text>
        </SectionCard>

        <PrimaryButton label="Đã hiểu, quay lại" onPress={() => router.back()} />
      </ContentStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
});
