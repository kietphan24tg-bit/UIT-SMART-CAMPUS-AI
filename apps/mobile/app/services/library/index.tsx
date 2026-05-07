import { Ionicons } from '@expo/vector-icons';
import { USER_ROLES } from '@smart-campus/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MetricGrid } from '@/components/tasks';
import {
  ContentStack,
  EmptyState,
  FormField,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionCard,
  StatusBadge,
  TopHero,
} from '@/components/ui';
import {
  libraryApi,
  type LibraryBookCopyRecord,
  type LibraryBookDetail,
  type LibraryBookListItem,
  type LibraryLoanRequestRecord,
} from '@/services/api/library';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { isAdminRole } from '@/utils/app';

type LibraryTab = 'discover' | 'requests';

function getRoleCanBorrow(role?: string | null) {
  return role === USER_ROLES.STUDENT || role === USER_ROLES.LECTURER;
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
      return 'info' as const;
    default:
      return 'warning' as const;
  }
}

export default function LibraryScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const [hasSyncedRole, setHasSyncedRole] = useState(false);
  const [activeTab, setActiveTab] = useState<LibraryTab>('discover');
  const [keyword, setKeyword] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | undefined>(undefined);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedCopyId, setSelectedCopyId] = useState<string | null>(null);
  const [requestNote, setRequestNote] = useState('');
  const canBorrow = getRoleCanBorrow(role);

  useEffect(() => {
    if (isAdminRole(role)) {
      router.replace('/services/library/admin');
    }
  }, [role, router]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void (async () => {
        try {
          await refreshProfile();
        } catch {
          // Keep the current store snapshot if profile refresh is temporarily unavailable.
        } finally {
          if (active) {
            setHasSyncedRole(true);
          }
        }
      })();

      return () => {
        active = false;
      };
    }, [refreshProfile]),
  );

  const booksQuery = useQuery({
    queryKey: ['library', 'books', keyword, selectedSubject],
    queryFn: () =>
      libraryApi.listBooks({
        q: keyword.trim() || undefined,
        subject: selectedSubject,
        limit: 30,
      }),
  });
  const loansQuery = useQuery({
    queryKey: ['library', 'my-loans'],
    queryFn: () => libraryApi.getMyLoans(),
    enabled: hasSyncedRole && canBorrow,
  });
  const loanRequestsQuery = useQuery({
    queryKey: ['library', 'my-loan-requests'],
    queryFn: () => libraryApi.getMyLoanRequests(),
    enabled: hasSyncedRole && canBorrow,
  });
  const selectedBookQuery = useQuery({
    queryKey: ['library', 'book-detail', selectedBookId],
    queryFn: () => libraryApi.getBook(selectedBookId ?? ''),
    enabled: Boolean(selectedBookId) && canBorrow,
  });

  const createLoanRequestMutation = useMutation({
    mutationFn: () =>
      libraryApi.createLoanRequest({
        bookId: selectedBookId ?? '',
        copyId: selectedCopyId ?? '',
        note: requestNote.trim() || undefined,
      }),
    onSuccess: async () => {
      setRequestNote('');
      setSelectedCopyId(null);
      setSelectedBookId(null);
      setActiveTab('requests');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['library', 'my-loan-requests'] }),
        queryClient.invalidateQueries({ queryKey: ['library', 'books'] }),
      ]);
    },
  });
  const cancelLoanRequestMutation = useMutation({
    mutationFn: (requestId: string) => libraryApi.cancelLoanRequest(requestId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['library', 'my-loan-requests'] });
    },
  });
  const deleteLoanRequestMutation = useMutation({
    mutationFn: (requestId: string) => libraryApi.deleteLoanRequest(requestId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['library', 'my-loan-requests'] });
    },
  });

  useEffect(() => {
    setSelectedCopyId(null);
    setRequestNote('');
  }, [selectedBookId]);

  useEffect(() => {
    if (!selectedBookQuery.data) {
      return;
    }

    const firstAvailableCopy = selectedBookQuery.data.copies.find((copy) => copy.status === 'available');
    if (firstAvailableCopy) {
      setSelectedCopyId((current) => current ?? firstAvailableCopy.id);
    }
  }, [selectedBookQuery.data]);

  const books = booksQuery.data?.items ?? [];
  const loans = loansQuery.data ?? [];
  const loanRequests = loanRequestsQuery.data ?? [];
  const activeLoans = loans.filter((item) => item.status !== 'returned');
  const pendingRequests = loanRequests.filter((item) => item.status === 'pending');
  const availableCopies = (selectedBookQuery.data?.copies ?? []).filter((copy) => copy.status === 'available');
  const subjects = useMemo(() => {
    const all = new Set<string>();
    for (const item of books) {
      for (const subject of item.subjects ?? []) {
        if (subject?.trim()) {
          all.add(subject.trim());
        }
      }
    }
    return [...all].sort((left, right) => left.localeCompare(right)).slice(0, 14);
  }, [books]);

  const metrics = [
    {
      label: 'Đầu sách',
      value: `${booksQuery.data?.total ?? 0}`,
      helper: 'Theo bộ lọc hiện tại',
      tone: 'primary' as const,
    },
    {
      label: 'Đang mượn',
      value: `${activeLoans.length}`,
      helper: canBorrow ? 'Sách chưa trả' : 'Chế độ xem thư viện',
      tone: 'info' as const,
    },
    {
      label: 'Chờ duyệt',
      value: `${pendingRequests.length}`,
      helper: canBorrow ? 'Yêu cầu mượn đang mở' : 'Chỉ áp dụng SV/GV',
      tone: 'warning' as const,
    },
    {
      label: 'Khả dụng',
      value: `${books.reduce((total, item) => total + item.availableCopies, 0)}`,
      helper: 'Bản sao có thể mượn',
      tone: 'success' as const,
    },
  ];

  const isRefreshing =
    booksQuery.isRefetching ||
    loansQuery.isRefetching ||
    loanRequestsQuery.isRefetching ||
    selectedBookQuery.isRefetching;

  if (isAdminRole(role)) {
    return null;
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            void booksQuery.refetch();
            void loansQuery.refetch();
            void loanRequestsQuery.refetch();
            if (selectedBookId) {
              void selectedBookQuery.refetch();
            }
          }}
          tintColor={theme.colors.primary}
        />
      }
    >
      <TopHero
        eyebrow="Dịch vụ campus"
        title="Thư viện"
        subtitle="Tra cứu sách, tạo yêu cầu mượn và theo dõi trạng thái xử lý theo quyền tài khoản."
        showBrand
        variant="accent"
      />

      <ContentStack overlapHero={false}>
        <MetricGrid items={metrics} layoutPreset="mobileTwoByTwo" compactColumns={2} cardMinHeight={112} />

        <View style={styles.tabRow}>
          <TabButton label="Tìm sách" active={activeTab === 'discover'} onPress={() => setActiveTab('discover')} />
          <TabButton
            label="Yêu cầu của tôi"
            active={activeTab === 'requests'}
            onPress={() => setActiveTab('requests')}
          />
        </View>

        {!canBorrow ? (
          <SectionCard
            title="Quyền hiện tại"
            subtitle="Tài khoản này đang ở chế độ xem thư viện."
            variant="outlined"
            tone="neutral"
          >
            <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
              Student và lecturer mới có thể gửi yêu cầu mượn sách. Hiện tại bạn vẫn có thể tìm sách và xem tồn kho.
            </Text>
          </SectionCard>
        ) : null}

        {activeTab === 'discover' ? (
          <>
            <SectionCard title="Tìm sách" subtitle="Lọc theo từ khóa hoặc chủ đề." variant="highlight" tone="academic">
              <View style={styles.stack}>
                <FormField
                  label="Từ khóa"
                  value={keyword}
                  onChangeText={setKeyword}
                  placeholder="Tên sách, tác giả, mã ISBN..."
                />
                {subjects.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectRow}>
                    <SubjectChip label="Tất cả" active={!selectedSubject} onPress={() => setSelectedSubject(undefined)} />
                    {subjects.map((subject) => (
                      <SubjectChip
                        key={subject}
                        label={subject}
                        active={selectedSubject === subject}
                        onPress={() => setSelectedSubject(subject)}
                      />
                    ))}
                  </ScrollView>
                ) : null}
              </View>
            </SectionCard>

            <SectionCard title="Danh mục sách" subtitle={`${books.length} mục đang hiển thị`} variant="glass" tone="campus">
              {booksQuery.isLoading ? (
                <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                  Đang tải danh mục...
                </Text>
              ) : booksQuery.isError ? (
                <EmptyState
                  icon="cloud-offline-outline"
                  title="Không tải được thư viện"
                  description="Vui lòng kiểm tra kết nối máy chủ rồi thử lại."
                  actionLabel="Thử lại"
                  onActionPress={() => void booksQuery.refetch()}
                />
              ) : books.length === 0 ? (
                <EmptyState icon="book-outline" title="Không có đầu sách" description="Bộ lọc hiện tại chưa có kết quả." />
              ) : (
                <View style={styles.stack}>
                  {books.map((item) => (
                    <BookCard
                      key={item.id}
                      item={item}
                      canBorrow={canBorrow}
                      selected={selectedBookId === item.id}
                      onSelect={() => setSelectedBookId(item.id)}
                      selectedBookDetail={selectedBookId === item.id ? selectedBookQuery.data ?? null : null}
                      selectedBookLoading={selectedBookId === item.id ? selectedBookQuery.isLoading : false}
                      selectedBookError={selectedBookId === item.id ? selectedBookQuery.isError : false}
                      availableCopies={selectedBookId === item.id ? availableCopies : []}
                      selectedCopyId={selectedCopyId}
                      requestNote={requestNote}
                      onChangeRequestNote={setRequestNote}
                      onSelectCopy={setSelectedCopyId}
                      onRetryLoadBook={() => void selectedBookQuery.refetch()}
                      onClearSelection={() => setSelectedBookId(null)}
                      onSubmitRequest={() => createLoanRequestMutation.mutate()}
                      requestSubmitting={createLoanRequestMutation.isPending}
                    />
                  ))}
                </View>
              )}
            </SectionCard>
          </>
        ) : (
          <>
            <SectionCard title="Yêu cầu mượn của tôi" subtitle="Theo dõi và hủy các req đang chờ duyệt." variant="outlined">
              {loanRequestsQuery.isLoading ? (
                <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                  Đang tải danh sách yêu cầu...
                </Text>
              ) : !canBorrow ? (
                <EmptyState
                  icon="document-text-outline"
                  title="Không áp dụng cho tài khoản này"
                  description="Tài khoản hiện tại chỉ có quyền tra cứu danh mục sách."
                />
              ) : loanRequests.length === 0 ? (
                <EmptyState
                  icon="document-text-outline"
                  title="Chưa có yêu cầu"
                  description="Sau khi gửi req mượn sách, danh sách sẽ hiển thị tại đây."
                  actionLabel="Tìm sách"
                  onActionPress={() => setActiveTab('discover')}
                />
              ) : (
                <View style={styles.stack}>
                  {loanRequests.map((request) => (
                    <View
                      key={request.id}
                      style={[
                        styles.loanCard,
                        {
                          backgroundColor: theme.colors.surfaceSubtle,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <View style={styles.rowBetween}>
                        <Text style={[styles.cardTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                          {request.book.title}
                        </Text>
                        <StatusBadge
                          label={getRequestStatusLabel(request.status)}
                          tone={getRequestStatusTone(request.status)}
                          size="sm"
                        />
                      </View>
                      <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                        {request.book.authors}
                      </Text>
                      <Text style={[styles.meta, { color: theme.colors.textSoft, fontFamily: theme.fonts.medium }]}>
                        Bản sao: {request.copy.copyCode} · Tạo lúc {new Date(request.createdAt).toLocaleString('vi-VN')}
                      </Text>
                      {request.note ? (
                        <Text style={[styles.meta, { color: theme.colors.textSoft, fontFamily: theme.fonts.regular }]}>
                          Ghi chú: {request.note}
                        </Text>
                      ) : null}
                      {request.approvedBy ? (
                        <Text style={[styles.meta, { color: theme.colors.textSoft, fontFamily: theme.fonts.regular }]}>
                          Người xử lý: {request.approvedBy.fullName}
                        </Text>
                      ) : null}
                      {request.status === 'pending' ? (
                        <PrimaryButton
                          label="Hủy yêu cầu"
                          loading={cancelLoanRequestMutation.isPending}
                          onPress={() => cancelLoanRequestMutation.mutate(request.id)}
                        />
                      ) : null}
                      {(request.status === 'cancelled' || request.status === 'rejected') ? (
                        <SecondaryButton
                          label="Xóa yêu cầu"
                          loading={deleteLoanRequestMutation.isPending}
                          onPress={() => deleteLoanRequestMutation.mutate(request.id)}
                        />
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
            </SectionCard>

            {canBorrow ? (
              <SectionCard title="Phiếu mượn của tôi" subtitle="Kiểm tra hạn trả hiện tại." variant="outlined">
                {loansQuery.isLoading ? (
                  <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                    Đang tải phiếu mượn...
                  </Text>
                ) : activeLoans.length === 0 ? (
                  <EmptyState
                    icon="receipt-outline"
                    title="Không còn phiếu đang mở"
                    description="Các phiếu đã được admin xác nhận trả sẽ không còn hiển thị tại đây."
                  />
                ) : (
                  <View style={styles.stack}>
                    {activeLoans.map((loan) => (
                      <View
                        key={loan.id}
                        style={[
                          styles.loanCard,
                          {
                            backgroundColor: theme.colors.surfaceSubtle,
                            borderColor: theme.colors.border,
                          },
                        ]}
                      >
                        <View style={styles.rowBetween}>
                          <Text style={[styles.cardTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                            {loan.book.title}
                          </Text>
                          <StatusBadge
                            label={loan.status === 'overdue' ? 'Quá hạn' : 'Đang mượn'}
                            tone={loan.status === 'overdue' ? 'danger' : 'success'}
                            size="sm"
                          />
                        </View>
                        <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                          {loan.book.authors}
                        </Text>
                        <Text style={[styles.meta, { color: theme.colors.textSoft, fontFamily: theme.fonts.medium }]}>
                          Hạn trả: {new Date(loan.dueAt).toLocaleDateString('vi-VN')} · Mã copy: {loan.copy.copyCode}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </SectionCard>
            ) : null}
          </>
        )}

        <PrimaryButton label="Quay lại dịch vụ" onPress={() => router.replace('/services')} />
      </ContentStack>
    </Screen>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.tabButton,
        {
          backgroundColor: active ? theme.colors.primary : theme.colors.surface,
          borderColor: active ? theme.colors.primary : theme.colors.border,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.tabButtonText,
          {
            color: active ? theme.colors.onPrimary : theme.colors.textMuted,
            fontFamily: theme.fonts.semibold,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SubjectChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.subjectChip,
        {
          backgroundColor: active ? theme.colors.primarySurface : theme.colors.surfaceSubtle,
          borderColor: active ? theme.colors.primary : theme.colors.border,
          opacity: pressed ? 0.84 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.subjectChipText,
          { color: active ? theme.colors.primary : theme.colors.textMuted, fontFamily: theme.fonts.medium },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function CopyChip({
  copy,
  active,
  onPress,
}: {
  copy: LibraryBookCopyRecord;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.copyChip,
        {
          backgroundColor: active ? theme.colors.primarySurface : theme.colors.surface,
          borderColor: active ? theme.colors.primary : theme.colors.border,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.copyChipTitle,
          {
            color: active ? theme.colors.primary : theme.colors.text,
            fontFamily: theme.fonts.semibold,
          },
        ]}
      >
        {copy.copyCode}
      </Text>
      <Text style={[styles.copyChipMeta, { color: theme.colors.textSoft, fontFamily: theme.fonts.regular }]}>
        Sẵn sàng
      </Text>
    </Pressable>
  );
}

function BookCard({
  item,
  canBorrow,
  selected,
  onSelect,
  selectedBookDetail,
  selectedBookLoading,
  selectedBookError,
  availableCopies,
  selectedCopyId,
  requestNote,
  onChangeRequestNote,
  onSelectCopy,
  onRetryLoadBook,
  onClearSelection,
  onSubmitRequest,
  requestSubmitting,
}: {
  item: LibraryBookListItem;
  canBorrow: boolean;
  selected: boolean;
  onSelect: () => void;
  selectedBookDetail: LibraryBookDetail | null;
  selectedBookLoading: boolean;
  selectedBookError: boolean;
  availableCopies: LibraryBookCopyRecord[];
  selectedCopyId: string | null;
  requestNote: string;
  onChangeRequestNote: (value: string) => void;
  onSelectCopy: (copyId: string) => void;
  onRetryLoadBook: () => void;
  onClearSelection: () => void;
  onSubmitRequest: () => void;
  requestSubmitting: boolean;
}) {
  const theme = useAppTheme();
  const available = item.availableCopies > 0;

  return (
    <View
      style={[
        styles.bookCard,
        {
          backgroundColor: theme.colors.surfaceSubtle,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
        },
      ]}
    >
      <View style={styles.rowBetween}>
        <Text style={[styles.cardTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>{item.title}</Text>
        <StatusBadge
          label={`${item.availableCopies}/${item.totalCopies} bản`}
          tone={available ? 'success' : 'danger'}
          size="sm"
        />
      </View>
      <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>{item.authors}</Text>
      <Text style={[styles.meta, { color: theme.colors.textSoft, fontFamily: theme.fonts.medium }]}>
        {item.publisher || 'Chưa cập nhật NXB'} · {item.publishedAt || 'Năm chưa rõ'}
      </Text>
      {item.subjects.length > 0 ? (
        <Text style={[styles.meta, { color: theme.colors.textSoft, fontFamily: theme.fonts.regular }]}>
          Chủ đề: {item.subjects.slice(0, 3).join(', ')}
        </Text>
      ) : null}
      {canBorrow ? (
        <PrimaryButton
          label={selected ? 'Đang chọn' : available ? 'Chọn sách này' : 'Hết bản sẵn sàng'}
          disabled={!available}
          onPress={onSelect}
          icon={<Ionicons name={selected ? 'checkmark-circle-outline' : 'book-outline'} size={16} color={theme.colors.onPrimary} />}
        />
      ) : null}

      {canBorrow && selected ? (
        <View
          style={[
            styles.inlineRequestPanel,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.inlineRequestTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
            Mượn sách này
          </Text>
          <Text style={[styles.meta, { color: theme.colors.textSoft, fontFamily: theme.fonts.regular }]}>
            Chọn một bản sao sẵn sàng rồi gửi yêu cầu đến thủ thư.
          </Text>

          {selectedBookLoading ? (
            <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
              Đang tải danh sách bản sao...
            </Text>
          ) : selectedBookError ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="Không tải được thông tin sách"
              description="Không lấy được danh sách bản sao sẵn sàng. Vui lòng thử lại."
              actionLabel="Thử lại"
              onActionPress={onRetryLoadBook}
            />
          ) : selectedBookDetail && availableCopies.length === 0 ? (
            <EmptyState
              icon="albums-outline"
              title="Hết bản sẵn sàng"
              description="Đầu sách này hiện chưa có bản sao available để gửi yêu cầu."
            />
          ) : (
            <>
              <View style={styles.stack}>
                <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>Chọn bản sao</Text>
                <View style={styles.copyGrid}>
                  {availableCopies.map((copy) => (
                    <CopyChip
                      key={copy.id}
                      copy={copy}
                      active={selectedCopyId === copy.id}
                      onPress={() => onSelectCopy(copy.id)}
                    />
                  ))}
                </View>
              </View>

              <FormField
                label="Ghi chú"
                value={requestNote}
                onChangeText={onChangeRequestNote}
                placeholder="Ví dụ: Cần mượn để phục vụ môn học AI trong tuần này."
                multiline
                numberOfLines={3}
                style={styles.multilineInput}
              />

              <View style={styles.actionRow}>
                <SecondaryButton
                  label="Bỏ chọn sách"
                  labelStyle={styles.requestActionLabel}
                  onPress={onClearSelection}
                  style={styles.flexButton}
                />
                <PrimaryButton
                  label="Mượn sách này"
                  labelStyle={styles.requestActionLabel}
                  loading={requestSubmitting}
                  disabled={!selectedCopyId}
                  onPress={onSubmitRequest}
                  style={styles.flexButton}
                />
              </View>
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 10,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tabButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  tabButtonText: {
    fontSize: 14,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
  },
  meta: {
    fontSize: 12,
    lineHeight: 17,
  },
  label: {
    fontSize: 13,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  subjectRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  subjectChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  subjectChipText: {
    fontSize: 12,
  },
  copyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  copyChip: {
    minWidth: 110,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  copyChipTitle: {
    fontSize: 13,
  },
  copyChipMeta: {
    fontSize: 11,
  },
  inlineRequestPanel: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 10,
    marginTop: 6,
  },
  inlineRequestTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flexButton: {
    flex: 1,
  },
  requestActionLabel: {
    fontSize: 15,
    lineHeight: 22,
  },
  multilineInput: {
    minHeight: 88,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  bookCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  loanCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 7,
  },
});
