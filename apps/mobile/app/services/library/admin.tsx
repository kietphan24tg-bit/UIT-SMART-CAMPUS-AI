import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  ContentStack,
  EmptyState,
  FormField,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SkeletonBlock,
  StatusBadge,
} from '@/components/ui';
import {
  libraryApi,
  type AdminLibraryBookRecord,
  type AdminLibraryLoanRecord,
  type LibraryBookCopyRecord,
  type LibraryLoanRequestRecord,
} from '@/services/api/library';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { isAdminRole } from '@/utils/app';

type AdminTab = 'books' | 'requests' | 'loans';

type BookFormState = {
  title: string;
  authors: string;
  subtitle: string;
  isbn13: string;
  subjects: string;
  publisher: string;
  publishedAt: string;
  language: string;
  description: string;
  shelfCode: string;
  coverUrl: string;
  isActive: boolean;
};

type CopyFormState = {
  copyCode: string;
  conditionNote: string;
  acquiredAt: string;
};

const EMPTY_BOOK_FORM: BookFormState = {
  title: '',
  authors: '',
  subtitle: '',
  isbn13: '',
  subjects: '',
  publisher: '',
  publishedAt: '',
  language: '',
  description: '',
  shelfCode: '',
  coverUrl: '',
  isActive: true,
};

const EMPTY_COPY_FORM: CopyFormState = {
  copyCode: '',
  conditionNote: '',
  acquiredAt: '',
};

const EMPTY_BOOKS: AdminLibraryBookRecord[] = [];
const EMPTY_REQUESTS: LibraryLoanRequestRecord[] = [];
const EMPTY_LOANS: AdminLibraryLoanRecord[] = [];

function isApiRouteMissing(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { statusCode?: unknown; status?: unknown; message?: unknown };
  const message = typeof candidate.message === 'string' ? candidate.message : '';
  return (
    (candidate.statusCode === 404 || candidate.status === 404) && message.includes('Cannot GET')
  );
}

