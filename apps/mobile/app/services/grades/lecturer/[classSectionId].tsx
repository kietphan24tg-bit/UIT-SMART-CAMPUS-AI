import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  ContentStack,
  EmptyState,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SkeletonBlock,
} from '@/components/ui';
import {
  gradesApi,
  type GradeSheetRowPayload,
  type GradeWeights,
  type LecturerGradeSheetStudent,
} from '@/services/api/grades';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { canManageGradesRole } from '@/utils/app';

type EditableGradeRow = GradeSheetRowPayload & {
  displayStudentId: string;
  fullName: string;
};

type ScoreField = 'processScore' | 'practiceScore' | 'midtermScore' | 'finalScore';
type WeightField = keyof GradeWeights;

const SCORE_COLUMNS: Array<{
  key: ScoreField;
  label: string;
}> = [
  { key: 'processScore', label: 'QT' },
  { key: 'practiceScore', label: 'TH' },
  { key: 'midtermScore', label: 'GK' },
  { key: 'finalScore', label: 'CK' },
];

const WEIGHT_FIELDS: Array<{
  key: WeightField;
  label: string;
}> = [
  { key: 'processWeight', label: 'QT' },
  { key: 'practiceWeight', label: 'TH' },
  { key: 'midtermWeight', label: 'GK' },
  { key: 'finalWeight', label: 'CK' },
];

function toFullName(student: LecturerGradeSheetStudent) {
  return [student.lastName, student.firstName].filter(Boolean).join(' ').trim();
}

function normalizeScore(value: number | null | undefined) {
  return typeof value === 'number' ? value : null;
}

function formatScore(value: number | null | undefined) {
  return typeof value === 'number' ? String(value) : '';
}

function parseScoreInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.min(10, Math.max(0, Math.round(parsed * 10) / 10));
}

function parseWeightInput(value: string) {
  const parsed = Number(value.trim().replace(',', '.'));
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(parsed)));
}

function calculateTotal(row: GradeSheetRowPayload, weights: GradeWeights) {
  const parts = [
    { score: row.processScore, weight: weights.processWeight },
    { score: row.practiceScore, weight: weights.practiceWeight },
    { score: row.midtermScore, weight: weights.midtermWeight },
    { score: row.finalScore, weight: weights.finalWeight },
  ];

  if (parts.some((part) => part.weight > 0 && part.score == null)) {
    return null;
  }

  const total = parts.reduce((sum, part) => sum + (part.score ?? 0) * part.weight, 0);
  return Math.round((total / 100) * 10) / 10;
}

function buildEditableRows(students: LecturerGradeSheetStudent[]): EditableGradeRow[] {
  return students.map((student) => ({
    studentId: student.id,
    displayStudentId: student.studentId ?? student.email,
    fullName: toFullName(student),
    processScore: normalizeScore(student.grade?.processScore),
    practiceScore: normalizeScore(student.grade?.practiceScore),
    midtermScore: normalizeScore(student.grade?.midtermScore),
    finalScore: normalizeScore(student.grade?.finalScore),
  }));
}

function GradeInput({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (nextValue: number | null) => void;
}) {
  const theme = useAppTheme();
  const [text, setText] = React.useState(formatScore(value));

  React.useEffect(() => {
    setText(formatScore(value));
  }, [value]);

  return (
    <TextInput
      value={text}
      onChangeText={(nextText) => {
        setText(nextText);
        onChange(parseScoreInput(nextText));
      }}
      keyboardType="decimal-pad"
      maxLength={4}
      placeholder="-"
      placeholderTextColor={theme.colors.textSoft}
      style={[
        styles.scoreInput,
        {
          color: theme.colors.text,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceElevated,
          fontFamily: theme.fonts.semibold,
        },
      ]}
    />
  );
}

