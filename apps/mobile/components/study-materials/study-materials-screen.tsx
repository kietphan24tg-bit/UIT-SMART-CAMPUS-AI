import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  ContentStack,
  EmptyState,
  FormField,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionCard,
  SkeletonBlock,
  StatusBadge,
  TopHero,
} from '@/components/ui';
import {
  downloadRemoteFileToDevice,
  type DeviceDownloadProgress,
} from '@/services/file-download';
import { prefetchImageUrls } from '@/services/image-cache';
import {
  studyMaterialsApi,
  type StudyMaterialCategory,
  type StudyMaterialListResponse,
  type StudyMaterialRecord,
} from '@/services/api/study-materials';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { isAdminRole } from '@/utils/app';

type StudyMaterialsScreenMode = 'user' | 'admin';
type StudyMaterialFilter = 'all' | StudyMaterialCategory;

type PickedMaterialFile = {
  uri: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number | null;
};

const CATEGORY_OPTIONS: Array<{
  value: StudyMaterialCategory;
  label: string;
}> = [
  { value: 'exam', label: 'Đề thi' },
  { value: 'textbook', label: 'Giáo trình' },
  { value: 'other', label: 'Khác' },
];

const FILTER_OPTIONS: Array<{
  value: StudyMaterialFilter;
  label: string;
}> = [{ value: 'all', label: 'Tất cả' }, ...CATEGORY_OPTIONS];

const DOCUMENT_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_STUDY_MATERIAL_FILE_SIZE_BYTES = 100 * 1024 * 1024;

const MULTILINE_INPUT_STYLE = {
  minHeight: 96,
  textAlignVertical: 'top' as const,
};

function resolveMaterialMimeType(mimeType?: string | null, fileName?: string | null) {
  if (mimeType && DOCUMENT_TYPES.includes(mimeType)) {
    return mimeType;
  }

  const extension = fileName?.split('.').pop()?.trim().toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'pdf':
      return 'application/pdf';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default:
      return null;
  }
}

function isImageMaterial(mimeType?: string | null) {
  return Boolean(mimeType?.startsWith('image/'));
}

function getCategoryLabel(category: StudyMaterialCategory) {
  return CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? 'Khác';
}

function getMaterialIconName(mimeType: string) {
  if (mimeType === 'application/pdf') {
    return 'document-text-outline';
  }

  if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'document-outline';
  }

  return 'image-outline';
}

