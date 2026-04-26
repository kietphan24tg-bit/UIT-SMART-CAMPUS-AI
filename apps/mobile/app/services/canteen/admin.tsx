import { USER_ROLES } from '@smart-campus/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ContentStack,
  EmptyState,
  PrimaryButton,
  Screen,
  SectionCard,
  StatusBadge,
  TopHero,
} from '@/components/ui';
import { canteenApi, type CanteenAdminOrderRecord } from '@/services/api/canteen';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { formatCurrency } from '@/utils/app';

export default function CanteenAdminScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);

  const catalogQuery = useQuery({
    queryKey: ['canteen', 'catalog', 'admin'],
    queryFn: () => canteenApi.getCatalog(),
  });
  const ordersQuery = useQuery({
    queryKey: ['canteen', 'orders', 'admin'],
    queryFn: () => canteenApi.getAdminOrders(),
    enabled: role === USER_ROLES.CANTEEN_ADMIN || role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN,
  });

  const completeMutation = useMutation({
    mutationFn: (orderId: string) => canteenApi.completeOrder(orderId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['canteen', 'orders', 'admin'] });
    },
  });
  const createCategoryMutation = useMutation({
    mutationFn: () =>
      canteenApi.createCategory({
        name: `Món mới ${Date.now().toString().slice(-4)}`,
        slug: `mon-moi-${Date.now().toString().slice(-6)}`,
        description: 'Danh mục tạo nhanh từ màn quản trị canteen.',
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['canteen', 'catalog', 'admin'] });
    },
  });
  const createProductMutation = useMutation({
    mutationFn: async () => {
      const firstCategory = catalogQuery.data?.[0];
      if (!firstCategory) {
        throw new Error('Chưa có danh mục để tạo sản phẩm.');
      }
      return canteenApi.createProduct({
        categoryId: firstCategory.id,
        name: `Món demo ${Date.now().toString().slice(-4)}`,
        slug: `mon-demo-${Date.now().toString().slice(-6)}`,
        price: 25000,
        stock: 25,
        description: 'Sản phẩm tạo nhanh để demo.',
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['canteen', 'catalog', 'admin'] });
    },
  });

  if (role !== USER_ROLES.CANTEEN_ADMIN && role !== USER_ROLES.ADMIN && role !== USER_ROLES.SUPER_ADMIN) {
    return (
      <Screen>
        <TopHero
          eyebrow="Dịch vụ campus"
          title="Quản trị canteen"
          subtitle="Khu vực này chỉ dành cho canteen admin."
          variant="accent"
          showBrand
        />
        <ContentStack overlapHero={false}>
          <EmptyState
            icon="lock-closed-outline"
            title="Bạn không có quyền truy cập"
            description="Chỉ canteen admin hoặc tài khoản audit cấp cao mới mở được màn này."
            actionLabel="Về danh sách dịch vụ"
            onActionPress={() => router.replace('/services')}
          />
        </ContentStack>
      </Screen>
    );
  }

  const categories = catalogQuery.data ?? [];
  const products = categories.flatMap((category) => category.products);
  const orders = ordersQuery.data ?? [];
  const paidOrders = orders.filter((item) => item.status === 'paid');

  return (
    <Screen>
      <TopHero
        eyebrow="Dịch vụ campus"
        title="Quản trị canteen"
        subtitle="Quản lý menu chung, lịch sử đơn và hoàn thành đơn hàng."
        badge={{ label: 'Canteen admin', tone: 'info' }}
        variant="accent"
        showBrand
      />

      <ContentStack overlapHero={false}>
        <SectionCard title="Snapshot quản trị" subtitle="Số liệu chính của menu và đơn hàng." variant="highlight" tone="academic">
          <View style={styles.summaryRow}>
            <StatusBadge label={`Danh mục ${categories.length}`} tone="info" />
            <StatusBadge label={`Sản phẩm ${products.length}`} tone="success" />
            <StatusBadge label={`Đơn đã thanh toán ${paidOrders.length}`} tone="warning" />
            <StatusBadge label={`Tổng đơn ${orders.length}`} tone="primary" />
          </View>
        </SectionCard>

        <SectionCard title="Tạo nhanh dữ liệu menu" subtitle="Phục vụ demo role và linked flow." variant="glass" tone="campus">
          <View style={styles.stack}>
            <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
              Luồng này gọi API thật để tạo mới danh mục/sản phẩm trong DB, không dùng mock.
            </Text>
            <View style={styles.row}>
              <PrimaryButton
                label="Tạo danh mục mẫu"
                loading={createCategoryMutation.isPending}
                onPress={() => createCategoryMutation.mutate()}
              />
              <PrimaryButton
                label="Tạo món mẫu"
                loading={createProductMutation.isPending}
                onPress={() => createProductMutation.mutate()}
                disabled={!categories.length}
              />
            </View>
          </View>
        </SectionCard>

        <SectionCard title="Đơn hàng cần xử lý" subtitle="Đơn đã thanh toán đang chờ hoàn thành." variant="outlined">
          {ordersQuery.isLoading ? (
            <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
              Đang tải danh sách đơn...
            </Text>
          ) : paidOrders.length === 0 ? (
            <EmptyState
              icon="checkmark-done-outline"
              title="Không có đơn chờ hoàn thành"
              description="Các đơn đã thanh toán sẽ xuất hiện tại đây."
            />
          ) : (
            <View style={styles.stack}>
              {paidOrders.map((order) => (
                <OrderAdminCard
                  key={order.id}
                  order={order}
                  loading={completeMutation.isPending}
                  onComplete={() => completeMutation.mutate(order.id)}
                />
              ))}
            </View>
          )}
        </SectionCard>

        <SectionCard title="Lịch sử đơn quản trị" subtitle="Toàn bộ đơn canteen để audit." variant="outlined">
          {ordersQuery.isLoading ? (
            <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
              Đang tải lịch sử đơn...
            </Text>
          ) : orders.length === 0 ? (
            <EmptyState icon="receipt-outline" title="Chưa có đơn" description="Danh sách sẽ hiển thị khi có giao dịch." />
          ) : (
            <View style={styles.stack}>
              {orders.map((order) => (
                <View
                  key={order.id}
                  style={[
                    styles.orderCard,
                    {
                      backgroundColor: theme.colors.surfaceSubtle,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <View style={styles.rowBetween}>
                    <Text style={[styles.orderCode, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                      {order.orderCode}
                    </Text>
                    <StatusBadge
                      label={statusLabel(order.status)}
                      tone={statusTone(order.status)}
                      size="sm"
                    />
                  </View>
                  <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                    Khách: {order.requestedBy.fullName} · {order.requestedBy.role}
                  </Text>
                  <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                    Tổng tiền: {formatCurrency(order.totalAmount)}đ · {order.items.length} món
                  </Text>
                </View>
              ))}
            </View>
          )}
        </SectionCard>

        <PrimaryButton label="Quay lại dịch vụ" onPress={() => router.replace('/services')} />
      </ContentStack>
    </Screen>
  );
}

function OrderAdminCard({
  order,
  loading,
  onComplete,
}: {
  order: CanteenAdminOrderRecord;
  loading: boolean;
  onComplete: () => void;
}) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.orderCard,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceSubtle,
        },
      ]}
    >
      <View style={styles.rowBetween}>
        <Text style={[styles.orderCode, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
          {order.orderCode}
        </Text>
        <StatusBadge label="Chờ hoàn thành" tone="warning" size="sm" />
      </View>
      <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
        Khách: {order.requestedBy.fullName}
      </Text>
      <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
        Tổng tiền: {formatCurrency(order.totalAmount)}đ
      </Text>
      <PrimaryButton label="Hoàn thành đơn" loading={loading} onPress={onComplete} />
    </View>
  );
}

function statusLabel(status: CanteenAdminOrderRecord['status']) {
  switch (status) {
    case 'paid':
      return 'Đã thanh toán';
    case 'completed':
      return 'Đã hoàn thành';
    case 'cancelled':
      return 'Đã hủy';
    case 'payment_failed':
      return 'Thanh toán lỗi';
    default:
      return 'Chờ thanh toán';
  }
}

function statusTone(status: CanteenAdminOrderRecord['status']) {
  switch (status) {
    case 'paid':
      return 'success' as const;
    case 'completed':
      return 'info' as const;
    case 'cancelled':
      return 'warning' as const;
    case 'payment_failed':
      return 'danger' as const;
    default:
      return 'warning' as const;
  }
}

const styles = StyleSheet.create({
  stack: {
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
  },
  orderCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  orderCode: {
    fontSize: 14,
  },
});