export default function LecturerGradeSheetScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const canManageGrades = canManageGradesRole(role);
  const params = useLocalSearchParams<{ classSectionId?: string }>();
  const classSectionId = String(params.classSectionId ?? '');
  const [studentQuery, setStudentQuery] = React.useState('');
  const [onlyMissing, setOnlyMissing] = React.useState(false);
  const [weightsText, setWeightsText] = React.useState<Record<WeightField, string>>({
    processWeight: '20',
    practiceWeight: '20',
    midtermWeight: '20',
    finalWeight: '40',
  });
  const [rows, setRows] = React.useState<EditableGradeRow[]>([]);
  const [baselineRows, setBaselineRows] = React.useState('');
  const [baselineWeights, setBaselineWeights] = React.useState('');

  const sheetQuery = useQuery({
    queryKey: ['grades', 'lecturer', 'sheet', classSectionId],
    queryFn: () => gradesApi.getClassSectionGradeSheet(classSectionId),
    enabled: canManageGrades && Boolean(classSectionId),
  });

  React.useEffect(() => {
    if (!sheetQuery.data) {
      return;
    }

    const nextRows = buildEditableRows(sheetQuery.data.students);
    const nextWeights = {
      processWeight: String(sheetQuery.data.weights.processWeight),
      practiceWeight: String(sheetQuery.data.weights.practiceWeight),
      midtermWeight: String(sheetQuery.data.weights.midtermWeight),
      finalWeight: String(sheetQuery.data.weights.finalWeight),
    };

    setRows(nextRows);
    setWeightsText(nextWeights);
    setBaselineRows(JSON.stringify(nextRows));
    setBaselineWeights(JSON.stringify(nextWeights));
  }, [sheetQuery.data]);

  const weights = React.useMemo<GradeWeights>(
    () => ({
      processWeight: parseWeightInput(weightsText.processWeight),
      practiceWeight: parseWeightInput(weightsText.practiceWeight),
      midtermWeight: parseWeightInput(weightsText.midtermWeight),
      finalWeight: parseWeightInput(weightsText.finalWeight),
    }),
    [weightsText],
  );
  const weightTotal =
    weights.processWeight + weights.practiceWeight + weights.midtermWeight + weights.finalWeight;
  const weightsValid = weightTotal === 100;
  const rowsDirty = JSON.stringify(rows) !== baselineRows;
  const weightsDirty = JSON.stringify(weightsText) !== baselineWeights;

  const filteredRows = React.useMemo(() => {
    const needle = studentQuery.trim().toLowerCase();

    return rows.filter((row) => {
      const total = calculateTotal(row, weights);
      const matchesQuery =
        !needle || `${row.displayStudentId} ${row.fullName}`.toLowerCase().includes(needle);
      const matchesMissing = !onlyMissing || total === null;
      return matchesQuery && matchesMissing;
    });
  }, [onlyMissing, rows, studentQuery, weights]);

  const updateWeightsMutation = useMutation({
    mutationFn: () => gradesApi.updateClassSectionGradeWeights(classSectionId, weights),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['grades', 'lecturer', 'sheet', classSectionId],
      });
      Alert.alert('Đã lưu trọng số', 'Bảng điểm đã được cập nhật theo trọng số mới.');
    },
  });

  const saveSheetMutation = useMutation({
    mutationFn: () =>
      gradesApi.upsertClassSectionGradeSheet(
        classSectionId,
        rows.map((row) => ({
          studentId: row.studentId,
          processScore: row.processScore,
          practiceScore: row.practiceScore,
          midtermScore: row.midtermScore,
          finalScore: row.finalScore,
        })),
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['grades', 'lecturer', 'sheet', classSectionId],
        }),
        queryClient.invalidateQueries({ queryKey: ['grades', 'lecturer', 'class-sections'] }),
        queryClient.invalidateQueries({ queryKey: ['grades'] }),
      ]);
      Alert.alert('Đã lưu bảng điểm', 'Điểm sinh viên và GPA sẽ được đồng bộ lại.');
    },
  });

  const updateRowScore = React.useCallback(
    (studentId: string, field: ScoreField, value: number | null) => {
      setRows((currentRows) =>
        currentRows.map((row) => (row.studentId === studentId ? { ...row, [field]: value } : row)),
      );
    },
    [],
  );

  const resetChanges = React.useCallback(() => {
    if (sheetQuery.data) {
      const nextRows = buildEditableRows(sheetQuery.data.students);
      const nextWeights = {
        processWeight: String(sheetQuery.data.weights.processWeight),
        practiceWeight: String(sheetQuery.data.weights.practiceWeight),
        midtermWeight: String(sheetQuery.data.weights.midtermWeight),
        finalWeight: String(sheetQuery.data.weights.finalWeight),
      };
      setRows(nextRows);
      setWeightsText(nextWeights);
    }
  }, [sheetQuery.data]);

  if (!canManageGrades) {
    return (
      <Screen>
        <ContentStack narrow>
          <EmptyState
            icon="lock-closed-outline"
            title="Bạn không có quyền truy cập"
            description="Màn hình nhập điểm chỉ dành cho giảng viên, admin hoặc super admin."
            actionLabel="Quay lại"
            onActionPress={() => router.back()}
          />
        </ContentStack>
      </Screen>
    );
  }

  const isBusy = updateWeightsMutation.isPending || saveSheetMutation.isPending;

  return (
    <Screen>
      <View
        style={[
          styles.headerRow,
          { paddingTop: theme.spacing.sm, paddingHorizontal: theme.spacing.lg },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={() => router.back()}
          style={styles.backHit}
        >
          <Ionicons name="chevron-back" size={26} color={theme.colors.text} />
        </Pressable>
        <Text
          style={[
            styles.headerTitle,
            { color: theme.colors.text, fontFamily: theme.fonts.semibold },
          ]}
        >
          Bảng điểm lớp
        </Text>
        <View style={styles.backHit} />
      </View>

      <ContentStack overlapHero={false}>
        {sheetQuery.isLoading ? (
          <View style={styles.skeletonWrap}>
            <SkeletonBlock height={100} />
            <SkeletonBlock height={140} />
            <SkeletonBlock height={360} />
          </View>
        ) : null}

        {!sheetQuery.isLoading && sheetQuery.isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Không tải được bảng điểm"
            description="Vui lòng kiểm tra kết nối và thử lại."
            actionLabel="Thử lại"
            onActionPress={() => void sheetQuery.refetch()}
          />
        ) : null}

        {!sheetQuery.isLoading && sheetQuery.data ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.stack}>
              <View
                style={[
                  styles.heroPanel,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.heroCode,
                    { color: theme.colors.primary, fontFamily: theme.fonts.semibold },
                  ]}
                >
                  {sheetQuery.data.classSection.course.code} ·{' '}
                  {sheetQuery.data.classSection.classCode}
                </Text>
                <Text
                  style={[
                    styles.heroTitle,
                    { color: theme.colors.text, fontFamily: theme.fonts.semibold },
                  ]}
                >
                  {sheetQuery.data.classSection.course.name}
                </Text>
                <Text
                  style={[
                    styles.heroMeta,
                    { color: theme.colors.textMuted, fontFamily: theme.fonts.medium },
                  ]}
                >
                  {sheetQuery.data.classSection.semester.name} ·{' '}
                  {sheetQuery.data.classSection.course.credits} TC ·{' '}
                  {sheetQuery.data.students.length} sinh viên
                </Text>
              </View>

              <View
                style={[
                  styles.panel,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <Text
                    style={[
                      styles.panelTitle,
                      { color: theme.colors.text, fontFamily: theme.fonts.semibold },
                    ]}
                  >
                    Trọng số điểm
                  </Text>
                  <Text
                    style={[
                      styles.weightTotal,
                      {
                        color: weightsValid ? theme.colors.success : theme.colors.danger,
                        fontFamily: theme.fonts.semibold,
                      },
                    ]}
                  >
                    Tổng: {weightTotal}%
                  </Text>
                </View>

                <View style={styles.weightsGrid}>
                  {WEIGHT_FIELDS.map((field) => (
                    <View key={field.key} style={styles.weightItem}>
                      <Text
                        style={[
                          styles.weightLabel,
                          { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
                        ]}
                      >
                        {field.label}
                      </Text>
                      <TextInput
                        value={weightsText[field.key]}
                        onChangeText={(text) =>
                          setWeightsText((current) => ({ ...current, [field.key]: text }))
                        }
                        keyboardType="number-pad"
                        maxLength={3}
                        style={[
                          styles.weightInput,
                          {
                            color: theme.colors.text,
                            borderColor: theme.colors.border,
                            backgroundColor: theme.colors.surfaceSubtle,
                            fontFamily: theme.fonts.semibold,
                          },
                        ]}
                      />
                    </View>
                  ))}
                </View>

                {!weightsValid ? (
                  <Text
                    style={[
                      styles.warningText,
                      { color: theme.colors.danger, fontFamily: theme.fonts.medium },
                    ]}
                  >
                    Tổng trọng số phải bằng 100% trước khi lưu.
                  </Text>
                ) : null}

                <PrimaryButton
                  label={updateWeightsMutation.isPending ? 'Đang lưu trọng số...' : 'Lưu trọng số'}
                  loading={updateWeightsMutation.isPending}
                  disabled={!weightsValid || !weightsDirty || isBusy}
                  onPress={() => updateWeightsMutation.mutate()}
                  style={styles.weightSaveButton}
                />
              </View>

              <View
                style={[
                  styles.panel,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.toolbar}>
                  <TextInput
                    value={studentQuery}
                    onChangeText={setStudentQuery}
                    placeholder="Tìm MSSV hoặc họ tên..."
                    placeholderTextColor={theme.colors.textSoft}
                    style={[
                      styles.searchInput,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.surfaceSubtle,
                        fontFamily: theme.fonts.medium,
                      },
                    ]}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: onlyMissing }}
                    onPress={() => setOnlyMissing((current) => !current)}
                    style={[
                      styles.filterButton,
                      {
                        backgroundColor: onlyMissing
                          ? theme.colors.primary
                          : theme.colors.surfaceSubtle,
                        borderColor: onlyMissing ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={onlyMissing ? 'checkbox-outline' : 'square-outline'}
                      size={18}
                      color={onlyMissing ? theme.colors.onPrimary : theme.colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.filterText,
                        {
                          color: onlyMissing ? theme.colors.onPrimary : theme.colors.textMuted,
                          fontFamily: theme.fonts.semibold,
                        },
                      ]}
                    >
                      Thiếu điểm
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.actionRow}>
                  <SecondaryButton
                    label="Hoàn tác"
                    disabled={(!rowsDirty && !weightsDirty) || isBusy}
                    onPress={resetChanges}
                    style={styles.actionButton}
                  />
                  <PrimaryButton
                    label={saveSheetMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                    loading={saveSheetMutation.isPending}
                    disabled={!weightsValid || !rowsDirty || isBusy}
                    onPress={() => saveSheetMutation.mutate()}
                    style={styles.actionButton}
                  />
                </View>

                {rows.length === 0 ? (
                  <EmptyState
                    icon="people-outline"
                    title="Lớp chưa có sinh viên"
                    description="Sinh viên đang ghi danh sẽ xuất hiện trong bảng điểm."
                  />
                ) : null}

                {rows.length > 0 && filteredRows.length === 0 ? (
                  <EmptyState
                    icon="search-outline"
                    title="Không có dòng phù hợp"
                    description="Thử đổi từ khóa hoặc tắt bộ lọc thiếu điểm."
                  />
                ) : null}

                {filteredRows.length > 0 ? (
                  <View style={[styles.gradeTable, { borderColor: theme.colors.border }]}>
                    <View
                      style={[
                        styles.gradeTableRow,
                        styles.gradeTableHeader,
                        {
                          backgroundColor: theme.colors.surfaceSubtle,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.headerCell,
                          styles.studentIdCell,
                          { color: theme.colors.primary, fontFamily: theme.fonts.semibold },
                        ]}
                      >
                        MSSV
                      </Text>
                      <Text
                        style={[
                          styles.headerCell,
                          styles.nameCell,
                          { color: theme.colors.primary, fontFamily: theme.fonts.semibold },
                        ]}
                      >
                        Họ và tên
                      </Text>
                      {SCORE_COLUMNS.map((column) => (
                        <Text
                          key={column.key}
                          style={[
                            styles.headerCell,
                            styles.scoreCell,
                            { color: theme.colors.primary, fontFamily: theme.fonts.semibold },
                          ]}
                        >
                          {column.label}
                        </Text>
                      ))}
                      <Text
                        style={[
                          styles.headerCell,
                          styles.scoreCell,
                          { color: theme.colors.primary, fontFamily: theme.fonts.semibold },
                        ]}
                      >
                        TB
                      </Text>
                    </View>

                    {filteredRows.map((row) => {
                      const total = calculateTotal(row, weights);

                      return (
                        <View
                          key={row.studentId}
                          style={[
                            styles.gradeTableRow,
                            {
                              borderColor: theme.colors.border,
                              backgroundColor: theme.colors.surfaceElevated,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.bodyCell,
                              styles.studentIdCell,
                              { color: theme.colors.text, fontFamily: theme.fonts.semibold },
                            ]}
                          >
                            {row.displayStudentId}
                          </Text>
                          <Text
                            style={[
                              styles.bodyCell,
                              styles.nameCell,
                              { color: theme.colors.textMuted, fontFamily: theme.fonts.medium },
                            ]}
                            numberOfLines={1}
                          >
                            {row.fullName}
                          </Text>
                          {SCORE_COLUMNS.map((column) => (
                            <View key={column.key} style={styles.scoreCell}>
                              <GradeInput
                                value={row[column.key]}
                                onChange={(value) =>
                                  updateRowScore(row.studentId, column.key, value)
                                }
                              />
                            </View>
                          ))}
                          <Text
                            style={[
                              styles.totalCell,
                              styles.scoreCell,
                              {
                                color:
                                  total === null ? theme.colors.textSoft : theme.colors.primary,
                                fontFamily: theme.fonts.semibold,
                              },
                            ]}
                          >
                            {total === null ? '-' : total.toFixed(1)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </View>
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
    gap: 12,
  },
  stack: {
    gap: 14,
    paddingBottom: 18,
  },
  heroPanel: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 6,
  },
  heroCode: {
    fontSize: 13,
    lineHeight: 18,
  },
  heroTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  heroMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  panel: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  panelTitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  weightTotal: {
    fontSize: 12,
    lineHeight: 16,
  },
  weightsGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  weightItem: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  weightLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
  weightInput: {
    minHeight: 34,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 13,
    paddingHorizontal: 4,
    paddingVertical: 5,
  },
  weightSaveButton: {
    minHeight: 40,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
  },
  toolbar: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1,
    minWidth: 210,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
  },
  filterButton: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterText: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    minWidth: 140,
  },
  gradeTable: {
    width: '100%',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderRadius: 10,
    overflow: 'hidden',
  },
  gradeTableRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  gradeTableHeader: {
    minHeight: 38,
  },
  headerCell: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  bodyCell: {
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 4,
  },
  studentIdCell: {
    width: 68,
  },
  nameCell: {
    flex: 1,
    minWidth: 76,
  },
  scoreCell: {
    width: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreInput: {
    width: 26,
    minHeight: 34,
    borderWidth: 1,
    borderRadius: 0,
    textAlign: 'center',
    fontSize: 12,
    paddingHorizontal: 1,
    paddingVertical: 6,
  },
  totalCell: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
});
