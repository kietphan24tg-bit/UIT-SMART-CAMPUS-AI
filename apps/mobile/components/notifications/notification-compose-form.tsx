import type {
  ActiveUserRole,
  NotificationAudience,
  NotificationType,
  UserRole,
} from '@smart-campus/shared';
import { ACTIVE_USER_ROLES, USER_ROLES } from '@smart-campus/shared';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import type { BroadcastNotificationRequest } from '@/services/api/notifications';
import { FormField, PrimaryButton, SecondaryButton, SectionCard, StatusBadge } from '@/components/ui';
import { useAppTheme } from '@/theme';

type ComposerMode = 'admin' | 'class';
type AudienceMode = 'all' | 'roles';

export interface NotificationClassOption {
  id: string;
  classCode: string;
  sectionCode: string;
  enrolledCount: number;
  course: {
    code: string;
    name: string;
  };
}

interface NotificationComposeFormProps {
  mode: ComposerMode;
  classSections?: NotificationClassOption[];
  currentUserRole?: UserRole | null;
  loading?: boolean;
  classesLoading?: boolean;
  onRefreshClasses?: () => void;
  onSubmit: (payload: BroadcastNotificationRequest) => Promise<unknown>;
}

const NOTIFICATION_TYPES: Array<{ value: NotificationType; label: string }> = [
  { value: 'general', label: 'Chung' },
  { value: 'academic', label: 'Học vụ' },
  { value: 'class_announcement', label: 'Lớp học' },
  { value: 'schedule_update', label: 'Lịch học' },
  { value: 'grade_published', label: 'Điểm' },
  { value: 'system', label: 'Hệ thống' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'emergency', label: 'Khẩn cấp' },
];

const ROLE_OPTIONS: Array<{ value: ActiveUserRole; label: string }> = [
  { value: USER_ROLES.STUDENT, label: 'Sinh viên' },
  { value: USER_ROLES.LECTURER, label: 'Giảng viên' },
  { value: USER_ROLES.ADMIN, label: 'Admin' },
];

