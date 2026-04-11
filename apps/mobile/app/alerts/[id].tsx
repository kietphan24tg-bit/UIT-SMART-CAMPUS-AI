import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import {
  ContentStack,
  EmptyState,
  InfoRow,
  PrimaryButton,
  Screen,
  SectionCard,
  StatusBadge,
  TopHero,
} from '@/components/ui';
import { useAlertFeed } from '@/hooks/use-alert-feed';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { formatDateTime, getSeverityLabel } from '@/utils/app';

export default function AlertDetailScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const params = useLocalSearchParams<{ id?: string; kind?: string }>();
  const alerts = useAlertFeed(role);
  const feedItems = alerts.data ?? [];
  const item = feedItems.find((entry) => entry.id === params.id && entry.kind === params.kind);

  if (!item) {
    return (
      <Screen>
        <ContentStack narrow>
          <EmptyState
            icon="notifications-off-outline"
            title="Không tìm thấy cảnh báo"
            description="Mục này không còn trong danh sách hiện tại."
            actionLabel="Quay lại"
            onActionPress={() => router.back()}
          />
        </ContentStack>
      </Screen>
    );
  }

  const tone =
    item.severity === 'critical' ? 'danger' : item.severity === 'warning' ? 'warning' : 'info';

  return (
    <Screen>
      <TopHero
        eyebrow="Chi tiết cảnh báo"
        title={item.title}
        subtitle={item.kind === 'fire_alert' ? 'Mục vận hành cần kiểm tra.' : 'Thông báo hệ thống.'}
        badge={{ label: getSeverityLabel(item.severity), tone }}
        variant={item.severity === 'critical' ? 'accent' : 'default'}
      />

      <ContentStack narrow overlapHero={false}>
        <SectionCard title="Nội dung" subtitle="Thông tin chính" variant="highlight" tone={tone}>
          <Text style={[styles.body, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>
            {item.body}
          </Text>
          <StatusBadge label={getSeverityLabel(item.severity)} tone={tone} />
        </SectionCard>

        <SectionCard title="Thời gian" subtitle="Trạng thái hiện tại" variant="outlined">
          <InfoRow label="Thời gian" value={formatDateTime(item.timestamp)} />
          <InfoRow label="Mức độ" value={getSeverityLabel(item.severity)} />
          <InfoRow label="Trạng thái" value={item.isRead ? 'Đã xem' : 'Chưa xem'} />
        </SectionCard>

        <SectionCard title="Nguồn" subtitle="Gateway và thiết bị" variant="outlined">
          <InfoRow label="Gateway" value={item.gateId || '--'} />
          <InfoRow label="Thiết bị" value={item.deviceIp || '--'} />
          <Text
            style={[
              styles.body,
              { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
            ]}
          >
            {item.sensorContext || 'Không có ngữ cảnh bổ sung.'}
          </Text>
        </SectionCard>

        <PrimaryButton label="Quay lại" onPress={() => router.back()} />
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