function formatMaterialDate(value: string) {
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatFileSize(size?: number | null) {
  if (!size || size <= 0) {
    return 'Chưa rõ dung lượng';
  }

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function createListQueryKey(keyword: string, filter: StudyMaterialFilter) {
  return ['study-materials', 'list', keyword, filter] as const;
}

function matchesFilter(
  material: StudyMaterialRecord,
  keyword: string,
  filter: StudyMaterialFilter,
) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  const matchesKeyword =
    !normalizedKeyword ||
    material.title.toLowerCase().includes(normalizedKeyword) ||
    (material.description ?? '').toLowerCase().includes(normalizedKeyword) ||
    material.fileName.toLowerCase().includes(normalizedKeyword) ||
    material.uploader.fullName.toLowerCase().includes(normalizedKeyword);
  const matchesCategory = filter === 'all' || material.category === filter;
  return matchesKeyword && matchesCategory;
}

type EditorState = {
  category: StudyMaterialCategory;
  title: string;
  description: string;
  selectedFile: PickedMaterialFile | null;
};

type MaterialDownloadState = {
  materialId: string;
  progress: DeviceDownloadProgress;
};

function createEmptyEditorState(): EditorState {
  return {
    category: 'exam',
    title: '',
    description: '',
    selectedFile: null,
  };
}

export function StudyMaterialsScreen({ mode }: { mode: StudyMaterialsScreenMode }) {
  const theme = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const role = useAuthStore((state) => state.user?.role);
  const [keyword, setKeyword] = useState('');
  const deferredKeyword = useDeferredValue(keyword.trim());
  const [filter, setFilter] = useState<StudyMaterialFilter>('all');
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<StudyMaterialRecord | null>(null);
  const [editorState, setEditorState] = useState<EditorState>(createEmptyEditorState);
  const [downloadState, setDownloadState] = useState<MaterialDownloadState | null>(null);

  useEffect(() => {
    if (mode === 'user' && isAdminRole(role)) {
      router.replace('/services/study-materials/admin');
    }
  }, [mode, role, router]);

  useEffect(() => {
    if (mode === 'admin' && role && !isAdminRole(role)) {
      router.replace('/services/study-materials');
    }
  }, [mode, role, router]);

  const listQueryKey = useMemo(
    () => createListQueryKey(deferredKeyword, filter),
    [deferredKeyword, filter],
  );
  const listQuery = useQuery({
    queryKey: listQueryKey,
    queryFn: () =>
      studyMaterialsApi.list({
        q: deferredKeyword || undefined,
        category: filter === 'all' ? undefined : filter,
        limit: 50,
      }),
  });

  useEffect(() => {
    void prefetchImageUrls(
      (listQuery.data?.items ?? []).map((item) =>
        isImageMaterial(item.mimeType) ? item.fileUrl : null,
      ),
    );
  }, [listQuery.data]);

  const openCreateEditor = () => {
    setEditingMaterial(null);
    setEditorState(createEmptyEditorState());
    setIsEditorVisible(true);
  };

  const openEditEditor = (material: StudyMaterialRecord) => {
    setEditingMaterial(material);
    setEditorState({
      category: material.category,
      title: material.title,
      description: material.description ?? '',
      selectedFile: null,
    });
    setIsEditorVisible(true);
  };

  const closeEditor = () => {
    setIsEditorVisible(false);
    setEditingMaterial(null);
    setEditorState(createEmptyEditorState());
  };

  const upsertCurrentList = (record: StudyMaterialRecord) => {
    queryClient.setQueryData<StudyMaterialListResponse | undefined>(listQueryKey, (current) => {
      if (!current) {
        return current;
      }

      const nextItems = current.items.filter((item) => item.id !== record.id);
      if (matchesFilter(record, deferredKeyword, filter)) {
        nextItems.unshift(record);
      }

      return {
        ...current,
        items: nextItems.sort(
          (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        ),
      };
    });
  };

  const removeFromCurrentList = (materialId: string) => {
    queryClient.setQueryData<StudyMaterialListResponse | undefined>(listQueryKey, (current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        items: current.items.filter((item) => item.id !== materialId),
      };
    });
  };

  const createMutation = useMutation({
    mutationFn: (state: EditorState) => {
      if (!state.selectedFile) {
        throw new Error('Vui lòng chọn file cần tải lên.');
      }

      return studyMaterialsApi.create({
        category: state.category,
        title: state.title.trim(),
        description: state.description.trim() || undefined,
        file: {
          uri: state.selectedFile.uri,
          fileName: state.selectedFile.fileName,
          mimeType: state.selectedFile.mimeType,
        },
      });
    },
    onSuccess: async (record) => {
      upsertCurrentList(record);
      closeEditor();
      await queryClient.invalidateQueries({ queryKey: ['study-materials', 'list'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ materialId, state }: { materialId: string; state: EditorState }) =>
      studyMaterialsApi.update(materialId, {
        category: state.category,
        title: state.title.trim(),
        description: state.description.trim(),
        file: state.selectedFile
          ? {
              uri: state.selectedFile.uri,
              fileName: state.selectedFile.fileName,
              mimeType: state.selectedFile.mimeType,
            }
          : undefined,
      }),
    onSuccess: async (record) => {
      upsertCurrentList(record);
      closeEditor();
      await queryClient.invalidateQueries({ queryKey: ['study-materials', 'list'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (materialId: string) => studyMaterialsApi.remove(materialId),
    onSuccess: async (result) => {
      removeFromCurrentList(result.id);
      await queryClient.invalidateQueries({ queryKey: ['study-materials', 'list'] });
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const materials = listQuery.data?.items ?? [];

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: DOCUMENT_TYPES,
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets.length) {
        return;
      }

      const asset = result.assets[0];
      const mimeType = resolveMaterialMimeType(asset.mimeType, asset.name);
      if (!mimeType) {
        Alert.alert('Tài liệu', 'Định dạng file chưa được hỗ trợ.');
        return;
      }

      if ((asset.size ?? 0) > MAX_STUDY_MATERIAL_FILE_SIZE_BYTES) {
        Alert.alert('Tài liệu', 'Tệp tải lên vượt quá 100 MB. Vui lòng chọn tệp nhỏ hơn.');
        return;
      }

      setEditorState((current) => ({
        ...current,
        selectedFile: {
          uri: asset.uri,
          fileName: asset.name,
          mimeType,
          fileSizeBytes: asset.size ?? null,
        },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể chọn file lúc này.';
      Alert.alert('Tài liệu', message);
    }
  };

  const handleOpenMaterial = async (material: StudyMaterialRecord) => {
    try {
      await Linking.openURL(material.fileUrl);
    } catch {
      Alert.alert('Tài liệu', 'Không thể mở file này trên thiết bị hiện tại.');
    }
  };

  const handleDownloadMaterial = async (material: StudyMaterialRecord) => {
    if (downloadState && downloadState.materialId !== material.id) {
      Alert.alert('Tài liệu', 'Vui lòng đợi lần tải hiện tại hoàn tất.');
      return;
    }

    try {
      setDownloadState({
        materialId: material.id,
        progress: {
          stage: 'preparing',
          transferredBytes: 0,
          totalBytes: null,
          progress: null,
        },
      });

      const result = await downloadRemoteFileToDevice({
        url: material.fileUrl,
        fileName: material.fileName,
        mimeType: material.mimeType,
        onProgress: (progress) => {
          setDownloadState({
            materialId: material.id,
            progress,
          });
        },
      });

      Alert.alert(
        'Tài liệu',
        `Đã tải ${result.savedFileName} về máy.\nVị trí lưu: ${result.locationLabel}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Không thể tải file về máy lúc này.';
      Alert.alert('Tài liệu', message);
    } finally {
      setDownloadState((current) => (current?.materialId === material.id ? null : current));
    }
  };

  const getDownloadLabel = (materialId: string) => {
    if (downloadState?.materialId !== materialId) {
      return 'Tải file';
    }

    if (downloadState.progress.stage === 'saving') {
      return 'Đang lưu...';
    }

    if (downloadState.progress.progress != null) {
      return `Tải ${Math.round(downloadState.progress.progress * 100)}%`;
    }

    return 'Đang tải...';
  };

  const handleSubmit = async () => {
    if (!editorState.title.trim()) {
      Alert.alert('Tài liệu', 'Vui lòng nhập tiêu đề tài liệu.');
      return;
    }

    if (!editingMaterial && !editorState.selectedFile) {
      Alert.alert('Tài liệu', 'Vui lòng chọn file cần tải lên.');
      return;
    }

    try {
      if (editingMaterial) {
        await updateMutation.mutateAsync({
          materialId: editingMaterial.id,
          state: editorState,
        });
      } else {
        await createMutation.mutateAsync(editorState);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lưu tài liệu lúc này.';
      Alert.alert('Tài liệu', message);
    }
  };

  const handleDelete = (material: StudyMaterialRecord) => {
    Alert.alert('Xóa tài liệu', `Xóa "${material.title}" khỏi kho tài liệu?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          void deleteMutation.mutateAsync(material.id).catch((error) => {
            const message =
              error instanceof Error ? error.message : 'Không thể xóa tài liệu lúc này.';
            Alert.alert('Tài liệu', message);
          });
        },
      },
    ]);
  };

  return (
    <Screen>
      <TopHero
        eyebrow={mode === 'admin' ? 'Quản trị tài liệu' : 'Học vụ'}
        title="Tài liệu học tập"
        subtitle={
          mode === 'admin'
            ? 'Theo dõi, chỉnh sửa và xóa tài liệu học tập trong kho chung.'
            : 'Chia sẻ đề thi, giáo trình và tài liệu học tập dùng chung trong app.'
        }
        badge={{
          label: mode === 'admin' ? 'Admin' : 'Student/Lecturer',
          tone: mode === 'admin' ? 'primary' : 'info',
        }}
      />

      <ContentStack gap={16} overlapHero={false}>
        <SectionCard
          title={mode === 'admin' ? 'Kho tài liệu' : 'Tài liệu đang chia sẻ'}
          subtitle="Tìm theo tiêu đề, mô tả hoặc người đăng."
          variant="glass"
          tone="academic"
        >
          <View style={styles.formColumn}>
            <FormField
              label="Tìm kiếm"
              placeholder="Nhập từ khóa hoặc người đăng"
              value={keyword}
              onChangeText={setKeyword}
              leftIcon="search"
            />

            <View style={styles.compactFilterWrap}>
              {FILTER_OPTIONS.map((option) => {
                const active = filter === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    onPress={() => setFilter(option.value)}
                    style={[
                      styles.filterChip,
                      styles.compactFilterChip,
                      {
                        backgroundColor: active
                          ? theme.colors.primarySurface
                          : theme.colors.surfaceSubtle,
                        borderColor: active ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        styles.compactFilterChipText,
                        {
                          color: active ? theme.colors.primary : theme.colors.textMuted,
                          fontFamily: active ? theme.fonts.semibold : theme.fonts.medium,
                        },
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.84}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {mode === 'user' ? (
              <PrimaryButton label="Tải tài liệu lên" onPress={openCreateEditor} />
            ) : null}
          </View>
        </SectionCard>

        <SectionCard
          title={mode === 'admin' ? 'Danh sách tài liệu' : 'Tài liệu mới nhất'}
          subtitle={listQuery.data ? `${listQuery.data.total} tài liệu` : 'Đang tải dữ liệu'}
        >
          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={listQuery.isRefetching}
                onRefresh={() => {
                  void listQuery.refetch();
                }}
              />
            }
          >
            <View style={styles.materialList}>
              {listQuery.isLoading ? (
                <>
                  <SkeletonBlock height={160} />
                  <SkeletonBlock height={160} />
                </>
              ) : materials.length > 0 ? (
                materials.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    onOpen={() => void handleOpenMaterial(material)}
                    onDownload={() => void handleDownloadMaterial(material)}
                    downloadLabel={getDownloadLabel(material.id)}
                    downloading={downloadState?.materialId === material.id}
                    onEdit={material.canEdit ? () => openEditEditor(material) : undefined}
                    onDelete={material.canDelete ? () => handleDelete(material) : undefined}
                  />
                ))
              ) : (
                <EmptyState
                  title="Chưa có tài liệu phù hợp"
                  description="Thử đổi bộ lọc hoặc tải lên tài liệu đầu tiên."
                  actionLabel={mode === 'user' ? 'Tải tài liệu lên' : undefined}
                  onActionPress={mode === 'user' ? openCreateEditor : undefined}
                />
              )}
            </View>
          </ScrollView>
        </SectionCard>

        <SecondaryButton
          label="Quay lại dịch vụ"
          onPress={() => router.replace(mode === 'admin' ? '/services/admin-tools' : '/services')}
        />
      </ContentStack>

      <MaterialEditorModal
        visible={isEditorVisible}
        editingMaterial={editingMaterial}
        editorState={editorState}
        onChange={setEditorState}
        onClose={closeEditor}
        onPickFile={() => {
          void pickFile();
        }}
        onSubmit={() => {
          void handleSubmit();
        }}
        loading={isSubmitting}
      />
    </Screen>
  );
}

function MaterialCard({
  material,
  onOpen,
  onDownload,
  downloadLabel,
  downloading,
  onEdit,
  onDelete,
}: {
  material: StudyMaterialRecord;
  onOpen: () => void;
  onDownload: () => void;
  downloadLabel: string;
  downloading: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.materialCard,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
        },
        theme.elevation.level1 as never,
      ]}
    >
      <View style={styles.materialHeader}>
        {isImageMaterial(material.mimeType) ? (
          <Image
            source={{ uri: material.fileUrl }}
            accessibilityLabel={`Ảnh tài liệu ${material.title}`}
            style={styles.materialImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={0}
          />
        ) : (
          <View
            style={[
              styles.materialIconWrap,
              {
                backgroundColor: theme.colors.infoSurface,
                borderColor: theme.colors.info,
              },
            ]}
          >
            <Ionicons
              name={getMaterialIconName(material.mimeType)}
              size={24}
              color={theme.colors.info}
            />
          </View>
        )}

        <View style={styles.materialHeaderContent}>
          <View style={styles.materialTitleRow}>
            <Text
              style={[
                styles.materialTitle,
                { color: theme.colors.text, fontFamily: theme.fonts.semibold },
              ]}
            >
              {material.title}
            </Text>
            <StatusBadge label={getCategoryLabel(material.category)} tone="info" size="sm" />
          </View>
          <Text
            style={[
              styles.materialMeta,
              { color: theme.colors.textMuted, fontFamily: theme.fonts.medium },
            ]}
          >
            {material.fileName}
          </Text>
          <Text
            style={[
              styles.materialMeta,
              { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
            ]}
          >
            {formatFileSize(material.fileSizeBytes)} · Đăng bởi {material.uploader.fullName}
          </Text>
        </View>
      </View>

      {material.description ? (
        <Text
          style={[
            styles.materialDescription,
            { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
          ]}
        >
          {material.description}
        </Text>
      ) : null}

      <Text
        style={[
          styles.materialMeta,
          { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
        ]}
      >
        Cập nhật {formatMaterialDate(material.updatedAt)}
      </Text>

      <View style={styles.materialActions}>
        <ActionTextButton label="Mở file" onPress={onOpen} tone="primary" />
        <ActionTextButton
          label={downloadLabel}
          onPress={onDownload}
          tone="primary"
          disabled={downloading}
        />
        {onEdit ? <ActionTextButton label="Sửa" onPress={onEdit} tone="neutral" /> : null}
        {onDelete ? <ActionTextButton label="Xóa" onPress={onDelete} tone="danger" /> : null}
      </View>
    </View>
  );
}

function MaterialEditorModal({
  visible,
  editingMaterial,
  editorState,
  onChange,
  onClose,
  onPickFile,
  onSubmit,
  loading,
}: {
  visible: boolean;
  editingMaterial: StudyMaterialRecord | null;
  editorState: EditorState;
  onChange: (nextState: EditorState) => void;
  onClose: () => void;
  onPickFile: () => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  const theme = useAppTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalKeyboardAvoiding}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: theme.colors.text, fontFamily: theme.fonts.bold },
              ]}
            >
              {editingMaterial ? 'Chỉnh sửa tài liệu' : 'Tải tài liệu lên'}
            </Text>

            <ScrollView
              contentContainerStyle={styles.formColumn}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.filterWrap}>
                {CATEGORY_OPTIONS.map((option) => {
                  const active = editorState.category === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="button"
                      onPress={() => onChange({ ...editorState, category: option.value })}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: active
                            ? theme.colors.primarySurface
                            : theme.colors.surfaceSubtle,
                          borderColor: active ? theme.colors.primary : theme.colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          {
                            color: active ? theme.colors.primary : theme.colors.textMuted,
                            fontFamily: active ? theme.fonts.semibold : theme.fonts.medium,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <FormField
                label="Tiêu đề"
                placeholder="Nhập tiêu đề tài liệu"
                value={editorState.title}
                onChangeText={(title) => onChange({ ...editorState, title })}
              />
              <FormField
                label="Mô tả"
                placeholder="Thêm mô tả ngắn nếu cần"
                multiline
                style={MULTILINE_INPUT_STYLE}
                value={editorState.description}
                onChangeText={(description) => onChange({ ...editorState, description })}
              />

              <View
                style={[
                  styles.filePickerCard,
                  {
                    backgroundColor: theme.colors.surfaceSubtle,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filePickerTitle,
                    { color: theme.colors.text, fontFamily: theme.fonts.semibold },
                  ]}
                >
                  {editingMaterial ? 'File đính kèm' : 'Chọn file tài liệu'}
                </Text>
                <Text
                  style={[
                    styles.filePickerHint,
                    { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
                  ]}
                >
                  Hỗ trợ JPG, PNG, WebP, PDF, DOC, DOCX · tối đa 100 MB
                </Text>
                <PrimaryButton
                  label={
                    editorState.selectedFile
                      ? 'Đổi file'
                      : editingMaterial
                        ? 'Thay file'
                        : 'Chọn file'
                  }
                  onPress={onPickFile}
                />

                {editorState.selectedFile ? (
                  <Text
                    style={[
                      styles.filePickerMeta,
                      { color: theme.colors.textMuted, fontFamily: theme.fonts.medium },
                    ]}
                  >
                    {editorState.selectedFile.fileName} ·{' '}
                    {formatFileSize(editorState.selectedFile.fileSizeBytes)}
                  </Text>
                ) : editingMaterial ? (
                  <Text
                    style={[
                      styles.filePickerMeta,
                      { color: theme.colors.textMuted, fontFamily: theme.fonts.medium },
                    ]}
                  >
                    File hiện tại: {editingMaterial.fileName}
                  </Text>
                ) : null}
              </View>

              <PrimaryButton
                label={editingMaterial ? 'Lưu thay đổi' : 'Đăng tài liệu'}
                onPress={onSubmit}
                loading={loading}
              />
              <SecondaryButton label="Đóng" onPress={onClose} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function ActionTextButton({
  label,
  onPress,
  tone,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  tone: 'primary' | 'neutral' | 'danger';
  disabled?: boolean;
}) {
  const theme = useAppTheme();
  const color = disabled
    ? theme.colors.textSoft
    : tone === 'danger'
      ? theme.colors.danger
      : tone === 'neutral'
        ? theme.colors.textMuted
        : theme.colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={styles.actionTextButton}
    >
      <Text style={[styles.actionText, { color, fontFamily: theme.fonts.semibold }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionText: {
    fontSize: 14,
  },
  actionTextButton: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  compactFilterChip: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    minHeight: 44,
  },
  compactFilterChipText: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },
  compactFilterWrap: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 6,
  },
  filePickerCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  filePickerHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  filePickerMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  filePickerTitle: {
    fontSize: 15,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipText: {
    fontSize: 13,
  },
  filterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  formColumn: {
    gap: 14,
  },
  materialActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  materialCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    gap: 10,
  },
  materialDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  materialHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  materialHeaderContent: {
    flex: 1,
    gap: 4,
  },
  materialIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialImage: {
    width: 72,
    height: 72,
    borderRadius: 20,
  },
  materialList: {
    gap: 14,
    paddingBottom: 4,
  },
  materialMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  materialTitle: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  materialTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    maxHeight: '90%',
    gap: 14,
  },
  modalKeyboardAvoiding: {
    width: '100%',
  },
  modalTitle: {
    fontSize: 22,
  },
});
