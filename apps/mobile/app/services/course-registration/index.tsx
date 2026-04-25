import { Ionicons } from '@expo/vector-icons';
import { USER_ROLES } from '@smart-campus/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ContentStack, EmptyState, PrimaryButton, Screen, SecondaryButton, SkeletonBlock } from '@/components/ui';
import { registrationsApi } from '@/services/api/registrations';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { getDayLabel } from '@/utils/app';

function formatMeetingLabel(dayOfWeek: number, startTime: string, endTime: string, room?: string | null) {
  return `${getDayLabel(dayOfWeek)} ${startTime}-${endTime}${room ? ` · ${room}` : ''}`;
}

export default function CourseRegistrationScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const isStudent = role === USER_ROLES.STUDENT;

  const availableQuery = useQuery({
    queryKey: ['registrations', 'available'],
    queryFn: registrationsApi.listAvailableClassSections,
    enabled: isStudent,
  });

  const myRegistrationsQuery = useQuery({
    queryKey: ['registrations', 'me'],
    queryFn: () => registrationsApi.listMyRegistrations(),
    enabled: isStudent,
  });

  const registerMutation = useMutation({
    mutationFn: (classSectionId: string) => registrationsApi.registerClassSection(classSectionId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['registrations', 'available'] }),
        queryClient.invalidateQueries({ queryKey: ['registrations', 'me'] }),
        queryClient.invalidateQueries({ queryKey: ['schedule', 'semesters-with-sessions'] }),
      ]);
    },
  });

  const dropMutation = useMutation({
    mutationFn: (registrationId: string) => registrationsApi.dropRegistration(registrationId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['registrations', 'available'] }),
        queryClient.invalidateQueries({ queryKey: ['registrations', 'me'] }),
        queryClient.invalidateQueries({ queryKey: ['schedule', 'semesters-with-sessions'] }),
      ]);
    },
  });

  const activeRegistrations = new Map(
    (myRegistrationsQuery.data ?? [])
      .filter((item) => item.status === 'active')
      .map((item) => [item.classSection.id, item]),
  );

  if (!isStudent) {
    return (
      <Screen>
        <ContentStack narrow>
          <EmptyState
            icon="lock-closed-outline"
            title="Bạn không có quyền truy cập"
            description="Màn hình này chỉ dành cho tài khoản sinh viên."
            actionLabel="Quay lại"
            onActionPress={() => router.back()}
          />
        </ContentStack>
      </Screen>
    );
  }

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
          Đăng ký học phần
        </Text>
        <View style={styles.backHit} />
      </View>

      <ContentStack narrow overlapHero={false}>
        {availableQuery.isLoading || myRegistrationsQuery.isLoading ? (
          <View style={styles.skeletonWrap}>
            <SkeletonBlock height={120} />
            <SkeletonBlock height={120} />
            <SkeletonBlock height={120} />
          </View>
        ) : null}

        {!availableQuery.isLoading && (availableQuery.isError || myRegistrationsQuery.isError) ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Không tải được dữ liệu đăng ký"
            description="Vui lòng kiểm tra kết nối và thử lại."
            actionLabel="Thử lại"
            onActionPress={() => {
              void availableQuery.refetch();
              void myRegistrationsQuery.refetch();
            }}
          />
        ) : null}

        {!availableQuery.isLoading && !availableQuery.isError && (availableQuery.data?.length ?? 0) === 0 ? (
          <EmptyState
            icon="albums-outline"
            title="Chưa có lớp mở đăng ký"
            description="Admin chưa mở lớp học phần cho đợt đăng ký hiện tại."
          />
        ) : null}

        {(availableQuery.data?.length ?? 0) > 0 ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.list}>
              {availableQuery.data?.map((section) => {
                const activeRegistration = activeRegistrations.get(section.id);
                const isBusy = registerMutation.isPending || dropMutation.isPending;
                const canRegister =
                  !activeRegistration &&
                  Boolean(section.registrationOpen && section.seatsRemaining > 0 && !section.hasConflict);

                return (
                  <View
                    key={section.id}
                    style={[
                      styles.card,
                      {
                        backgroundColor: theme.colors.surfaceElevated,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                      {section.course.code} · {section.classCode}
                    </Text>
                    <Text style={[styles.meta, { color: theme.colors.textSoft, fontFamily: theme.fonts.medium }]}>
                      {section.course.name} · {section.course.credits} tín chỉ
                    </Text>
                    <Text style={[styles.meta, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                      Còn chỗ: {section.seatsRemaining}/{section.capacity}
                    </Text>
                    <Text style={[styles.meta, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                      GV: {section.lecturer?.fullName ?? 'Chưa phân công'}
                    </Text>
                    {section.meetings.map((meeting) => (
                      <Text
                        key={meeting.id}
                        style={[styles.meta, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}
                      >
                        {formatMeetingLabel(meeting.dayOfWeek, meeting.startTime, meeting.endTime, meeting.room)}
                      </Text>
                    ))}
                    {section.hasConflict ? (
                      <Text style={[styles.warning, { color: theme.colors.warning, fontFamily: theme.fonts.medium }]}>
                        Trùng lịch với lớp đang đăng ký.
                      </Text>
                    ) : null}

                    {activeRegistration ? (
                      <SecondaryButton
                        label={dropMutation.isPending ? 'Đang hủy...' : 'Hủy đăng ký'}
                        onPress={() => dropMutation.mutate(activeRegistration.id)}
                        disabled={isBusy}
                      />
                    ) : (
                      <PrimaryButton
                        label={registerMutation.isPending ? 'Đang đăng ký...' : 'Đăng ký'}
                        onPress={() => registerMutation.mutate(section.id)}
                        disabled={!canRegister || isBusy}
                      />
                    )}
                  </View>
                );
              })}
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
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  title: {
    fontSize: 15,
  },
  meta: {
    fontSize: 12,
    lineHeight: 18,
  },
  warning: {
    fontSize: 12,
    lineHeight: 18,
  },
});