export function NotificationComposeForm({
  mode,
  classSections = [],
  currentUserRole,
  loading = false,
  classesLoading = false,
  onRefreshClasses,
  onSubmit,
}: NotificationComposeFormProps) {
  const theme = useAppTheme();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<NotificationType>(
    mode === 'class' ? 'class_announcement' : 'general',
  );
  const [audienceMode, setAudienceMode] = useState<AudienceMode>('all');
  const [selectedRoles, setSelectedRoles] = useState<ActiveUserRole[]>([ACTIVE_USER_ROLES[0]]);
  const [selectedClassSectionId, setSelectedClassSectionId] = useState('');

  useEffect(() => {
    if (mode === 'class' && !selectedClassSectionId && classSections.length > 0) {
      setSelectedClassSectionId(classSections[0].id);
    }
  }, [classSections, mode, selectedClassSectionId]);

  const selectedClass = useMemo(
    () => classSections.find((section) => section.id === selectedClassSectionId) ?? null,
    [classSections, selectedClassSectionId],
  );
  const senderIncludedInAudience = useMemo(() => {
    if (mode === 'class') {
      return true;
    }

    if (audienceMode === 'all') {
      return true;
    }

    if (!currentUserRole) {
      return false;
    }

    return selectedRoles.includes(currentUserRole as ActiveUserRole);
  }, [audienceMode, currentUserRole, mode, selectedRoles]);

  const toggleRole = (role: ActiveUserRole) => {
    setSelectedRoles((current) =>
      current.includes(role) ? current.filter((item) => item !== role) : [...current, role],
    );
  };

  const buildAudience = (): NotificationAudience | null => {
    if (mode === 'class') {
      return selectedClassSectionId
        ? { scope: 'class_section', classSectionId: selectedClassSectionId }
        : null;
    }

    if (audienceMode === 'all') {
      return { scope: 'all' };
    }

    return selectedRoles.length > 0 ? { scope: 'roles', roles: selectedRoles } : null;
  };

  const handleSubmit = async () => {
    const normalizedTitle = title.trim();
    const normalizedBody = body.trim();
    const audience = buildAudience();

    if (!normalizedTitle || !normalizedBody || !audience) {
      Alert.alert(
        'Thiếu thông tin',
        mode === 'class'
          ? 'Chọn lớp và nhập đầy đủ tiêu đề, nội dung.'
          : 'Nhập đầy đủ tiêu đề, nội dung và phạm vi nhận.',
      );
      return;
    }

    const result = await onSubmit({
      title: normalizedTitle,
      body: normalizedBody,
      type,
      audience,
    });

    setTitle('');
    setBody('');
    Alert.alert('Đã gửi thông báo', formatBroadcastResult(result, senderIncludedInAudience));
  };

  return (
    <View style={styles.stack}>
      <SectionCard
        title={mode === 'class' ? 'Thông báo lớp' : 'Thông báo diện rộng'}
        subtitle={
          mode === 'class'
            ? 'Gửi cho sinh viên đang học trong lớp được chọn.'
            : 'Gửi thông báo toàn trường hoặc theo nhóm vai trò.'
        }
        variant="highlight"
        tone="academic"
      >
        <View style={styles.formStack}>
          <FormField
            label="Tiêu đề"
            placeholder="Ví dụ: Nhắc lịch học bù"
            value={title}
            onChangeText={setTitle}
            leftIcon="bell"
          />
          <FormField
            label="Nội dung"
            placeholder="Nhập nội dung hiển thị trong ứng dụng và thông báo đẩy"
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={4}
            style={styles.bodyInput}
            leftIcon="edit-3"
          />
        </View>
      </SectionCard>

      <SectionCard title="Loại thông báo" subtitle="Dùng để nhóm trong trung tâm cảnh báo">
        <View style={styles.chipRow}>
          {NOTIFICATION_TYPES.map((option) => (
            <ChoiceChip
              key={option.value}
              label={option.label}
              active={type === option.value}
              onPress={() => setType(option.value)}
            />
          ))}
        </View>
      </SectionCard>

      {mode === 'admin' ? (
        <SectionCard title="Phạm vi nhận" subtitle="Chọn nhóm người dùng sẽ nhận thông báo">
          <View style={styles.formStack}>
            <View style={styles.chipRow}>
              <ChoiceChip
                label="Toàn trường"
                active={audienceMode === 'all'}
                onPress={() => setAudienceMode('all')}
              />
              <ChoiceChip
                label="Theo vai trò"
                active={audienceMode === 'roles'}
                onPress={() => setAudienceMode('roles')}
              />
            </View>

            {audienceMode === 'roles' ? (
              <View style={styles.chipRow}>
                {ROLE_OPTIONS.map((option) => (
                  <ChoiceChip
                    key={option.value}
                    label={option.label}
                    active={selectedRoles.includes(option.value)}
                    onPress={() => toggleRole(option.value)}
                  />
                ))}
              </View>
            ) : null}
            {!senderIncludedInAudience ? (
              <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
                Tài khoản hiện tại không nằm trong phạm vi đã chọn, nên tab Cảnh báo của bạn sẽ
                không có mục mới sau khi gửi.
              </Text>
            ) : null}
          </View>
        </SectionCard>
      ) : (
        <SectionCard
          title="Lớp nhận"
          subtitle={
            selectedClass
              ? `${selectedClass.course.code} · ${selectedClass.enrolledCount} sinh viên`
              : 'Chọn lớp bạn phụ trách'
          }
          actionLabel={onRefreshClasses ? 'Làm mới' : undefined}
          onActionPress={onRefreshClasses}
        >
          {classesLoading ? (
            <Text style={[styles.meta, { color: theme.colors.textMuted }]}>Đang tải lớp...</Text>
          ) : null}
          <View style={styles.classList}>
            {classSections.map((section) => (
              <Pressable
                key={section.id}
                accessibilityRole="button"
                onPress={() => setSelectedClassSectionId(section.id)}
                style={[
                  styles.classOption,
                  {
                    backgroundColor:
                      selectedClassSectionId === section.id
                        ? theme.colors.primarySurface
                        : theme.colors.surfaceSubtle,
                    borderColor:
                      selectedClassSectionId === section.id
                        ? theme.colors.primary
                        : theme.colors.border,
                  },
                ]}
              >
                <View style={styles.classHeader}>
                  <Text style={[styles.classTitle, { color: theme.colors.text }]}>
                    {section.course.name}
                  </Text>
                  <StatusBadge label={`${section.enrolledCount}`} tone="info" size="sm" />
                </View>
                <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
                  {section.classCode} · Nhóm {section.sectionCode}
                </Text>
              </Pressable>
            ))}
          </View>
        </SectionCard>
      )}

      <PrimaryButton
        label={mode === 'class' ? 'Gửi cho lớp' : 'Gửi diện rộng'}
        loading={loading}
        onPress={() => void handleSubmit()}
      />
      {mode === 'class' ? (
        <SecondaryButton label="Làm mới danh sách lớp" onPress={onRefreshClasses} />
      ) : null}
    </View>
  );
}

function ChoiceChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? theme.colors.primarySurface : theme.colors.surfaceSubtle,
          borderColor: active ? theme.colors.primary : theme.colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.chipLabel,
          { color: active ? theme.colors.primary : theme.colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function formatResult(result: unknown) {
  if (!result || typeof result !== 'object') {
    return 'Thông báo đã được tạo.';
  }

  const value = result as {
    count?: number;
    push?: { targetTokens?: number; sent?: number; failed?: number };
  };

  const count = value.count ?? 0;
  const sent = value.push?.sent ?? 0;
  const failed = value.push?.failed ?? 0;
  return `Đã tạo ${count} thông báo. Push thành công ${sent}, lỗi ${failed}.`;
}

function formatBroadcastResult(result: unknown, senderIncludedInAudience: boolean) {
  const baseMessage = formatResult(result);

  if (senderIncludedInAudience) {
    return baseMessage;
  }

  return `${baseMessage} Tài khoản hiện tại không thuộc phạm vi nhận nên feed của bạn sẽ không có mục mới.`;
}

const styles = StyleSheet.create({
  stack: {
    gap: 14,
  },
  formStack: {
    gap: 12,
  },
  bodyInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  classList: {
    gap: 10,
  },
  classOption: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  classHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  classTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  meta: {
    fontSize: 12,
    lineHeight: 18,
  },
});
