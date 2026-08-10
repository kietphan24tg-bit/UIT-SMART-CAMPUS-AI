import { Ionicons } from '@expo/vector-icons';
import { RefreshControl, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ContentStack,
  EmptyState,
  InfoRow,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionCard,
  StatusBadge,
  TopHero,
} from '@/components/ui';
import { useAppTheme } from '@/theme';
import type { FireAlertRecord } from '@/types/app-data';
import { formatDateTime } from '@/utils/app';

interface AdminFireAlertsTaskScreenProps {
  fireAlerts: FireAlertRecord[];
  totalFireAlerts: number;
  unreadFireAlerts: number;
  isMutating: boolean;
  isRefetching: boolean;
  onRefresh: () => void;
  onDeleteAlert: (item: FireAlertRecord) => void;
  onDeleteAll: () => void;
  onOpenAlert: (item: FireAlertRecord) => void;
  onOpenAlertCenter: () => void;
}

export function AdminFireAlertsTaskScreen({
  fireAlerts,
  totalFireAlerts,
  unreadFireAlerts,
  isMutating,
  isRefetching,
  onRefresh,
  onDeleteAlert,
  onDeleteAll,
  onOpenAlert,
  onOpenAlertCenter,
}: AdminFireAlertsTaskScreenProps) {
  const theme = useAppTheme();
  const viewedFireAlerts = Math.max(totalFireAlerts - unreadFireAlerts, 0);

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      <TopHero
        eyebrow="PCCC"
        title="Fire alert vận hành"
        subtitle="Theo dõi, mở chi tiết và xóa fire alert ngay trên mobile."
        badge={{ label: 'Live', tone: 'danger' }}
        showBrand
      />

      <ContentStack narrow>
        <SectionCard title="Tổng quan" subtitle="Trạng thái danh sách cảnh báo.">
          <View style={styles.infoGrid}>
            <InfoRow label="Số cảnh báo" value={`${totalFireAlerts}`} />
            <InfoRow label="Hiển thị" value={`${fireAlerts.length}`} />
            <InfoRow label="Chưa xem" value={`${unreadFireAlerts}`} />
            <InfoRow label="Đã xem" value={`${viewedFireAlerts}`} />
          </View>
        </SectionCard>

        <SectionCard
          title="Mục gần đây"
          subtitle={`${fireAlerts.length} / ${totalFireAlerts} cảnh báo mới nhất.`}
          variant="outlined"
          headerAccessory={
            totalFireAlerts > 0 ? (
              <SecondaryButton
                label="Xóa tất cả"
                onPress={onDeleteAll}
                disabled={isMutating}
                loading={isMutating}
                style={[
                  styles.deleteAllButton,
                  {
                    backgroundColor: theme.colors.dangerSurface,
                    borderColor: theme.colors.danger,
                  },
                ]}
                labelStyle={{ color: theme.colors.danger }}
                testID="operations-task-delete-all-fire-alerts"
              />
            ) : undefined
          }
        >
          {fireAlerts.length > 0 ? (
            <View style={styles.column}>
              {fireAlerts.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.alertCard,
                    {
                      backgroundColor: theme.colors.surfaceSubtle,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <View style={styles.alertHeader}>
                    <View style={styles.alertHeaderContent}>
                      <StatusBadge
                        label={item.isResolved ? 'Đã xem' : 'Chưa xem'}
                        tone={item.isResolved ? 'info' : 'danger'}
                        size="sm"
                      />
                      <Text
                        style={[
                          styles.metaText,
                          { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
                        ]}
                      >
                        {formatDateTime(item.reportedAt)}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.alertTitle,
                      { color: theme.colors.text, fontFamily: theme.fonts.semibold },
                    ]}
                  >
                    {item.message || 'Cảnh báo cháy'}
                  </Text>

                  <Text
                    style={[
                      styles.alertSubtitle,
                      { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
                    ]}
                  >
                    Cổng {item.gateId}
                  </Text>

                  {item.telemetrySnapshot ? (
                    <View style={styles.badgeRow}>
                      <StatusBadge
                        label={`Nhiệt độ ${item.telemetrySnapshot.temperature ?? '--'}°C`}
                        tone="info"
                        size="sm"
                      />
                      <StatusBadge
                        label={`Độ ẩm ${item.telemetrySnapshot.humidity ?? '--'}%`}
                        tone="success"
                        size="sm"
                      />
                      <StatusBadge
                        label={item.telemetrySnapshot.rainDetected ? 'Có mưa' : 'Khô ráo'}
                        tone="warning"
                        size="sm"
                      />
                      <StatusBadge
                        label={item.telemetrySnapshot.fireDetected ? 'Cháy' : 'Không cháy'}
                        tone={item.telemetrySnapshot.fireDetected ? 'danger' : 'success'}
                        size="sm"
                      />
                    </View>
                  ) : null}

                  <View style={styles.alertActions}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Xem chi tiết cảnh báo"
                      onPress={() => onOpenAlert(item)}
                      style={({ pressed }) => [
                        styles.alertActionButton,
                        {
                          backgroundColor: theme.colors.primarySurface,
                          borderColor: theme.colors.primary,
                          opacity: pressed ? 0.84 : 1,
                        },
                      ]}
                    >
                      <Ionicons name="open-outline" size={16} color={theme.colors.primary} />
                      <Text
                        style={[
                          styles.alertActionText,
                          { color: theme.colors.primary, fontFamily: theme.fonts.semibold },
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        Chi tiết
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Xóa cảnh báo"
                      disabled={isMutating}
                      onPress={() => onDeleteAlert(item)}
                      testID={`operations-task-delete-fire-alert-${item.id}`}
                      style={({ pressed }) => [
                        styles.alertActionButton,
                        {
                          backgroundColor: theme.colors.dangerSurface,
                          borderColor: theme.colors.danger,
                          opacity: isMutating ? 0.56 : pressed ? 0.84 : 1,
                        },
                      ]}
                    >
                      <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
                      <Text
                        style={[
                          styles.alertActionText,
                          { color: theme.colors.danger, fontFamily: theme.fonts.semibold },
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        Xóa
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              icon="shield-checkmark-outline"
              title="Chưa có cảnh báo"
              description="Danh sách sẽ hiện khi có fire alert mới."
            />
          )}
        </SectionCard>

        <PrimaryButton label="Mở trung tâm cảnh báo" onPress={onOpenAlertCenter} />
      </ContentStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  infoGrid: {
    gap: 8,
  },
  column: {
    gap: 10,
  },
  alertCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  alertHeader: {
    width: '100%',
  },
  alertHeaderContent: {
    gap: 8,
    width: '100%',
  },
  alertTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  alertSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  metaText: {
    fontSize: 13,
    lineHeight: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  deleteAllButton: {
    minHeight: 42,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  alertActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  alertActionButton: {
    minHeight: 40,
    minWidth: 112,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexGrow: 1,
  },
  alertActionText: {
    fontSize: 13,
    lineHeight: 18,
    flexShrink: 1,
    textAlign: 'center',
  },
});
