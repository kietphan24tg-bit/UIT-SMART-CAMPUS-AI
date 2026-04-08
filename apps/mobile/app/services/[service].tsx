import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import type { GradeRecord, GPASummary } from '@/types/app-data';
import {
  formatGpaValue,
  getServiceEntries,
  getSupportStateLabel,
  getSupportStateTone,
  isAdminRole,
  isLecturerRole,
} from '@/utils/app';

export default function ServiceDetailScreen() {
  const role = useAuthStore((state) => state.user?.role);
  const router = useRouter();
  const params = useLocalSearchParams<{ service?: string }>();
  const serviceId = params.service ?? '';
  const service = getServiceEntries(role).find((item) => item.id === serviceId);
  const isGradesViewer = serviceId === 'grades' && !isLecturerRole(role) && !isAdminRole(role);

  const gradesQuery = useQuery({
    queryKey: ['service-grades'],
    queryFn: async () => {
      const [gpa, grades] = await Promise.all([gradesApi.getGpa(), gradesApi.getGrades()]);
      return { gpa, grades };
    },
    enabled: isGradesViewer,
  });

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
        <TopHero
          eyebrow="Dịch vụ học vụ"
          title={service.title}
          subtitle={service.description}
          badge={{
            label: getSupportStateLabel(service.supportState),
            tone: getSupportStateTone(service.supportState),
          }}
        />
        <ContentStack narrow overlapHero={false}>
          <GradesPanel
            loading={gradesQuery.isLoading}
            gpa={gradesQuery.data?.gpa ?? null}
            grades={gradesQuery.data?.grades ?? ([] as GradeRecord[])}
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
              Ứng dụng đang tập trung vào tác vụ quản trị có dữ liệu thật: parking, telemetry, fire alert và thông báo.
            </Text>
          </SectionCard>

          <SectionCard title="Khu vực đang hỗ trợ" subtitle="Chỉ hiển thị lối vào có dữ liệu thật.">
            <View style={styles.column}>
              <InfoRow label="Vận hành campus" value="Parking, telemetry, fire alert" />
              <InfoRow label="Thông báo" value="Danh sách, chưa đọc, đánh dấu đã đọc" />
              <InfoRow label="Hồ sơ" value="Xem và cập nhật thông tin cá nhân" />
            </View>
          </SectionCard>

          <PrimaryButton label="Mở vận hành campus" onPress={() => router.push('/schedule')} />
          <SecondaryButton label="Mở trung tâm cảnh báo" onPress={() => router.push('/alerts')} />
          <SecondaryButton label="Mở parking + IoT" onPress={() => router.push('/parking')} />
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

      <ContentStack narrow={service.id === 'chatbot' || service.id === 'library'} overlapHero={false}>
        <SectionCard title="Trạng thái hiện tại" subtitle={service.summary}>
          <Text style={styles.body}>
            {service.disabledReason || 'Dịch vụ này đang hoạt động trong phạm vi hiện tại của ứng dụng.'}
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

        <PrimaryButton label="Quay lại danh sách dịch vụ" onPress={() => router.replace('/services')} />
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
  gpa,
  grades,
}: {
  loading: boolean;
  gpa: GPASummary | null;
  grades: GradeRecord[];
}) {
  const theme = useAppTheme();

  return (
    <>
      <SectionCard title="GPA hiện tại" subtitle="Tóm tắt nhanh trên thiết bị di động.">
        {loading ? (
          <View style={styles.column}>
            <SkeletonBlock height={24} width="35%" />
            <SkeletonBlock height={80} />
          </View>
        ) : (
          <View style={styles.column}>
            <Text style={[styles.gpaValue, { color: theme.colors.text }]}>
              {formatGpaValue(gpa?.gpa)}
            </Text>
            <Text style={[styles.body, { color: theme.colors.textMuted }]}>
              {gpa?.totalCourses ?? 0} học phần · {gpa?.totalCredits ?? 0} tín chỉ
            </Text>
          </View>
        )}
      </SectionCard>

      <SectionCard title="Bảng điểm gần đây" subtitle="Chỉ hiển thị học phần có dữ liệu.">
        {loading ? (
          <View style={styles.column}>
            <SkeletonBlock height={96} />
            <SkeletonBlock height={96} />
          </View>
        ) : grades.length > 0 ? (
          <View style={styles.column}>
            {grades.map((grade) => (
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
                  {grade.course.code} · {grade.semester.name}
                </Text>
                <Text style={[styles.gradeScore, { color: theme.colors.primary }]}>
                  {grade.totalScore ?? '--'} · {grade.letterGrade ?? 'Chưa có điểm chữ'}
                </Text>
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
