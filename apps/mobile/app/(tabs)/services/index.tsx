import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ContentStack, EmptyState, Screen, StatusBadge, TopHero } from '@/components/ui';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { getRoleLabel, getServiceEntries } from '@/utils/app';

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
        eyebrow="Services hub"
        title="Mot noi cho moi dich vu"
        subtitle="Core modules, roadmap modules va role-specific tools deu duoc gom vao Services de IA cua UIT Smart Campus gon va on dinh."
        badge={{ label: getRoleLabel(role), tone: 'info' }}
      />

      <ContentStack gap={20}>
        {Object.keys(grouped).length === 0 ? (
          <EmptyState
            title="Chua co dich vu nao"
            description="Danh sach dich vu se xuat hien theo role va tien do trien khai cua tung module."
          />
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <View key={category} style={styles.group}>
              <Text style={[styles.groupTitle, { color: theme.colors.text }]}>{category}</Text>
              <View style={styles.grid}>
                {items.map((service) => (
                  <Pressable
                    key={service.id}
                    onPress={() => router.push(service.route as never)}
                    style={[
                      styles.card,
                      { width: serviceCardWidth },
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
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
                        label={service.availability === 'live' ? 'Dang dung duoc' : 'Roadmap'}
                        tone={service.availability === 'live' ? 'success' : 'info'}
                      />
                    </View>
                    <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{service.title}</Text>
                    <Text style={[styles.cardSummary, { color: theme.colors.textMuted }]}>
                      {service.summary}
                    </Text>
                    <Text style={[styles.cardLink, { color: theme.colors.primary }]}>
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
    gap: 12,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
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
    fontWeight: '800',
  },
  cardSummary: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