function parseSubjectsInput(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toBookForm(book?: AdminLibraryBookRecord | null): BookFormState {
  if (!book) {
    return EMPTY_BOOK_FORM;
  }

  return {
    title: book.title,
    authors: book.authors,
    subtitle: book.subtitle ?? '',
    isbn13: book.isbn13 ?? '',
    subjects: book.subjects.join(', '),
    publisher: book.publisher ?? '',
    publishedAt: book.publishedAt ?? '',
    language: book.language ?? '',
    description: book.description ?? '',
    shelfCode: book.shelfCode ?? '',
    coverUrl: book.coverUrl ?? '',
    isActive: book.isActive,
  };
}

function toCopyForm(copy?: LibraryBookCopyRecord | null): CopyFormState {
  if (!copy) {
    return EMPTY_COPY_FORM;
  }

  return {
    copyCode: copy.copyCode,
    conditionNote: copy.conditionNote ?? '',
    acquiredAt: copy.acquiredAt ? new Date(copy.acquiredAt).toISOString().slice(0, 10) : '',
  };
}

function normalizeDateOnlyInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function serializeCopyAcquiredAt(value: string) {
  const normalized = normalizeDateOnlyInput(value);
  if (!normalized) {
    throw new Error('Ngày nhập không hợp lệ. Vui lòng dùng định dạng YYYY-MM-DD.');
  }

  return `${normalized}T00:00:00.000Z`;
}

function resolveImageMimeType(mimeType?: string | null) {
  if (mimeType === 'image/png' || mimeType === 'image/webp') {
    return mimeType;
  }

  return 'image/jpeg';
}

function resolveImageFileName(fileName?: string | null, mimeType?: string | null) {
  if (fileName) {
    return fileName;
  }

  const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  return `library-book-cover.${extension}`;
}

function getRequestStatusLabel(status: LibraryLoanRequestRecord['status']) {
  switch (status) {
    case 'approved':
      return 'Đã duyệt';
    case 'rejected':
      return 'Từ chối';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return 'Chờ duyệt';
  }
}

function getRequestStatusTone(status: LibraryLoanRequestRecord['status']) {
  switch (status) {
    case 'approved':
      return 'success' as const;
    case 'rejected':
      return 'danger' as const;
    case 'cancelled':
      return 'neutral' as const;
    default:
      return 'warning' as const;
  }
}

function getCopyStatusLabel(status: LibraryBookCopyRecord['status']) {
  switch (status) {
    case 'borrowed':
      return 'Đang mượn';
    case 'reserved':
      return 'Đặt trước';
    case 'lost':
      return 'Mất';
    case 'maintenance':
      return 'Bảo trì';
    default:
      return 'Sẵn sàng';
  }
}

function getCopyStatusTone(status: LibraryBookCopyRecord['status']) {
  switch (status) {
    case 'borrowed':
      return 'info' as const;
    case 'reserved':
      return 'warning' as const;
    case 'lost':
      return 'danger' as const;
    case 'maintenance':
      return 'warning' as const;
    default:
      return 'success' as const;
  }
}

function getLoanStatusLabel(status: AdminLibraryLoanRecord['status']) {
  return status === 'overdue' ? 'Quá hạn' : status === 'returned' ? 'Đã trả' : 'Đang mượn';
}

function getLoanStatusTone(status: AdminLibraryLoanRecord['status']) {
  return status === 'overdue' ? 'danger' : status === 'returned' ? 'neutral' : 'info';
}

function showError(title: string, error: unknown) {
  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error && error.message.trim()
        ? error.message
        : 'Không thể xử lý yêu cầu lúc này. Vui lòng thử lại.';

  Alert.alert(title, message);
}

export default function LibraryAdminScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const admin = isAdminRole(role);
  const { width } = useWindowDimensions();
  const isCompact = width < 390;
  const isVeryCompact = width < 350;
  const metricCardWidth = isVeryCompact ? '100%' : width < 430 ? '48%' : undefined;

  const [activeTab, setActiveTab] = useState<AdminTab>('books');
  const [bookKeyword, setBookKeyword] = useState('');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editingCopyId, setEditingCopyId] = useState<string | null>(null);
  const [bookSheetVisible, setBookSheetVisible] = useState(false);
  const [copySheetVisible, setCopySheetVisible] = useState(false);
  const [bookForm, setBookForm] = useState<BookFormState>(EMPTY_BOOK_FORM);
  const [copyForm, setCopyForm] = useState<CopyFormState>(EMPTY_COPY_FORM);
  const [bookImageError, setBookImageError] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const adminBooksQuery = useQuery({
    queryKey: ['library', 'admin-books'],
    queryFn: () => libraryApi.getAdminBooks(),
    enabled: admin,
  });
  const adminRequestsQuery = useQuery({
    queryKey: ['library', 'admin-loan-requests'],
    queryFn: () => libraryApi.getAdminLoanRequests(),
    enabled: admin,
  });
  const adminLoansQuery = useQuery({
    queryKey: ['library', 'admin-loans'],
    queryFn: () => libraryApi.getAdminLoans(),
    enabled: admin,
    retry: (failureCount, error) => !isApiRouteMissing(error) && failureCount < 1,
  });

  const books = adminBooksQuery.data ?? EMPTY_BOOKS;
  const requests = adminRequestsQuery.data ?? EMPTY_REQUESTS;
  const loans = adminLoansQuery.data ?? EMPTY_LOANS;

  const filteredBooks = useMemo(() => {
    const keyword = bookKeyword.trim().toLowerCase();
    if (!keyword) {
      return books;
    }

    return books.filter((book) =>
      [book.title, book.authors, book.isbn13 ?? '', book.shelfCode ?? ''].some((value) =>
        value.toLowerCase().includes(keyword),
      ),
    );
  }, [bookKeyword, books]);

  const selectedBook = useMemo(
    () => books.find((book) => book.id === selectedBookId) ?? null,
    [books, selectedBookId],
  );
  const editingBook = useMemo(
    () => books.find((book) => book.id === editingBookId) ?? null,
    [books, editingBookId],
  );
  const editingCopy = useMemo(
    () => selectedBook?.copies.find((copy) => copy.id === editingCopyId) ?? null,
    [editingCopyId, selectedBook],
  );

  const pendingRequests = useMemo(
    () => requests.filter((item) => item.status === 'pending'),
    [requests],
  );
  const activeLoans = useMemo(() => loans.filter((item) => item.status !== 'returned'), [loans]);
  const isAdminLoansEndpointUnavailable = isApiRouteMissing(adminLoansQuery.error);

  useEffect(() => {
    if (selectedBookId && !filteredBooks.some((book) => book.id === selectedBookId)) {
      setSelectedBookId(null);
    }
  }, [filteredBooks, selectedBookId]);

  const invalidateLibraryAdminData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['library', 'admin-books'] }),
      queryClient.invalidateQueries({ queryKey: ['library', 'books'] }),
      queryClient.invalidateQueries({ queryKey: ['library', 'book-detail'] }),
    ]);
  };

  const invalidateLoanQueues = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['library', 'admin-loan-requests'] }),
      queryClient.invalidateQueries({ queryKey: ['library', 'admin-loans'] }),
      queryClient.invalidateQueries({ queryKey: ['library', 'my-loans'] }),
      queryClient.invalidateQueries({ queryKey: ['library', 'my-loan-requests'] }),
      queryClient.invalidateQueries({ queryKey: ['library', 'admin-books'] }),
      queryClient.invalidateQueries({ queryKey: ['library', 'books'] }),
      queryClient.invalidateQueries({ queryKey: ['library', 'book-detail'] }),
    ]);
  };

  const createBookMutation = useMutation({
    mutationFn: () =>
      libraryApi.createAdminBook({
        title: bookForm.title.trim(),
        authors: bookForm.authors.trim(),
        subtitle: bookForm.subtitle.trim() || undefined,
        isbn13: bookForm.isbn13.trim() || undefined,
        subjects: parseSubjectsInput(bookForm.subjects),
        publisher: bookForm.publisher.trim() || undefined,
        publishedAt: bookForm.publishedAt.trim() || undefined,
        language: bookForm.language.trim() || undefined,
        description: bookForm.description.trim() || undefined,
        shelfCode: bookForm.shelfCode.trim() || undefined,
        coverUrl: bookForm.coverUrl.trim() || undefined,
        isActive: bookForm.isActive,
      }),
    onSuccess: async (book) => {
      setSelectedBookId(book.id);
      closeBookSheet();
      await invalidateLibraryAdminData();
    },
    onError: (error) => showError('Đầu sách', error),
  });

  const updateBookMutation = useMutation({
    mutationFn: () =>
      libraryApi.updateAdminBook(editingBookId ?? '', {
        title: bookForm.title.trim(),
        authors: bookForm.authors.trim(),
        subtitle: bookForm.subtitle.trim() || '',
        isbn13: bookForm.isbn13.trim() || '',
        subjects: parseSubjectsInput(bookForm.subjects),
        publisher: bookForm.publisher.trim() || '',
        publishedAt: bookForm.publishedAt.trim() || '',
        language: bookForm.language.trim() || '',
        description: bookForm.description.trim() || '',
        shelfCode: bookForm.shelfCode.trim() || '',
        coverUrl: bookForm.coverUrl.trim() || '',
        isActive: bookForm.isActive,
      }),
    onSuccess: async () => {
      closeBookSheet();
      await invalidateLibraryAdminData();
    },
    onError: (error) => showError('Đầu sách', error),
  });

  const deleteBookMutation = useMutation({
    mutationFn: (bookId: string) => libraryApi.deleteAdminBook(bookId),
    onSuccess: async (_, bookId) => {
      if (selectedBookId === bookId) {
        setSelectedBookId(null);
      }
      await invalidateLibraryAdminData();
    },
    onError: (error) => showError('Đầu sách', error),
  });

  const createCopyMutation = useMutation({
    mutationFn: () =>
      libraryApi.createBookCopy(selectedBookId ?? '', {
        copyCode: copyForm.copyCode.trim(),
        conditionNote: copyForm.conditionNote.trim() || undefined,
        acquiredAt: copyForm.acquiredAt.trim()
          ? serializeCopyAcquiredAt(copyForm.acquiredAt)
          : undefined,
      }),
    onSuccess: async () => {
      closeCopySheet();
      await invalidateLibraryAdminData();
    },
    onError: (error) => showError('Bản copy', error),
  });

  const updateCopyMutation = useMutation({
    mutationFn: () =>
      libraryApi.updateBookCopy(editingCopyId ?? '', {
        copyCode: copyForm.copyCode.trim(),
        conditionNote: copyForm.conditionNote.trim() || '',
        acquiredAt: copyForm.acquiredAt.trim() ? serializeCopyAcquiredAt(copyForm.acquiredAt) : '',
      }),
    onSuccess: async () => {
      closeCopySheet();
      await invalidateLibraryAdminData();
    },
    onError: (error) => showError('Bản copy', error),
  });

  const deleteCopyMutation = useMutation({
    mutationFn: (copyId: string) => libraryApi.deleteBookCopy(copyId),
    onSuccess: async () => {
      await invalidateLibraryAdminData();
    },
    onError: (error) => showError('Bản copy', error),
  });

  const markCopyLostMutation = useMutation({
    mutationFn: (copyId: string) => libraryApi.markCopyLost(copyId),
    onSuccess: async () => {
      await invalidateLibraryAdminData();
    },
    onError: (error) => showError('Bản copy', error),
  });

  const markCopyMaintenanceMutation = useMutation({
    mutationFn: (copyId: string) => libraryApi.markCopyMaintenance(copyId),
    onSuccess: async () => {
      await invalidateLibraryAdminData();
    },
    onError: (error) => showError('Bản copy', error),
  });

  const approveRequestMutation = useMutation({
    mutationFn: (requestId: string) => libraryApi.approveLoanRequest(requestId),
    onSuccess: async () => {
      await invalidateLoanQueues();
    },
    onError: (error) => showError('Duyệt yêu cầu', error),
  });

  const rejectRequestMutation = useMutation({
    mutationFn: (requestId: string) => libraryApi.rejectLoanRequest(requestId),
    onSuccess: async () => {
      await invalidateLoanQueues();
    },
    onError: (error) => showError('Từ chối yêu cầu', error),
  });

  const checkInMutation = useMutation({
    mutationFn: (loanId: string) => libraryApi.checkInLoan(loanId),
    onSuccess: async () => {
      await invalidateLoanQueues();
    },
    onError: (error) => showError('Trả sách', error),
  });

  if (!admin) {
    return (
      <Screen>
        <ContentStack narrow>
          <EmptyState
            icon="lock-closed-outline"
            title="Bạn không có quyền truy cập"
            description="Màn hình này chỉ dành cho admin và super admin."
            actionLabel="Quay lại"
            onActionPress={() => router.back()}
          />
        </ContentStack>
      </Screen>
    );
  }

  async function handlePickCoverImage() {
    try {
      setBookImageError(null);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Cần quyền truy cập', 'Hãy cho phép ứng dụng truy cập thư viện ảnh.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
        selectionLimit: 1,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      setIsUploadingCover(true);
      const mimeType = resolveImageMimeType(asset.mimeType);
      const processedAsset = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1200, height: 1600 } }],
        { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG },
      );

      const uploaded = await libraryApi.uploadBookCover(
        processedAsset.uri,
        resolveImageFileName(asset.fileName, mimeType),
        resolveImageMimeType(mimeType),
      );

      setBookForm((prev) => ({ ...prev, coverUrl: uploaded.imageUrl }));
    } catch (error) {
      console.error('[library-admin] uploadBookCover failed', error);
      const message = error instanceof Error ? error.message : 'Không thể tải ảnh bìa lên.';
      setBookImageError(message);
      Alert.alert('Ảnh bìa sách', message);
    } finally {
      setIsUploadingCover(false);
    }
  }

  function openCreateBookSheet() {
    setEditingBookId(null);
    setBookForm(EMPTY_BOOK_FORM);
    setBookImageError(null);
    setBookSheetVisible(true);
  }

  function openEditBookSheet(book: AdminLibraryBookRecord) {
    setEditingBookId(book.id);
    setBookForm(toBookForm(book));
    setBookImageError(null);
    setBookSheetVisible(true);
  }

  function closeBookSheet() {
    setBookSheetVisible(false);
    setEditingBookId(null);
    setBookForm(EMPTY_BOOK_FORM);
    setBookImageError(null);
  }

  function openCreateCopySheet(bookId: string) {
    setSelectedBookId(bookId);
    setEditingCopyId(null);
    setCopyForm(EMPTY_COPY_FORM);
    setCopySheetVisible(true);
  }

  function openEditCopySheet(bookId: string, copy: LibraryBookCopyRecord) {
    setSelectedBookId(bookId);
    setEditingCopyId(copy.id);
    setCopyForm(toCopyForm(copy));
    setCopySheetVisible(true);
  }

  function closeCopySheet() {
    setCopySheetVisible(false);
    setEditingCopyId(null);
    setCopyForm(EMPTY_COPY_FORM);
  }

  function handleSubmitBook() {
    if (!bookForm.title.trim() || !bookForm.authors.trim()) {
      Alert.alert('Đầu sách', 'Vui lòng nhập tên sách và tác giả.');
      return;
    }

    if (editingBookId) {
      updateBookMutation.mutate();
      return;
    }

    createBookMutation.mutate();
  }

  function handleSubmitCopy() {
    if (!selectedBookId) {
      Alert.alert('Bản copy', 'Hãy chọn đầu sách trước khi thêm bản copy.');
      return;
    }

    if (!copyForm.copyCode.trim()) {
      Alert.alert('Bản copy', 'Vui lòng nhập mã bản copy.');
      return;
    }

    if (copyForm.acquiredAt.trim() && !normalizeDateOnlyInput(copyForm.acquiredAt)) {
      Alert.alert('Bản copy', 'Ngày nhập không hợp lệ. Vui lòng dùng định dạng YYYY-MM-DD.');
      return;
    }

    if (editingCopyId) {
      updateCopyMutation.mutate();
      return;
    }

    createCopyMutation.mutate();
  }

  const isLoadingCurrentTab =
    (activeTab === 'books' && adminBooksQuery.isLoading) ||
    (activeTab === 'requests' && adminRequestsQuery.isLoading) ||
    (activeTab === 'loans' && adminLoansQuery.isLoading);

  const hasCurrentTabError =
    (activeTab === 'books' && adminBooksQuery.isError) ||
    (activeTab === 'requests' && adminRequestsQuery.isError) ||
    (activeTab === 'loans' && adminLoansQuery.isError && !isAdminLoansEndpointUnavailable);

  return (
    <Screen>
      <ContentStack gap={14} overlapHero={false}>
        <View style={styles.headerBlock}>
          <View style={styles.headerTextWrap}>
            <Text
              style={[
                styles.headerTitle,
                { color: theme.colors.text, fontFamily: theme.fonts.bold },
              ]}
            >
              Thư viện Admin
            </Text>
            <Text
              style={[
                styles.headerSubtitle,
                { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
              ]}
            >
              Quản lý danh mục sách, xét duyệt yêu cầu mượn và theo dõi quá trình trả sách trên một
              màn hình.
            </Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <MetricCard
            label="Đầu sách"
            value={`${books.length}`}
            helper="Danh mục hiện có"
            tone="primary"
            cardStyle={metricCardWidth ? { width: metricCardWidth } : undefined}
          />
          <MetricCard
            label="Chờ xử lý"
            value={`${pendingRequests.length}`}
            helper="Yêu cầu mượn mới"
            tone="warning"
            cardStyle={metricCardWidth ? { width: metricCardWidth } : undefined}
          />
          <MetricCard
            label="Đang mượn"
            value={`${activeLoans.length}`}
            helper="Cần theo dõi trả sách"
            tone="info"
            cardStyle={metricCardWidth ? { width: metricCardWidth } : undefined}
          />
        </View>

        <View style={[styles.tabRow, isCompact && styles.tabRowCompact]}>
          <View
            style={[
              styles.tabRail,
              styles.tabRailFill,
              { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border },
            ]}
          >
            <TabChip
              label="Đầu sách"
              active={activeTab === 'books'}
              onPress={() => setActiveTab('books')}
            />
            <TabChip
              label="Chờ xử lý"
              active={activeTab === 'requests'}
              onPress={() => setActiveTab('requests')}
            />
            <TabChip
              label="Đang mượn"
              active={activeTab === 'loans'}
              onPress={() => setActiveTab('loans')}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thêm đầu sách"
            onPress={openCreateBookSheet}
            style={({ pressed }) => [
              styles.addIconButton,
              {
                backgroundColor: theme.colors.primary,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <Ionicons name="add" size={20} color={theme.colors.onPrimary} />
          </Pressable>
        </View>

        {isLoadingCurrentTab ? (
          <View style={styles.stack}>
            <SkeletonBlock height={144} />
            <SkeletonBlock height={144} />
          </View>
        ) : null}

        {!isLoadingCurrentTab && hasCurrentTabError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Không tải được dữ liệu thư viện"
            description="Vui lòng thử lại sau."
            actionLabel="Thử lại"
            onActionPress={() => {
              if (activeTab === 'books') {
                void adminBooksQuery.refetch();
              } else if (activeTab === 'requests') {
                void adminRequestsQuery.refetch();
              } else {
                void adminLoansQuery.refetch();
              }
            }}
          />
        ) : null}

        {!isLoadingCurrentTab && !hasCurrentTabError ? (
          <>
            {activeTab === 'books' ? (
              <>
                <View
                  style={[
                    styles.panel,
                    {
                      backgroundColor: theme.colors.surfaceElevated,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.panelTitle,
                      { color: theme.colors.text, fontFamily: theme.fonts.semibold },
                    ]}
                  >
                    Quản lý đầu sách
                  </Text>
                  <FormField
                    label="Tìm kiếm"
                    value={bookKeyword}
                    onChangeText={setBookKeyword}
                    placeholder="Tên sách, tác giả, ISBN, mã kệ..."
                  />
                </View>

                {filteredBooks.length === 0 ? (
                  <EmptyState
                    icon="book-outline"
                    title="Chưa có đầu sách phù hợp"
                    description="Hãy thêm đầu sách mới hoặc đổi từ khóa tìm kiếm."
                  />
                ) : (
                  <View style={styles.stack}>
                    {filteredBooks.map((book) => {
                      const expanded = selectedBookId === book.id;

                      return (
                        <View
                          key={book.id}
                          style={[
                            styles.card,
                            {
                              backgroundColor: theme.colors.surfaceElevated,
                              borderColor: expanded ? theme.colors.primary : theme.colors.border,
                            },
                          ]}
                        >
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => setSelectedBookId(expanded ? null : book.id)}
                            style={({ pressed }) => [
                              styles.bookHeader,
                              isCompact && styles.bookHeaderCompact,
                              { opacity: pressed ? 0.88 : 1 },
                            ]}
                          >
                            {book.coverUrl ? (
                              <Image
                                source={{ uri: book.coverUrl }}
                                style={styles.thumbnail}
                                contentFit="cover"
                              />
                            ) : (
                              <View
                                style={[
                                  styles.thumbnailPlaceholder,
                                  {
                                    backgroundColor: theme.colors.surfaceSubtle,
                                    borderColor: theme.colors.border,
                                  },
                                ]}
                              >
                                <Ionicons
                                  name="book-outline"
                                  size={20}
                                  color={theme.colors.textSoft}
                                />
                              </View>
                            )}
                            <View style={styles.bookMeta}>
                              <View style={styles.bookMetaMain}>
                                <Text
                                  style={[
                                    styles.cardTitle,
                                    { color: theme.colors.text, fontFamily: theme.fonts.semibold },
                                  ]}
                                >
                                  {book.title}
                                </Text>
                                <Text
                                  style={[
                                    styles.body,
                                    {
                                      color: theme.colors.textMuted,
                                      fontFamily: theme.fonts.regular,
                                    },
                                  ]}
                                >
                                  {book.authors}
                                </Text>
                                <Text
                                  style={[
                                    styles.meta,
                                    {
                                      color: theme.colors.textSoft,
                                      fontFamily: theme.fonts.medium,
                                    },
                                  ]}
                                >
                                  Số lượng: {book.availableCopies}/{book.copies.length}
                                  {book.shelfCode ? ` · Kệ ${book.shelfCode}` : ''}
                                </Text>
                              </View>
                              <View style={styles.bookChevronWrap}>
                                <Ionicons
                                  name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'}
                                  size={18}
                                  color={theme.colors.textSoft}
                                />
                              </View>
                            </View>
                          </Pressable>

                          {expanded ? (
                            <View
                              style={[styles.detailPanel, { borderColor: theme.colors.border }]}
                            >
                              <View
                                style={[
                                  styles.bookActionRow,
                                  isCompact && styles.bookActionRowCompact,
                                ]}
                              >
                                <SecondaryButton
                                  label="Sửa sách"
                                  onPress={() => openEditBookSheet(book)}
                                  style={styles.bookPrimaryButton}
                                />
                                <SmallDangerButton
                                  label="Xóa đầu sách"
                                  onPress={() =>
                                    Alert.alert(
                                      'Xóa đầu sách',
                                      'Bạn có chắc muốn xóa đầu sách này?',
                                      [
                                        { text: 'Hủy', style: 'cancel' },
                                        {
                                          text: 'Xóa',
                                          style: 'destructive',
                                          onPress: () => deleteBookMutation.mutate(book.id),
                                        },
                                      ],
                                    )
                                  }
                                  style={styles.bookDangerButton}
                                />
                              </View>

                              <View style={styles.detailBlock}>
                                <View
                                  style={[styles.rowBetween, isCompact && styles.rowBetweenCompact]}
                                >
                                  <Text
                                    style={[
                                      styles.detailTitle,
                                      {
                                        color: theme.colors.text,
                                        fontFamily: theme.fonts.semibold,
                                      },
                                    ]}
                                  >
                                    Bản copy ({book.copies.length})
                                  </Text>
                                  <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Thêm copy"
                                    onPress={() => openCreateCopySheet(book.id)}
                                    style={({ pressed }) => [
                                      styles.copyAddIconButton,
                                      {
                                        backgroundColor: theme.colors.primary,
                                        opacity: pressed ? 0.88 : 1,
                                      },
                                      isCompact && styles.copyAddIconButtonCompact,
                                    ]}
                                  >
                                    <Ionicons name="add" size={18} color={theme.colors.onPrimary} />
                                  </Pressable>
                                </View>
                                {book.copies.length === 0 ? (
                                  <Text
                                    style={[
                                      styles.body,
                                      {
                                        color: theme.colors.textMuted,
                                        fontFamily: theme.fonts.regular,
                                      },
                                    ]}
                                  >
                                    Chưa có bản copy nào cho đầu sách này.
                                  </Text>
                                ) : (
                                  <View style={styles.stack}>
                                    {book.copies.map((copy) => (
                                      <View
                                        key={copy.id}
                                        style={[
                                          styles.copyCard,
                                          {
                                            backgroundColor: theme.colors.surface,
                                            borderColor: theme.colors.border,
                                          },
                                        ]}
                                      >
                                        <View
                                          style={[
                                            styles.rowBetween,
                                            isCompact && styles.rowBetweenCompact,
                                          ]}
                                        >
                                          <View style={styles.flexWrap}>
                                            <Text
                                              style={[
                                                styles.copyTitle,
                                                {
                                                  color: theme.colors.text,
                                                  fontFamily: theme.fonts.semibold,
                                                },
                                              ]}
                                            >
                                              {copy.copyCode}
                                            </Text>
                                            <Text
                                              style={[
                                                styles.meta,
                                                {
                                                  color: theme.colors.textSoft,
                                                  fontFamily: theme.fonts.regular,
                                                },
                                              ]}
                                            >
                                              Ngày nhập:{' '}
                                              {copy.acquiredAt
                                                ? new Date(copy.acquiredAt).toLocaleDateString(
                                                    'vi-VN',
                                                  )
                                                : 'Chưa cập nhật'}
                                            </Text>
                                            {copy.conditionNote ? (
                                              <Text
                                                style={[
                                                  styles.meta,
                                                  {
                                                    color: theme.colors.textMuted,
                                                    fontFamily: theme.fonts.regular,
                                                  },
                                                ]}
                                              >
                                                Ghi chú: {copy.conditionNote}
                                              </Text>
                                            ) : null}
                                          </View>
                                        </View>

                                        <View
                                          style={[
                                            styles.copyActionRow,
                                            isCompact && styles.copyActionRowCompact,
                                          ]}
                                        >
                                          <SecondaryButton
                                            label="Sửa"
                                            onPress={() => openEditCopySheet(book.id, copy)}
                                            style={styles.bookPrimaryButton}
                                          />
                                          <SmallDangerButton
                                            label="Xóa"
                                            onPress={() =>
                                              Alert.alert(
                                                'Xóa bản copy',
                                                'Bạn có chắc muốn xóa bản copy này?',
                                                [
                                                  { text: 'Hủy', style: 'cancel' },
                                                  {
                                                    text: 'Xóa',
                                                    style: 'destructive',
                                                    onPress: () =>
                                                      deleteCopyMutation.mutate(copy.id),
                                                  },
                                                ],
                                              )
                                            }
                                            style={styles.bookDangerButton}
                                          />
                                        </View>
                                      </View>
                                    ))}
                                  </View>
                                )}
                              </View>
                            </View>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                )}
              </>
            ) : null}

            {activeTab === 'requests' ? (
              pendingRequests.length === 0 ? (
                <EmptyState
                  icon="document-text-outline"
                  title="Không có yêu cầu chờ duyệt"
                  description="Các yêu cầu mượn mới sẽ xuất hiện tại đây."
                />
              ) : (
                <View style={styles.stack}>
                  {pendingRequests.map((request) => (
                    <View
                      key={request.id}
                      style={[
                        styles.card,
                        {
                          backgroundColor: theme.colors.surfaceElevated,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <View style={[styles.rowBetween, isCompact && styles.rowBetweenCompact]}>
                        <View style={styles.flexWrap}>
                          <Text
                            style={[
                              styles.cardTitle,
                              { color: theme.colors.text, fontFamily: theme.fonts.semibold },
                            ]}
                          >
                            {request.book.title}
                          </Text>
                          <Text
                            style={[
                              styles.body,
                              { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
                            ]}
                          >
                            {request.requester.fullName} ·{' '}
                            {request.requester.studentId || request.requester.email}
                          </Text>
                          <Text
                            style={[
                              styles.meta,
                              { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
                            ]}
                          >
                            Copy: {request.copy.copyCode} · Tạo lúc{' '}
                            {new Date(request.createdAt).toLocaleString('vi-VN')}
                          </Text>
                          {request.note ? (
                            <Text
                              style={[
                                styles.meta,
                                { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
                              ]}
                            >
                              Ghi chú: {request.note}
                            </Text>
                          ) : null}
                        </View>
                        <StatusBadge
                          label={getRequestStatusLabel(request.status)}
                          tone={getRequestStatusTone(request.status)}
                          size="sm"
                        />
                      </View>

                      <View style={styles.actionRow}>
                        <PrimaryButton
                          label="Duyệt"
                          onPress={() => approveRequestMutation.mutate(request.id)}
                          loading={approveRequestMutation.isPending}
                          style={styles.gridButton}
                        />
                        <SecondaryButton
                          label="Từ chối"
                          onPress={() => rejectRequestMutation.mutate(request.id)}
                          loading={rejectRequestMutation.isPending}
                          style={styles.gridButton}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              )
            ) : null}

            {activeTab === 'loans' ? (
              isAdminLoansEndpointUnavailable ? (
                <EmptyState
                  icon="server-outline"
                  title="Server chưa hỗ trợ danh sách mượn"
                  description="Backend bạn đang kết nối chưa có endpoint admin loans, nên tab này tạm thời chưa dùng được trên server live."
                />
              ) : activeLoans.length === 0 ? (
                <EmptyState
                  icon="receipt-outline"
                  title="Không có sách đang mượn"
                  description="Khi có phiếu mượn đang active, admin sẽ xác nhận trả từ đây."
                />
              ) : (
                <View style={styles.stack}>
                  {activeLoans.map((loan) => (
                    <View
                      key={loan.id}
                      style={[
                        styles.card,
                        {
                          backgroundColor: theme.colors.surfaceElevated,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <View style={[styles.rowBetween, isCompact && styles.rowBetweenCompact]}>
                        <View style={styles.flexWrap}>
                          <Text
                            style={[
                              styles.cardTitle,
                              { color: theme.colors.text, fontFamily: theme.fonts.semibold },
                            ]}
                          >
                            {loan.book.title}
                          </Text>
                          <Text
                            style={[
                              styles.body,
                              { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
                            ]}
                          >
                            {loan.borrower.fullName} ·{' '}
                            {loan.borrower.studentId || loan.borrower.email}
                          </Text>
                          <Text
                            style={[
                              styles.meta,
                              { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
                            ]}
                          >
                            Copy: {loan.copy.copyCode} · Hạn trả{' '}
                            {new Date(loan.dueAt).toLocaleDateString('vi-VN')}
                          </Text>
                          {loan.borrowNote ? (
                            <Text
                              style={[
                                styles.meta,
                                { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
                              ]}
                            >
                              Ghi chú mượn: {loan.borrowNote}
                            </Text>
                          ) : null}
                        </View>
                        <StatusBadge
                          label={getLoanStatusLabel(loan.status)}
                          tone={getLoanStatusTone(loan.status)}
                          size="sm"
                        />
                      </View>

                      <PrimaryButton
                        label="Xác nhận trả sách"
                        onPress={() =>
                          Alert.alert(
                            'Xác nhận trả sách',
                            'Xác nhận bạn đã nhận lại cuốn sách này?',
                            [
                              { text: 'Hủy', style: 'cancel' },
                              {
                                text: 'Xác nhận',
                                onPress: () => checkInMutation.mutate(loan.id),
                              },
                            ],
                          )
                        }
                        loading={checkInMutation.isPending}
                      />
                    </View>
                  ))}
                </View>
              )
            ) : null}
          </>
        ) : null}
      </ContentStack>

      <BottomSheet
        visible={bookSheetVisible}
        title={editingBook ? 'Chỉnh sửa đầu sách' : 'Thêm đầu sách'}
        subtitle="Thông tin đầu sách sẽ hiển thị cho sinh viên và giảng viên."
        onClose={closeBookSheet}
      >
        <View style={styles.sheetContent}>
          <FormField
            label="Tên sách"
            value={bookForm.title}
            onChangeText={(value) => setBookForm((prev) => ({ ...prev, title: value }))}
          />
          <FormField
            label="Tác giả"
            value={bookForm.authors}
            onChangeText={(value) => setBookForm((prev) => ({ ...prev, authors: value }))}
          />
          <FormField
            label="Phụ đề"
            value={bookForm.subtitle}
            onChangeText={(value) => setBookForm((prev) => ({ ...prev, subtitle: value }))}
          />
          <FormField
            label="ISBN-13"
            value={bookForm.isbn13}
            onChangeText={(value) => setBookForm((prev) => ({ ...prev, isbn13: value }))}
          />
          <FormField
            label="Chủ đề"
            value={bookForm.subjects}
            onChangeText={(value) => setBookForm((prev) => ({ ...prev, subjects: value }))}
            hint="Nhập nhiều chủ đề, ngăn cách bằng dấu phẩy."
          />
          <FormField
            label="Nhà xuất bản"
            value={bookForm.publisher}
            onChangeText={(value) => setBookForm((prev) => ({ ...prev, publisher: value }))}
          />
          <FormField
            label="Năm xuất bản"
            value={bookForm.publishedAt}
            onChangeText={(value) => setBookForm((prev) => ({ ...prev, publishedAt: value }))}
          />
          <FormField
            label="Ngôn ngữ"
            value={bookForm.language}
            onChangeText={(value) => setBookForm((prev) => ({ ...prev, language: value }))}
          />
          <FormField
            label="Mã kệ"
            value={bookForm.shelfCode}
            onChangeText={(value) => setBookForm((prev) => ({ ...prev, shelfCode: value }))}
          />
          <FormField
            label="Mô tả"
            value={bookForm.description}
            onChangeText={(value) => setBookForm((prev) => ({ ...prev, description: value }))}
            multiline
            numberOfLines={4}
            style={styles.multilineInput}
          />

          <View style={styles.imageBlock}>
            <Text
              style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}
            >
              Ảnh bìa sách
            </Text>
            <View
              style={[
                styles.imageUploadCard,
                { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border },
              ]}
            >
              {!bookForm.coverUrl ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Tải ảnh bìa"
                  onPress={() => void handlePickCoverImage()}
                  disabled={isUploadingCover}
                  style={({ pressed }) => [
                    styles.imageUploadDropzone,
                    {
                      borderColor: theme.colors.border,
                      opacity: isUploadingCover ? 0.56 : pressed ? 0.84 : 1,
                    },
                  ]}
                >
                  <Ionicons name="cloud-upload-outline" size={24} color={theme.colors.primary} />
                  <Text
                    style={[
                      styles.body,
                      { color: theme.colors.text, fontFamily: theme.fonts.medium },
                    ]}
                  >
                    Tải ảnh
                  </Text>
                </Pressable>
              ) : (
                <View style={styles.imageUploadPreviewWrap}>
                  <Image
                    source={{ uri: bookForm.coverUrl }}
                    style={styles.imageUploadPreviewImage}
                    contentFit="cover"
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Xóa ảnh bìa"
                    onPress={() => {
                      setBookImageError(null);
                      setBookForm((prev) => ({ ...prev, coverUrl: '' }));
                    }}
                    disabled={isUploadingCover}
                    style={({ pressed }) => [
                      styles.imageRemoveButton,
                      {
                        backgroundColor: theme.colors.surfaceElevated,
                        borderColor: theme.colors.border,
                        opacity: isUploadingCover ? 0.56 : pressed ? 0.84 : 1,
                      },
                    ]}
                  >
                    <Ionicons name="close" size={14} color={theme.colors.text} />
                  </Pressable>
                </View>
              )}
              {isUploadingCover ? (
                <View style={styles.imageUploadProgress}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text
                    style={[
                      styles.meta,
                      { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
                    ]}
                  >
                    Đang tải ảnh...
                  </Text>
                </View>
              ) : null}
            </View>
            {bookImageError ? (
              <Text
                style={[
                  styles.errorText,
                  { color: theme.colors.danger, fontFamily: theme.fonts.regular },
                ]}
              >
                {bookImageError}
              </Text>
            ) : null}
          </View>

          <View style={styles.actionRow}>
            <SecondaryButton label="Đóng" onPress={closeBookSheet} style={styles.flexButton} />
            <PrimaryButton
              label={editingBook ? 'Lưu đầu sách' : 'Tạo đầu sách'}
              onPress={handleSubmitBook}
              loading={createBookMutation.isPending || updateBookMutation.isPending}
              style={styles.flexButton}
            />
          </View>
        </View>
      </BottomSheet>

      <BottomSheet
        visible={copySheetVisible}
        title={editingCopy ? 'Chỉnh sửa bản copy' : 'Thêm bản copy'}
        subtitle={
          selectedBook
            ? `Đầu sách: ${selectedBook.title}`
            : 'Hãy chọn đầu sách trước khi thêm copy.'
        }
        onClose={closeCopySheet}
      >
        <View style={styles.sheetContent}>
          <FormField
            label="Mã bản copy"
            value={copyForm.copyCode}
            onChangeText={(value) => setCopyForm((prev) => ({ ...prev, copyCode: value }))}
          />
          <FormField
            label="Ngày nhập"
            value={copyForm.acquiredAt}
            onChangeText={(value) => setCopyForm((prev) => ({ ...prev, acquiredAt: value }))}
            hint="Định dạng YYYY-MM-DD"
          />
          <FormField
            label="Ghi chú tình trạng"
            value={copyForm.conditionNote}
            onChangeText={(value) => setCopyForm((prev) => ({ ...prev, conditionNote: value }))}
            multiline
            numberOfLines={3}
            style={styles.multilineInput}
          />
          <View style={styles.actionRow}>
            <SecondaryButton label="Đóng" onPress={closeCopySheet} style={styles.flexButton} />
            <PrimaryButton
              label={editingCopy ? 'Lưu bản copy' : 'Tạo bản copy'}
              onPress={handleSubmitCopy}
              loading={createCopyMutation.isPending || updateCopyMutation.isPending}
              disabled={!selectedBook}
              style={styles.flexButton}
            />
          </View>
        </View>
      </BottomSheet>
    </Screen>
  );
}

function TabChip({
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
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tabChip,
        {
          backgroundColor: active ? theme.colors.surface : 'transparent',
          borderColor: active ? theme.colors.border : 'transparent',
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.tabChipText,
          {
            color: active ? theme.colors.text : theme.colors.textSoft,
            fontFamily: active ? theme.fonts.semibold : theme.fonts.medium,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function MetricCard({
  label,
  value,
  helper,
  tone,
  cardStyle,
}: {
  label: string;
  value: string;
  helper: string;
  tone: 'primary' | 'warning' | 'info';
  cardStyle?: object;
}) {
  const theme = useAppTheme();

  const toneStyles = {
    primary: {
      backgroundColor: theme.colors.primarySurface,
      borderColor: theme.colors.primary,
      valueColor: theme.colors.primary,
    },
    warning: {
      backgroundColor: theme.colors.warningSurface,
      borderColor: theme.colors.warning,
      valueColor: theme.colors.warning,
    },
    info: {
      backgroundColor: theme.colors.infoSurface,
      borderColor: theme.colors.info,
      valueColor: theme.colors.info,
    },
  }[tone];

  return (
    <View
      style={[
        styles.metricCard,
        cardStyle,
        {
          backgroundColor: toneStyles.backgroundColor,
          borderColor: toneStyles.borderColor,
        },
      ]}
    >
      <Text
        style={[styles.metricLabel, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}
      >
        {label}
      </Text>
      <Text
        style={[styles.metricValue, { color: toneStyles.valueColor, fontFamily: theme.fonts.bold }]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.metricHelper,
          { color: theme.colors.textSoft, fontFamily: theme.fonts.regular },
        ]}
      >
        {helper}
      </Text>
    </View>
  );
}

function InlineActionLink({
  label,
  onPress,
  tone = 'primary',
}: {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'warning' | 'danger';
}) {
  const theme = useAppTheme();

  const color =
    tone === 'danger'
      ? theme.colors.danger
      : tone === 'warning'
        ? theme.colors.warning
        : theme.colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.72 : 1 }]}
    >
      <Text style={[styles.inlineActionLink, { color, fontFamily: theme.fonts.semibold }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function SmallDangerButton({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style?: object;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.smallDangerButton,
        {
          backgroundColor: theme.colors.dangerSurface,
          borderColor: theme.colors.danger,
          opacity: pressed ? 0.84 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.smallDangerButtonLabel,
          { color: theme.colors.danger, fontFamily: theme.fonts.semibold },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function BottomSheet({
  visible,
  title,
  subtitle,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const theme = useAppTheme();

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable
          style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay }]}
          onPress={onClose}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
          style={styles.sheetKeyboardAvoider}
        >
          <View
            style={[
              styles.sheetPanel,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <View style={styles.sheetHandleWrap}>
              <View style={[styles.sheetHandle, { backgroundColor: theme.colors.border }]} />
            </View>
            <View style={styles.sheetHeader}>
              <View style={styles.flexWrap}>
                <Text
                  style={[
                    styles.sheetTitle,
                    { color: theme.colors.text, fontFamily: theme.fonts.bold },
                  ]}
                >
                  {title}
                </Text>
                {subtitle ? (
                  <Text
                    style={[
                      styles.sheetSubtitle,
                      { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
                    ]}
                  >
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              <Pressable accessibilityRole="button" onPress={onClose} style={styles.sheetClose}>
                <Ionicons name="close" size={20} color={theme.colors.text} />
              </Pressable>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              contentContainerStyle={styles.sheetScrollContent}
            >
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    gap: 8,
  },
  headerTextWrap: {
    gap: 6,
  },
  headerTitle: {
    fontSize: 28,
    lineHeight: 34,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 21,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tabRowCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  tabRailFill: {
    flex: 1,
  },
  addIconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 4,
  },
  metricLabel: {
    fontSize: 13,
  },
  metricValue: {
    fontSize: 26,
  },
  metricHelper: {
    fontSize: 11,
    lineHeight: 16,
  },
  tabRail: {
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderRadius: 16,
    padding: 6,
  },
  tabChip: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  tabChipText: {
    fontSize: 14,
  },
  stack: {
    gap: 12,
  },
  panel: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  panelTitle: {
    fontSize: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 10,
    overflow: 'hidden',
  },
  bookHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  bookHeaderCompact: {
    alignItems: 'stretch',
  },
  bookMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  bookMetaMain: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  bookChevronWrap: {
    width: 24,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  thumbnail: {
    width: 52,
    height: 72,
    borderRadius: 12,
  },
  thumbnailPlaceholder: {
    width: 52,
    height: 72,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
  },
  meta: {
    fontSize: 12,
    lineHeight: 17,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  compactActionGrid: {
    alignItems: 'stretch',
  },
  bookActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bookActionRowCompact: {
    flexDirection: 'column',
  },
  bookPrimaryButton: {
    flex: 1,
    minWidth: 112,
  },
  bookDangerButton: {
    flex: 1,
    minWidth: 112,
  },
  flexButton: {
    flex: 1,
    minWidth: 112,
  },
  gridButton: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '47%',
    minWidth: 0,
  },
  gridButtonFull: {
    flexBasis: '100%',
  },
  detailPanel: {
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 12,
  },
  detailBlock: {
    gap: 8,
  },
  copyAddIconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copyAddIconButtonCompact: {
    alignSelf: 'flex-end',
  },
  inlineLinkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 16,
  },
  inlineActionLink: {
    fontSize: 13,
    lineHeight: 18,
  },
  detailTitle: {
    fontSize: 15,
  },
  copyCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  copyTitle: {
    fontSize: 14,
  },
  copyActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  copyActionRowCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  smallDangerButton: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
  },
  smallDangerButtonLabel: {
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  rowBetweenCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  flexWrap: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  inlineActionButtonCompact: {
    width: '100%',
  },
  label: {
    fontSize: 13,
  },
  imageBlock: {
    gap: 8,
  },
  imageUploadCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 12,
  },
  imageUploadDropzone: {
    minHeight: 120,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imageUploadPreviewWrap: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
  },
  imageUploadPreviewImage: {
    width: '100%',
    aspectRatio: 1,
  },
  imageRemoveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageUploadProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 18,
  },
  multilineInput: {
    minHeight: 88,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetKeyboardAvoider: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  sheetPanel: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '86%',
    minHeight: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  sheetHandle: {
    width: 48,
    height: 4,
    borderRadius: 999,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 10,
  },
  sheetTitle: {
    fontSize: 18,
  },
  sheetSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  sheetClose: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  sheetScrollContent: {
    paddingBottom: 20,
  },
  sheetContent: {
    gap: 14,
  },
});
