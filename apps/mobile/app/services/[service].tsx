import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { TaskScreen } from '@/components/tasks';
import {
  ContentStack,
  EmptyState,
  Screen,
  SectionCard,
  SkeletonBlock,
  TopHero,
} from '@/components/ui';
import { gradesApi } from '@/services/api/grades';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import type { GradeRecord, GPASummary, TaskActionDescriptor, TaskRecord } from '@/types/app-data';
import { formatGpaValue, getServiceEntries, isAdminRole, isLecturerRole } from '@/utils/app';
import { getServiceBlueprint } from '@/utils/role-ui';

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
            title="Dich vu khong ton tai"
            description="Module nay chua duoc khai bao trong Services Hub hien tai."
            actionLabel="Quay lai dich vu"
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
          eyebrow="Shared service detail"
          title={service.title}
          subtitle={service.description}
          badge={{ label: 'Backend-ready', tone: 'success' }}
        />
        <ContentStack narrow>
          <GradesPanel
            loading={gradesQuery.isLoading}
            gpa={gradesQuery.data?.gpa ?? null}
            grades={gradesQuery.data?.grades ?? ([] as GradeRecord[])}
          />
        </ContentStack>
      </Screen>
    );
  }

  const blueprint = getServiceBlueprint(serviceId, (role ?? 'student') as never);

  return (
    <TaskScreen
      config={{
        eyebrow: 'Shared service detail',
        title: service.title,
        subtitle: service.description,
        badge: {
          label: blueprint.readinessLabel,
          tone: blueprint.readinessTone,
        },
        sections: [
          {
            title: 'Contract summary',
            subtitle: `${service.summary} · state coverage ${blueprint.stateLabels.join(', ')}`,
            infoRows: blueprint.contractRows,
          },
          ...blueprint.sections,
        ],
        primaryAction: blueprint.primaryAction,
        secondaryActions: blueprint.secondaryActions,
        layout: serviceId === 'chatbot' || serviceId === 'library' ? 'narrow' : 'default',
      }}
      onActionPress={(action: TaskActionDescriptor) => {
        if (action.route) {
          router.push(action.route as never);
          return;
        }

        Alert.alert(
          'UI backend-ready',
          'Action nay da duoc chot de backend noi mutation theo contract hien thi trong man detail.',
        );
      }}
      onRecordPress={(record: TaskRecord) => {
        if (record.route) {
          router.push(record.route as never);
        }
      }}
    />
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
      <SectionCard title="GPA hien tai" subtitle="Snapshot ngan gon de nguoi dung doc nhanh.">
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
              {gpa?.totalCourses ?? 0} hoc phan · {gpa?.totalCredits ?? 0} tin chi
            </Text>
          </View>
        )}
      </SectionCard>

      <SectionCard title="Bang diem gan day" subtitle="Danh sach ngan, tap trung vao thong tin sinh vien can xem ngay.">
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
                  {grade.totalScore ?? '--'} · {grade.letterGrade ?? 'Chua co chu cai'}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState
            icon="bar-chart-outline"
            title="Chua co du lieu diem"
            description="GPA service se chuyen tu preview sang live detail khi backend co them hoc phan hoac hoc ky cho tai khoan hien tai."
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
