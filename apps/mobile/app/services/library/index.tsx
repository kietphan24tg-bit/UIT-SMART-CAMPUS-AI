import { USER_ROLES } from '@smart-campus/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MetricGrid } from '@/components/tasks';
import {
  ContentStack,
  EmptyState,
  FormField,
  PrimaryButton,
  Screen,
  SectionCard,
  StatusBadge,
  TopHero,
} from '@/components/ui';
import { libraryApi, type LibraryBookListItem } from '@/services/api/library';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';

function getRoleCanBorrow(role?: string | null) {
  return role === USER_ROLES.STUDENT || role === USER_ROLES.LECTURER;
}

export default function LibraryScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const canBorrow = getRoleCanBorrow(role);
  const [keyword, setKeyword] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | undefined>(undefined);

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
    enabled: canBorrow,
  });
  const reservationsQuery = useQuery({
    queryKey: ['library', 'my-reservations'],
    queryFn: () => libraryApi.getMyReservations(),
    enabled: canBorrow,
  });

  const reserveMutation = useMutation({
    mutationFn: (bookId: string) => libraryApi.createReservation(bookId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['library', 'my-reservations'] }),
        queryClient.invalidateQueries({ queryKey: ['library', 'books'] }),
      ]);
    },
  });
  const renewMutation = useMutation({
    mutationFn: (loanId: string) => libraryApi.renewLoan(loanId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['library', 'my-loans'] });
    },
  });
  const cancelReservationMutation = useMutation({
    mutationFn: (reservationId: string) => libraryApi.cancelReservation(reservationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['library', 'my-reservations'] });
    },
  });

  const books = booksQuery.data?.items ?? [];
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
      value: `${loansQuery.data?.filter((item) => item.status !== 'returned').length ?? 0}`,
      helper: canBorrow ? 'Sách chưa trả' : 'Chỉ áp dụng SV/GV',
      tone: 'info' as const,
    },
    {
      label: 'Giữ chỗ',
      value: `${reservationsQuery.data?.filter((item) => item.status === 'active').length ?? 0}`,
      helper: canBorrow ? 'Reservation còn hiệu lực' : 'Chỉ áp dụng SV/GV',
      tone: 'warning' as const,
    },
    {
      label: 'Khả dụng',
      value: `${books.reduce((total, item) => total + item.availableCopies, 0)}`,
      helper: 'Bản sao có thể mượn',
      tone: 'success' as const,
    },
  ];

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={booksQuery.isRefetching || loansQuery.isRefetching || reservationsQuery.isRefetching}
          onRefresh={() => {
            void booksQuery.refetch();
            void loansQuery.refetch();
            void reservationsQuery.refetch();
          }}
          tintColor={theme.colors.primary}
        />
      }
    >
      <TopHero
        eyebrow="Dịch vụ campus"
        title="Thư viện"
        subtitle="Tra cứu sách, giữ chỗ và theo dõi mượn trả theo quyền tài khoản."
        showBrand
        variant="accent"
      />

      <ContentStack overlapHero={false}>
        <MetricGrid items={metrics} layoutPreset="mobileTwoByTwo" compactColumns={2} cardMinHeight={112} />

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
                <SubjectChip
                  label="Tất cả"
                  active={!selectedSubject}
                  onPress={() => setSelectedSubject(undefined)}
                />
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

        {!canBorrow ? (
          <SectionCard
            title="Quyền hiện tại"
            subtitle="Tài khoản này đang ở chế độ xem thư viện."
            variant="outlined"
            tone="neutral"
          >
            <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
              Chỉ sinh viên và giảng viên mới có thể tạo giữ chỗ hoặc gia hạn phiếu mượn trong phiên bản hiện tại.
            </Text>
          </SectionCard>
        ) : null}

        <SectionCard title="Danh mục sách" subtitle={`${books.length} mục đang hiển thị`} variant="glass" tone="campus">
          {booksQuery.isLoading ? (
            <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
              Đang tải danh mục...
            </Text>
          ) : booksQuery.isError ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="Không tải được thư viện"
              description="Vui lòng kiểm tra kết nối backend rồi thử lại."
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
                  busy={reserveMutation.isPending}
                  onReserve={() => reserveMutation.mutate(item.id)}
                />
              ))}
            </View>
          )}
        </SectionCard>

        {canBorrow ? (
          <SectionCard title="Phiếu mượn của tôi" subtitle="Kiểm tra hạn trả và gia hạn." variant="outlined">
            {loansQuery.isLoading ? (
              <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                Đang tải phiếu mượn...
              </Text>
            ) : (loansQuery.data?.length ?? 0) === 0 ? (
              <EmptyState icon="receipt-outline" title="Chưa có phiếu mượn" description="Bạn chưa có sách đang mượn." />
            ) : (
              <View style={styles.stack}>
                {loansQuery.data?.map((loan) => (
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
                        label={loan.status === 'overdue' ? 'Quá hạn' : loan.status === 'returned' ? 'Đã trả' : 'Đang mượn'}
                        tone={loan.status === 'overdue' ? 'danger' : loan.status === 'returned' ? 'info' : 'success'}
                        size="sm"
                      />
                    </View>
                    <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                      {loan.book.authors}
                    </Text>
                    <Text style={[styles.meta, { color: theme.colors.textSoft, fontFamily: theme.fonts.medium }]}>
                      Hạn trả: {new Date(loan.dueAt).toLocaleDateString('vi-VN')} · Mã copy: {loan.copy.copyCode}
                    </Text>
                    {loan.status !== 'returned' ? (
                      <PrimaryButton
                        label="Gia hạn"
                        loading={renewMutation.isPending}
                        onPress={() => renewMutation.mutate(loan.id)}
                      />
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </SectionCard>
        ) : null}

        {canBorrow ? (
          <SectionCard title="Giữ chỗ của tôi" subtitle="Quản lý các reservation đang mở." variant="outlined">
            {reservationsQuery.isLoading ? (
              <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                Đang tải danh sách giữ chỗ...
              </Text>
            ) : (reservationsQuery.data?.length ?? 0) === 0 ? (
              <EmptyState icon="bookmark-outline" title="Chưa có giữ chỗ" description="Danh sách sẽ hiển thị tại đây." />
            ) : (
              <View style={styles.stack}>
                {reservationsQuery.data?.map((reservation) => (
                  <View
                    key={reservation.id}
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
                        {reservation.book.title}
                      </Text>
                      <StatusBadge
                        label={
                          reservation.status === 'active'
                            ? 'Đang giữ chỗ'
                            : reservation.status === 'fulfilled'
                              ? 'Đã nhận'
                              : reservation.status === 'expired'
                                ? 'Hết hạn'
                                : 'Đã hủy'
                        }
                        tone={
                          reservation.status === 'active'
                            ? 'warning'
                            : reservation.status === 'fulfilled'
                              ? 'success'
                              : 'info'
                        }
                        size="sm"
                      />
                    </View>
                    <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                      {reservation.book.authors}
                    </Text>
                    <Text style={[styles.meta, { color: theme.colors.textSoft, fontFamily: theme.fonts.medium }]}>
                      Hết hạn: {new Date(reservation.expiresAt).toLocaleString('vi-VN')}
                    </Text>
                    {reservation.status === 'active' ? (
                      <PrimaryButton
                        label="Hủy giữ chỗ"
                        loading={cancelReservationMutation.isPending}
                        onPress={() => cancelReservationMutation.mutate(reservation.id)}
                      />
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </SectionCard>
        ) : null}

        <PrimaryButton label="Quay lại dịch vụ" onPress={() => router.replace('/services')} />
      </ContentStack>
    </Screen>
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

function BookCard({
  item,
  canBorrow,
  busy,
  onReserve,
}: {
  item: LibraryBookListItem;
  canBorrow: boolean;
  busy: boolean;
  onReserve: () => void;
}) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.bookCard,
        {
          backgroundColor: theme.colors.surfaceSubtle,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.rowBetween}>
        <Text style={[styles.cardTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>{item.title}</Text>
        <StatusBadge
          label={`${item.availableCopies}/${item.totalCopies} bản`}
          tone={item.availableCopies > 0 ? 'success' : 'danger'}
          size="sm"
        />
      </View>
      <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
        {item.authors}
      </Text>
      <Text style={[styles.meta, { color: theme.colors.textSoft, fontFamily: theme.fonts.medium }]}>
        {item.publisher || 'Chưa cập nhật NXB'} · {item.publishedAt || 'Năm chưa rõ'}
      </Text>
      {canBorrow ? (
        <PrimaryButton
          label="Giữ chỗ"
          loading={busy}
          disabled={item.availableCopies === 0}
          onPress={onReserve}
          icon={<Ionicons name="bookmark-outline" size={16} color={theme.colors.onPrimary} />}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 10,
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
