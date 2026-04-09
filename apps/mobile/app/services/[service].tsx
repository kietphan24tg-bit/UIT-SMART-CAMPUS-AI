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
import type { GPASummary, SemesterGradesRecord } from '@/types/app-data';
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
      const [overview, semesters] = await Promise.all([
        gradesApi.getGradesSummary(),
        gradesApi.getAllSemesterGrades(),
      ]);

      return { overview, semesters };
    },
    enabled: isGradesViewer,
  });

  if (!service) {
    return (
      <Screen>
        <ContentStack>
          <EmptyState
            title="Dich vu khong ton tai"
            description="Muc nay chua co trong Services Hub."
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
          eyebrow="Dich vu hoc vu"
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
            overview={gradesQuery.data?.overview ?? null}
            semesters={gradesQuery.data?.semesters ?? []}
          />
        </ContentStack>
      </Screen>
    );
  }

  if (service.id === 'admin-tools') {
    return (
      <Screen>
        <TopHero
          eyebrow="Dich vu quan tri"
          title={service.title}
          subtitle={service.description}
          badge={{
            label: getSupportStateLabel(service.supportState),
            tone: getSupportStateTone(service.supportState),
          }}
        />

        <ContentStack narrow overlapHero={false}>
          <SectionCard title="Trang thai hien tai" subtitle={service.summary}>
            <Text style={styles.body}>
              Ung dung dang tap trung vao cac tac vu quan tri co du lieu that: parking, telemetry,
              fire alert va thong bao.
            </Text>
          </SectionCard>

          <SectionCard title="Khu vuc dang ho tro" subtitle="Chi hien thi loi vao co du lieu that.">
            <View style={styles.column}>
              <InfoRow label="Van hanh campus" value="Parking, telemetry, fire alert" />
              <InfoRow label="Thong bao" value="Danh sach, chua doc, danh dau da doc" />
              <InfoRow label="Ho so" value="Xem va cap nhat thong tin ca nhan" />
            </View>
          </SectionCard>

          <PrimaryButton label="Mo van hanh campus" onPress={() => router.push('/schedule')} />
          <SecondaryButton label="Mo trung tam canh bao" onPress={() => router.push('/alerts')} />
          <SecondaryButton label="Mo parking + IoT" onPress={() => router.push('/parking')} />
        </ContentStack>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopHero
        eyebrow="Dich vu campus"
        title={service.title}
        subtitle={service.description}
        badge={{
          label: getSupportStateLabel(service.supportState),
          tone: getSupportStateTone(service.supportState),
        }}
      />

      <ContentStack narrow={service.id === 'chatbot' || service.id === 'library'} overlapHero={false}>
        <SectionCard title="Trang thai hien tai" subtitle={service.summary}>
          <Text style={styles.body}>
            {service.disabledReason || 'Dich vu nay dang hoat dong trong pham vi hien tai cua ung dung.'}
          </Text>
        </SectionCard>

        <SectionCard title="Trang thai dich vu" subtitle="Thong tin nhanh ve muc do san sang.">
          <View style={styles.column}>
            <InfoRow label="Trang thai" value={getSupportStateLabel(service.supportState)} />
            <InfoRow
              label="Goi y"
              value={
                service.supportState === 'live'
                  ? 'Ban co the su dung ngay.'
                  : service.supportState === 'partial'
                    ? 'Mot so hang muc se duoc mo dan.'
                    : 'Sap trien khai.'
              }
            />
          </View>
        </SectionCard>

        <SectionCard title="Pham vi hien co" subtitle="Thong tin ngan gon theo trang thai dich vu.">
          <Text style={styles.body}>
            {service.supportState === 'unsupported'
              ? 'Tam thoi chua kha dung trong phien ban hien tai.'
              : 'Mot phan dich vu da san sang.'}
          </Text>
        </SectionCard>

        <PrimaryButton label="Quay lai danh sach dich vu" onPress={() => router.replace('/services')} />
        <SecondaryButton
          label="Lien he ho tro"
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
      <SectionCard title="Tong quan GPA" subtitle="Tom tat 4 hoc ky va ket qua tich luy.">
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
              {overview?.totalCredits ?? 0} tin chi tinh GPA · {overview?.totalCourses ?? 0} hoc phan
            </Text>
            <Text style={[styles.body, { color: theme.colors.textMuted }]}>
              Tich luy {overview?.totalEarnedCredits ?? 0} tin chi qua {overview?.totalSemesters ?? 0} hoc ky
            </Text>
          </View>
        )}
      </SectionCard>

      <SectionCard title="Bang diem theo hoc ky" subtitle="Moi hoc ky co GPA rieng va danh sach hoc phan.">
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
                    GPA {formatGpaValue(semesterGroup.summary.gpa)} · {semesterGroup.summary.totalCredits} tin chi
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
                    <Text style={[styles.gradeTitle, { color: theme.colors.text }]}>{grade.course.name}</Text>
                    <Text style={[styles.body, { color: theme.colors.textMuted }]}>
                      {grade.course.code} · {grade.course.credits} tin chi
                    </Text>
                    <Text style={[styles.gradeScore, { color: theme.colors.primary }]}>
                      {grade.isExempt
                        ? `Mien · +${grade.earnedCredits ?? 0} tin chi`
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
            title="Chua co du lieu diem"
            description="Bang diem se hien thi khi he thong co du lieu."
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
