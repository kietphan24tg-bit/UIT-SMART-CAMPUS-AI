import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { USER_ROLES } from '@smart-campus/shared';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, StyleSheet, Text, View } from 'react-native';

import {
  ContentStack,
  EmptyState,
  InfoRow,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionCard,
  SkeletonBlock,
  TopHero,
} from '@/components/ui';
import { gradesApi } from '@/services/api/grades';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import type { GPASummary, SemesterGradesRecord } from '@/types/app-data';
import {
  formatGpaValue,
  getServiceEntries,
  getSupportStateLabel,
  getSupportStateTone,
} from '@/utils/app';

const CAMPUS_MAP_GUIDE = [
  {
    id: 'start',
    icon: 'pin-outline',
    label: 'Điểm bắt đầu',
    value: 'Cổng trước UIT',
  },
  {
    id: 'study-zone',
    icon: 'school-outline',
    label: 'Khu học tập',
    value: 'Giảng đường nhà A, thư viện nhà E',
  },
  {
    id: 'controls',
    icon: 'compass-outline',
    label: 'Điều hướng',
    value: 'Danh sách scene, nút xoay và thu phóng',
  },
] as const;

export default function ServiceDetailScreen() {
  const theme = useAppTheme();
  const role = useAuthStore((state) => state.user?.role);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();
  const params = useLocalSearchParams<{ service?: string }>();
  const serviceId = params.service ?? '';

  const service = getServiceEntries(role).find((item) => item.id === serviceId);
  const isGradesViewer = serviceId === 'grades' && role === USER_ROLES.STUDENT;

  const gradesQuery = useQuery({
    queryKey: ['service-grades'],
    queryFn: async () => {
      const [overview, semesters] = await Promise.all([
        gradesApi.getGradesSummary(),
        gradesApi.getAllSemesterGrades(),
      ]);

      return { overview, semesters };
    },
    enabled: isGradesViewer && isHydrated && isAuthenticated,
  });

  if (serviceId === 'attendance') {
    return <Redirect href="/services/attendance" />;
  }

  if (!service) {
    return (
      <Screen>
        <ContentStack>
          <EmptyState
            title="Dịch vụ không tồn tại"
            description="Mục này chưa có trong Services Hub."
            actionLabel="Quay lại dịch vụ"
            onActionPress={() => router.back()}
          />
        </ContentStack>
      </Screen>
    );
  }

  if (isGradesViewer) {
    return (
      <Screen>
        <TopHero eyebrow="Dịch vụ học vụ" title={service.title} subtitle={service.description} />
        <ContentStack narrow overlapHero={false}>
          <GradesPanel
            loading={gradesQuery.isLoading}
            overview={gradesQuery.data?.overview ?? null}
            semesters={gradesQuery.data?.semesters ?? []}
          />
        </ContentStack>
      </Screen>
    );
  }

  if (service.id === 'campus-map') {
    return (
      <Screen>
        <TopHero
          eyebrow="Bản đồ khuôn viên"
          title={service.title}
          subtitle={service.description}
          badge={{
            label: getSupportStateLabel(service.supportState),
            tone: getSupportStateTone(service.supportState),
          }}
        />

        <ContentStack narrow overlapHero={false}>
          <SectionCard
            title="Tổng quan dịch vụ"
            subtitle="Hỗ trợ tham quan khuôn viên UIT bằng mô hình 360 trực tiếp trong ứng dụng."
          >
            <Text
              style={[
                styles.body,
                { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
              ]}
            >
              Dịch vụ cho phép tham quan các khu vực chính của khuôn viên UIT mà không cần chuyển
              sang trình duyệt ngoài.
            </Text>
            <View
              style={[
                styles.mapMetaPanel,
                {
                  backgroundColor: theme.colors.primarySurface,
                  borderColor: theme.colors.primaryMuted,
                },
              ]}
            >
              <View style={styles.mapMetaRow}>
                <Text
                  style={[
                    styles.mapMetaLabel,
                    { color: theme.colors.primary, fontFamily: theme.fonts.semibold },
                  ]}
                >
                  Nguồn dữ liệu
                </Text>
                <Text
                  style={[
                    styles.mapMetaValue,
                    { color: theme.colors.text, fontFamily: theme.fonts.bold },
                  ]}
                >
                  UIT Tour 360
                </Text>
              </View>
              <View style={[styles.mapMetaDivider, { backgroundColor: theme.colors.primary }]} />
              <Text
                style={[
                  styles.mapMetaNote,
                  { color: theme.colors.textMuted, fontFamily: theme.fonts.medium },
                ]}
              >
                Nội dung hiển thị hoàn toàn trong app.
              </Text>
            </View>
          </SectionCard>

          <SectionCard title="Hướng dẫn nhanh" subtitle="Các bước đề xuất để bắt đầu tham quan.">
            <View style={styles.mapGuideColumn}>
              {CAMPUS_MAP_GUIDE.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.mapGuideItem,
                    {
                      backgroundColor: theme.colors.surfaceSubtle,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.mapGuideIconWrap,
                      {
                        backgroundColor: theme.colors.infoSurface,
                        borderColor: theme.colors.info,
                      },
                    ]}
                  >
                    <Ionicons name={item.icon} size={18} color={theme.colors.info} />
                  </View>
                  <View style={styles.mapGuideTextWrap}>
                    <Text
                      style={[
                        styles.mapGuideLabel,
                        { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text
                      style={[
                        styles.mapGuideValue,
                        { color: theme.colors.text, fontFamily: theme.fonts.bold },
                      ]}
                    >
                      {item.value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </SectionCard>

          <PrimaryButton
            label="Mở tour 3D UIT"
            onPress={() => router.push('/services/campus-map/view')}
          />
          <SecondaryButton
            label="Quay lại danh sách dịch vụ"
            onPress={() => router.replace('/services')}
          />
        </ContentStack>
      </Screen>
    );
  }

  if (service.id === 'admin-tools') {
    return (
      <Screen>
        <TopHero
          eyebrow="Dịch vụ quản trị"
          title={service.title}
          subtitle={service.description}
          badge={{
            label: getSupportStateLabel(service.supportState),
            tone: getSupportStateTone(service.supportState),
          }}
        />

        <ContentStack narrow overlapHero={false}>
          <SectionCard title="Trạng thái hiện tại" subtitle={service.summary}>
            <Text style={styles.body}>
              Ứng dụng đang tập trung vào các luồng quản trị có dữ liệu thật: vận hành campus,
              phê duyệt đặt phòng, canteen và thư viện.
            </Text>
          </SectionCard>

          <SectionCard title="Khu vực đang hỗ trợ" subtitle="Chỉ hiển thị lối vào có dữ liệu thật.">
            <View style={styles.column}>
              <InfoRow label="Vận hành campus" value="Parking, telemetry, fire alert" />
              <InfoRow label="Đặt phòng" value="Queue phê duyệt và vòng đời yêu cầu" />
              <InfoRow label="Canteen" value="Quản lý menu, đơn hàng và trạng thái phục vụ" />
              <InfoRow label="Thư viện" value="Tra cứu sách, giữ chỗ và theo dõi mượn trả" />
            </View>
          </SectionCard>

          <PrimaryButton
            label="Mở quản trị canteen"
            onPress={() => router.push('/services/canteen/admin')}
          />
          <SecondaryButton
            label="Mở queue phê duyệt đặt phòng"
            onPress={() => router.push('/services/room-booking/approvals')}
          />
          <SecondaryButton label="Mở thư viện" onPress={() => router.push('/services/library')} />
          <SecondaryButton label="Mở vận hành campus" onPress={() => router.push('/schedule')} />
        </ContentStack>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopHero
        eyebrow="Dịch vụ campus"
        title={service.title}
        subtitle={service.description}
        badge={{
          label: getSupportStateLabel(service.supportState),
          tone: getSupportStateTone(service.supportState),
        }}
      />

      <ContentStack
        narrow={service.id === 'chatbot' || service.id === 'library'}
        overlapHero={false}
      >
        <SectionCard title="Trạng thái hiện tại" subtitle={service.summary}>
          <Text style={styles.body}>
            {service.disabledReason ||
              'Dịch vụ này đang hoạt động trong phạm vi hiện tại của ứng dụng.'}
          </Text>
        </SectionCard>

        <SectionCard title="Trạng thái dịch vụ" subtitle="Thông tin nhanh về mức độ sẵn sàng.">
          <View style={styles.column}>
            <InfoRow label="Trạng thái" value={getSupportStateLabel(service.supportState)} />
            <InfoRow
              label="Gợi ý"
              value={
                service.supportState === 'live'
                  ? 'Bạn có thể sử dụng ngay.'
                  : service.supportState === 'partial'
                    ? 'Một số hạng mục sẽ được mở dần.'
                    : 'Sắp triển khai.'
              }
            />
          </View>
        </SectionCard>

        <SectionCard title="Phạm vi hiện có" subtitle="Thông tin ngắn gọn theo trạng thái dịch vụ.">
          <Text style={styles.body}>
            {service.supportState === 'unsupported'
              ? 'Tạm thời chưa khả dụng trong phiên bản hiện tại.'
              : 'Một phần dịch vụ đã sẵn sàng.'}
          </Text>
        </SectionCard>

        <PrimaryButton
          label="Quay lại danh sách dịch vụ"
          onPress={() => router.replace('/services')}
        />
        <SecondaryButton
          label="Liên hệ hỗ trợ"
          onPress={() =>
            void Linking.openURL(
              'mailto:support@uit.edu.vn?subject=Ho%20tro%20dich%20vu%20UIT%20Smart%20Campus',
            )
          }
        />
      </ContentStack>
    </Screen>
  );
}

function GradesPanel({
  loading,
  overview,
  semesters,
}: {
  loading: boolean;
  overview: GPASummary | null;
  semesters: SemesterGradesRecord[];
}) {
  const theme = useAppTheme();

  return (
    <>
      <SectionCard title="Tổng quan GPA" subtitle="Điểm trung bình tích lũy toàn khóa.">
        {loading ? (
          <View style={styles.column}>
            <SkeletonBlock height={24} width="35%" />
            <SkeletonBlock height={80} />
          </View>
        ) : (
          <View style={styles.column}>
            <Text style={[styles.gpaValue, { color: theme.colors.text }]}>
              {formatGpaValue(overview?.gpa)}
            </Text>
            <Text style={[styles.body, { color: theme.colors.textMuted }]}>
              Tích lũy {overview?.totalEarnedCredits ?? 0} tín chỉ qua{' '}
              {overview?.totalSemesters ?? 0} học kỳ
            </Text>
          </View>
        )}
      </SectionCard>

      <SectionCard
        title="Bảng điểm theo học kỳ"
        subtitle="Mỗi học kỳ hiển thị GPA và các học phần đã có điểm."
      >
        {loading ? (
          <View style={styles.column}>
            <SkeletonBlock height={96} />
            <SkeletonBlock height={96} />
          </View>
        ) : semesters.length > 0 ? (
          <View style={styles.column}>
            {semesters.map((semesterGroup) => (
              <View key={semesterGroup.id} style={styles.semesterBlock}>
                <View style={styles.column}>
                  <Text style={[styles.gradeTitle, { color: theme.colors.text }]}>
                    {semesterGroup.name}
                  </Text>
                  <Text style={[styles.body, { color: theme.colors.textMuted }]}>
                    GPA {formatGpaValue(semesterGroup.summary.gpa)} ·{' '}
                    {semesterGroup.summary.totalCredits} tín chỉ
                  </Text>
                </View>

                {semesterGroup.grades.map((grade) => (
                  <View
                    key={grade.id}
                    style={[
                      styles.gradeCard,
                      {
                        backgroundColor: theme.colors.surfaceSubtle,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.gradeTitle, { color: theme.colors.text }]}>
                      {grade.course.name}
                    </Text>
                    <Text style={[styles.body, { color: theme.colors.textMuted }]}>
                      {grade.course.code}
                      {grade.classSection ? ` · ${grade.classSection.classCode}` : ''} ·{' '}
                      {grade.course.credits} tín chỉ
                    </Text>
                    <Text style={[styles.gradeScore, { color: theme.colors.primary }]}>
                      {grade.isExempt
                        ? `Miễn · +${grade.earnedCredits ?? 0} tín chỉ`
                        : `${grade.totalScore ?? '--'} / 10`}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : (
          <EmptyState
            icon="bar-chart-outline"
            title="Chưa có dữ liệu điểm"
            description="Bảng điểm sẽ hiển thị khi hệ thống có dữ liệu."
          />
        )}
      </SectionCard>
    </>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  column: {
    gap: 12,
  },
  mapMetaPanel: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  mapMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  mapMetaLabel: {
    fontSize: 12,
  },
  mapMetaValue: {
    fontSize: 14,
  },
  mapMetaDivider: {
    height: 1,
    opacity: 0.24,
  },
  mapMetaNote: {
    fontSize: 13,
    lineHeight: 18,
  },
  mapGuideColumn: {
    gap: 10,
  },
  mapGuideItem: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mapGuideIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapGuideTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  mapGuideLabel: {
    fontSize: 12,
  },
  mapGuideValue: {
    fontSize: 16,
    lineHeight: 22,
  },
  semesterBlock: {
    gap: 12,
  },
  gpaValue: {
    fontSize: 32,
    fontWeight: '900',
  },
  gradeCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  gradeTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  gradeScore: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '700',
  },
});
