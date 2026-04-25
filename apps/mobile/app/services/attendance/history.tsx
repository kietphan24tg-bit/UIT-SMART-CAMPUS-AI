import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ContentStack, EmptyState, Screen, SkeletonBlock } from '@/components/ui';
import { attendanceApi } from '@/services/api/attendance';
import { useAppTheme } from '@/theme';
import { formatDateTime } from '@/utils/app';

export default function AttendanceHistoryScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const historyQuery = useQuery({
    queryKey: ['attendance', 'student-history'],
    queryFn: () => attendanceApi.getStudentHistory(1, 30),
  });

  return (
    <Screen>
      <View style={[styles.headerRow, { paddingTop: theme.spacing.sm, paddingHorizontal: theme.spacing.lg }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={() => router.back()}
          style={styles.backHit}
        >
          <Ionicons name="chevron-back" size={26} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
          Lịch sử điểm danh
        </Text>
        <View style={styles.backHit} />
      </View>

      <ContentStack narrow overlapHero={false}>
        {historyQuery.isLoading ? (
          <View style={styles.skeletonWrap}>
            <SkeletonBlock height={96} />
            <SkeletonBlock height={96} />
            <SkeletonBlock height={96} />
          </View>
        ) : null}

        {!historyQuery.isLoading && historyQuery.isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Không tải được lịch sử điểm danh"
            description="Vui lòng kiểm tra kết nối và thử lại."
            actionLabel="Thử lại"
            onActionPress={() => void historyQuery.refetch()}
          />
        ) : null}

        {!historyQuery.isLoading && !historyQuery.isError && (historyQuery.data?.items.length ?? 0) === 0 ? (
          <EmptyState
            icon="time-outline"
            title="Chưa có bản ghi điểm danh"
            description="Bản ghi điểm danh sẽ xuất hiện sau khi quét QR thành công."
          />
        ) : null}

        {!historyQuery.isLoading && !historyQuery.isError && (historyQuery.data?.items.length ?? 0) > 0 ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.list}>
              {historyQuery.data?.items.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.itemCard,
                    {
                      backgroundColor: theme.colors.surfaceElevated,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.itemTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                    {item.classSection.course.code} · {item.classSection.classCode}
                  </Text>
                  <Text style={[styles.itemSubtitle, { color: theme.colors.textSoft, fontFamily: theme.fonts.medium }]}>
                    {item.classSection.course.name}
                  </Text>
                  <Text style={[styles.itemMeta, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                    Check-in: {formatDateTime(item.checkinTime)}
                  </Text>
                  <Text style={[styles.itemMeta, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                    Phiên: {formatDateTime(item.session.startedAt)} · {item.session.status}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : null}
      </ContentStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backHit: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
  },
  skeletonWrap: {
    gap: 10,
  },
  list: {
    gap: 10,
    paddingBottom: 16,
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  itemTitle: {
    fontSize: 15,
  },
  itemSubtitle: {
    fontSize: 13,
  },
  itemMeta: {
    fontSize: 12,
    lineHeight: 18,
  },
});

