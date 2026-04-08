import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ContentStack, EmptyState, Screen, StatusBadge, TopHero } from '@/components/ui';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import {
  getRoleLabel,
  getServiceEntries,
  getSupportStateLabel,
  getSupportStateTone,
} from '@/utils/app';

export default function ServicesScreen() {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const services = getServiceEntries(role);
  const serviceColumns = layout.isTablet
    ? layout.getGridColumns({ minItemWidth: 280, gap: 12, maxColumns: 2 })
    : 1;
  const serviceCardWidth = layout.getGridItemWidth({ columns: serviceColumns, gap: 12 });

  const grouped = services.reduce<Record<string, typeof services>>((acc, item) => {
    acc[item.category] = [...(acc[item.category] ?? []), item];
    return acc;
  }, {});

  return (
    <Screen>
      <TopHero
        eyebrow="Dịch vụ"
        title="Dịch vụ campus"
        subtitle="Chọn nhanh dịch vụ đang hỗ trợ. Mục chưa khả dụng sẽ có trạng thái rõ ràng."
        badge={{ label: getRoleLabel(role), tone: 'info' }}
      />

      <ContentStack gap={16} overlapHero={false}>
        {Object.keys(grouped).length === 0 ? (
          <EmptyState
            title="Chưa có dịch vụ phù hợp"
            description="Danh sách sẽ tự đổi theo vai trò và quyền hiện tại."
          />
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <View key={category} style={styles.group}>
              <Text
                style={[
                  styles.groupTitle,
                  { color: theme.colors.text, fontFamily: theme.fonts.bold },
                ]}
              >
                {category}
              </Text>
              <View style={styles.grid}>
                {items.map((service) => (
                  <Pressable
                    key={service.id}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !service.isInteractive }}
                    disabled={!service.isInteractive}
                    onPress={() => {
                      if (service.isInteractive) {
                        router.push(service.route as never);
                      }
                    }}
                    style={[
                      styles.card,
                      { width: serviceCardWidth },
                      {
                        backgroundColor: service.isInteractive
                          ? theme.colors.surfaceElevated
                          : theme.colors.surfaceSubtle,
                        borderColor: theme.colors.border,
                        opacity: service.isInteractive ? 1 : 0.86,
                        ...theme.elevation.level1,
                      },
                    ]}
                  >
                    <View style={styles.rowBetween}>
                      <View
                        style={[
                          styles.iconWrap,
                          {
                            backgroundColor: theme.colors.primarySurface,
                          },
                        ]}
                      >
                        <Ionicons name={service.icon as never} size={22} color={theme.colors.primary} />
                      </View>
                      <StatusBadge
                        label={getSupportStateLabel(service.supportState)}
                        tone={getSupportStateTone(service.supportState)}
                      />
                    </View>
                    <Text
                      style={[
                        styles.cardTitle,
                        { color: theme.colors.text, fontFamily: theme.fonts.bold },
                      ]}
                    >
                      {service.title}
                    </Text>
                    <Text
                      style={[
                        styles.cardSummary,
                        { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
                      ]}
                    >
                      {service.summary}
                    </Text>
                    {service.disabledReason ? (
                      <Text
                        style={[
                          styles.cardNote,
                          { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
                        ]}
                      >
                        {service.disabledReason}
                      </Text>
                    ) : null}
                    <Text
                      style={[
                        styles.cardLink,
                        {
                          color: service.isInteractive
                            ? theme.colors.primary
                            : theme.colors.textSoft,
                          fontFamily: theme.fonts.semibold,
                        },
                      ]}
                    >
                      {service.primaryAction}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))
        )}
      </ContentStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 10,
  },
  groupTitle: {
    fontSize: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 17,
  },
  cardSummary: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardNote: {
    fontSize: 12,
    lineHeight: 17,
  },
  cardLink: {
    fontSize: 14,
  },
});
