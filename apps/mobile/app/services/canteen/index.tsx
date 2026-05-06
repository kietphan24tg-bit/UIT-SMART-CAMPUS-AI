import { Ionicons } from '@expo/vector-icons';
import { USER_ROLES } from '@smart-campus/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

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
  canteenApi,
  type CanteenCatalogCategory,
  type CanteenOrderRecord,
} from '@/services/api/canteen';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { canManageCanteenRole, formatCurrency, getRoleLabel } from '@/utils/app';

type CartMap = Record<string, number>;
type ActiveQrPayment = Awaited<ReturnType<typeof canteenApi.createSepayPayment>>;

function isConsumerRole(role?: string | null) {
  return role === USER_ROLES.STUDENT || role === USER_ROLES.LECTURER;
}

export default function CanteenScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const consumer = isConsumerRole(role);
  const canManageCanteen = canManageCanteenRole(role);
  const [cart, setCart] = useState<CartMap>({});
  const [note, setNote] = useState('');
  const [activeQrOrderId, setActiveQrOrderId] = useState<string | null>(null);
  const [activeDeleteOrderId, setActiveDeleteOrderId] = useState<string | null>(null);
  const [activeQrPayments, setActiveQrPayments] = useState<Record<string, ActiveQrPayment>>({});
  const hasActiveQrPayments = Object.keys(activeQrPayments).length > 0;

  const catalogQuery = useQuery({
    queryKey: ['canteen', 'catalog'],
    queryFn: () => canteenApi.getCatalog(),
    enabled: isHydrated && isAuthenticated,
  });
  const ordersQuery = useQuery({
    queryKey: ['canteen', 'orders', 'me'],
    queryFn: () => canteenApi.getMyOrders(),
    enabled: isHydrated && isAuthenticated && consumer,
    refetchInterval: hasActiveQrPayments ? 5000 : false,
  });

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const items = Object.entries(cart)
        .filter(([, quantity]) => quantity > 0)
        .map(([productId, quantity]) => ({ productId, quantity }));
      return canteenApi.createOrder({
        items,
        note: note.trim() || undefined,
      });
    },
    onSuccess: async () => {
      setCart({});
      setNote('');
      await queryClient.invalidateQueries({ queryKey: ['canteen', 'orders', 'me'] });
    },
  });
  const qrPayMutation = useMutation({
    onMutate: (orderId: string) => {
      setActiveQrOrderId(orderId);
    },
    mutationFn: (orderId: string) => canteenApi.createSepayPayment(orderId),
    onSuccess: async (checkout, orderId) => {
      setActiveQrPayments((prev) => ({
        ...prev,
        [orderId]: checkout,
      }));
      await queryClient.invalidateQueries({ queryKey: ['canteen', 'orders', 'me'] });
    },
    onError: (error) => {
      Alert.alert('Thanh toán QR', getErrorMessage(error));
    },
    onSettled: () => {
      setActiveQrOrderId(null);
    },
  });
  const deleteOrderMutation = useMutation({
    onMutate: (orderId: string) => {
      setActiveDeleteOrderId(orderId);
    },
    mutationFn: (orderId: string) => canteenApi.deleteOrder(orderId),
    onSuccess: async (_deletedOrder, orderId) => {
      setActiveQrPayments((prev) => {
        const { [orderId]: _, ...rest } = prev;
        return rest;
      });
      if (activeQrOrderId === orderId) {
        setActiveQrOrderId(null);
      }
      await queryClient.invalidateQueries({ queryKey: ['canteen', 'orders', 'me'] });
    },
    onError: (error) => {
      Alert.alert('Xóa đơn', getErrorMessage(error, 'Không thể xóa đơn lúc này. Vui lòng thử lại.'));
    },
    onSettled: () => {
      setActiveDeleteOrderId(null);
    },
  });

  const allProducts = useMemo(
    () => (catalogQuery.data ?? []).flatMap((category) => category.products.map((product) => ({ ...product, category }))),
    [catalogQuery.data],
  );
  const categories = catalogQuery.data ?? [];
  const cartItems = allProducts
    .map((product) => ({ ...product, quantity: cart[product.id] ?? 0 }))
    .filter((item) => item.quantity > 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    if (!ordersQuery.data || !hasActiveQrPayments) {
      return;
    }

    const pendingOrderIds = new Set(
      ordersQuery.data
        .filter((order) => order.status === 'pending_payment')
        .map((order) => order.id),
    );

    setActiveQrPayments((prev) => {
      let changed = false;
      const next = Object.fromEntries(
        Object.entries(prev).filter(([orderId]) => {
          const keep = pendingOrderIds.has(orderId);
          if (!keep) {
            changed = true;
          }
          return keep;
        }),
      ) as Record<string, ActiveQrPayment>;

      return changed ? next : prev;
    });
  }, [hasActiveQrPayments, ordersQuery.data]);

  if (canManageCanteen) {
    return (
      <Screen>
        <TopHero
          eyebrow="Dịch vụ campus"
          title="Canteen"
          subtitle={`Tài khoản của bạn là ${getRoleLabel(role).toLowerCase()}.`}
          badge={{ label: getRoleLabel(role), tone: 'info' }}
          variant="accent"
          showBrand
        />
        <ContentStack overlapHero={false}>
          <EmptyState
            icon="restaurant-outline"
            title="Mở màn quản trị canteen"
            description="Quản lý menu, xem đơn và cập nhật trạng thái hoàn thành ở màn quản trị."
            actionLabel="Mở quản trị"
            onActionPress={() => router.replace('/services/canteen/admin')}
          />
        </ContentStack>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopHero
        eyebrow="Dịch vụ campus"
        title="Canteen"
        subtitle="Đặt món, thanh toán bằng QR và theo dõi lịch sử đơn."
        showBrand
        variant="accent"
      />

      <ContentStack overlapHero={false}>
        <SectionCard title="Menu hôm nay" subtitle={`${allProducts.length} sản phẩm`} variant="glass" tone="academic">
          {!isHydrated || !isAuthenticated ? (
            <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
              Đang khởi tạo phiên đăng nhập...
            </Text>
          ) : catalogQuery.isLoading ? (
            <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
              Đang tải menu...
            </Text>
          ) : catalogQuery.isError ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="Không tải được menu canteen"
              description="Vui lòng kiểm tra API rồi thử lại."
              actionLabel="Thử lại"
              onActionPress={() => void catalogQuery.refetch()}
            />
          ) : allProducts.length === 0 ? (
            <EmptyState icon="restaurant-outline" title="Menu trống" description="Hiện chưa có sản phẩm hoạt động." />
          ) : (
            <View style={styles.stack}>
              {categories.map((category) => (
                <CategoryBlock
                  key={category.id}
                  category={category}
                  cart={cart}
                  onChangeQty={(productId, delta) => {
                    setCart((prev) => {
                      const next = Math.max(0, (prev[productId] ?? 0) + delta);
                      if (!next) {
                        const { [productId]: _, ...rest } = prev;
                        return rest;
                      }
                      return {
                        ...prev,
                        [productId]: next,
                      };
                    });
                  }}
                />
              ))}
            </View>
          )}
        </SectionCard>

        <SectionCard title="Giỏ hàng" subtitle="Kiểm tra món trước khi tạo đơn" variant="highlight" tone="campus">
          <View style={styles.stack}>
            <View
              style={[
                styles.cartSummary,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <View style={styles.cartSummaryItem}>
                <Text style={[styles.cartSummaryValue, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                  {cartCount}
                </Text>
                <Text style={[styles.cartSummaryLabel, { color: theme.colors.textMuted, fontFamily: theme.fonts.medium }]}>
                  Món đã chọn
                </Text>
              </View>
              <View style={[styles.cartSummaryDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.cartSummaryItem}>
                <Text style={[styles.cartSummaryValue, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                  {formatCurrency(cartAmount)}đ
                </Text>
                <Text style={[styles.cartSummaryLabel, { color: theme.colors.textMuted, fontFamily: theme.fonts.medium }]}>
                  Tạm tính
                </Text>
              </View>
            </View>

            {!consumer ? (
              <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                Vai trò hiện tại chỉ có quyền xem menu và lịch sử đơn, không thể tạo thanh toán.
              </Text>
            ) : null}

            <View style={[styles.notePanel, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceSubtle }]}>
              <FormField
                label="Ghi chú đơn"
                value={note}
                onChangeText={setNote}
                placeholder="Ví dụ: Ít đá, không hành, giao nhanh giúp em."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={styles.noteInput}
                hint="Ghi chú sẽ được gửi cùng đơn hàng."
              />
            </View>

            {consumer ? (
              <View style={styles.cartActions}>
                <PrimaryButton
                  label="Tạo đơn hàng"
                  loading={createOrderMutation.isPending}
                  disabled={cartCount === 0}
                  onPress={() => createOrderMutation.mutate()}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setNote(note ? '' : 'Không hành, ít đá, giao nhanh giúp em.')}
                  style={({ pressed }) => [
                    styles.inlineButton,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surfaceSubtle,
                      opacity: pressed ? 0.84 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.inlineButtonText, { color: theme.colors.primary, fontFamily: theme.fonts.medium }]}>
                    {note ? 'Xóa ghi chú' : 'Thêm ghi chú mẫu'}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </SectionCard>

        <SectionCard title="Lịch sử hóa đơn" subtitle="Theo dõi thanh toán và trạng thái đơn." variant="outlined">
          {!consumer ? (
            <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
              Tài khoản này không có lịch sử đặt món cá nhân.
            </Text>
          ) : ordersQuery.isLoading ? (
            <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
              Đang tải lịch sử hóa đơn...
            </Text>
          ) : (ordersQuery.data?.length ?? 0) === 0 ? (
            <EmptyState icon="receipt-outline" title="Chưa có đơn hàng" description="Bạn chưa tạo đơn canteen nào." />
          ) : (
            <View style={styles.stack}>
              {ordersQuery.data?.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  qrPaying={qrPayMutation.isPending && activeQrOrderId === order.id}
                  deleting={deleteOrderMutation.isPending && activeDeleteOrderId === order.id}
                  qrPayment={activeQrPayments[order.id] ?? null}
                  onPayQr={() => qrPayMutation.mutate(order.id)}
                  onDelete={() => deleteOrderMutation.mutate(order.id)}
                  onHideQr={() => {
                    setActiveQrPayments((prev) => {
                      const { [order.id]: _, ...rest } = prev;
                      return rest;
                    });
                  }}
                />
              ))}
            </View>
          )}
        </SectionCard>

        <PrimaryButton label="Quay lại dịch vụ" onPress={() => router.replace('/services')} />
      </ContentStack>
    </Screen>
  );
}

function CategoryBlock({
  category,
  cart,
  onChangeQty,
}: {
  category: CanteenCatalogCategory;
  cart: CartMap;
  onChangeQty: (productId: string, delta: number) => void;
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.categoryBlock}>
      <Text style={[styles.categoryTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
        {category.name}
      </Text>
      <View style={styles.stack}>
        {category.products.map((product) => {
          const quantity = cart[product.id] ?? 0;
          return (
            <View
              key={product.id}
              style={[
                styles.productCard,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surfaceSubtle,
                },
              ]}
            >
              <View style={styles.rowBetween}>
                <View style={styles.productMeta}>
                  <View
                    style={[
                      styles.productImageWrap,
                      {
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.surface,
                      },
                    ]}
                  >
                    {product.imageUrl ? (
                      <Image source={{ uri: product.imageUrl }} style={styles.productImage} contentFit="cover" />
                    ) : (
                      <Ionicons name="image-outline" size={22} color={theme.colors.textSoft} />
                    )}
                  </View>
                  <View style={styles.productText}>
                    <Text style={[styles.productName, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>
                      {product.name}
                    </Text>
                    <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                      {formatCurrency(product.price)}đ · Tồn {product.stock}
                    </Text>
                  </View>
                </View>
                <View style={styles.qtyWrap}>
                  <IconButton icon="remove" onPress={() => onChangeQty(product.id, -1)} />
                  <Text style={[styles.qtyLabel, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                    {quantity}
                  </Text>
                  <IconButton icon="add" onPress={() => onChangeQty(product.id, 1)} />
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function IconButton({ icon, onPress }: { icon: 'add' | 'remove'; onPress: () => void }) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={14} color={theme.colors.primary} />
    </Pressable>
  );
}

function OrderCard({
  order,
  qrPaying,
  deleting,
  qrPayment,
  onPayQr,
  onDelete,
  onHideQr,
}: {
  order: CanteenOrderRecord;
  qrPaying: boolean;
  deleting: boolean;
  qrPayment: ActiveQrPayment | null;
  onPayQr: () => void;
  onDelete: () => void;
  onHideQr: () => void;
}) {
  const theme = useAppTheme();
  const showPaymentActions = order.status === 'pending_payment' || order.status === 'payment_failed';

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
      <View style={styles.orderHeader}>
        <View style={styles.orderCodeWrap}>
          <Text style={[styles.orderCode, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
            {order.orderCode}
          </Text>
        </View>
        <View style={styles.orderStatusWrap}>
          <StatusBadge
            label={getOrderStatusLabel(order.status)}
            tone={getOrderStatusTone(order.status)}
            size="sm"
          />
        </View>
      </View>
      <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
        Tổng tiền: {formatCurrency(order.totalAmount)}đ
      </Text>
      <View style={styles.stack}>
        {showPaymentActions ? (
          <View style={styles.orderActionsRow}>
            <PrimaryButton
              label={qrPayment ? 'Làm mới QR' : 'Thanh toán QR'}
              loading={qrPaying}
              disabled={deleting}
              onPress={onPayQr}
              style={styles.orderActionButton}
            />
            <SecondaryButton
              label="Xóa đơn"
              loading={deleting}
              disabled={qrPaying}
              onPress={onDelete}
              style={[
                styles.orderActionButton,
                {
                  borderColor: deleting || qrPaying ? theme.colors.inputBorder : theme.colors.danger,
                  backgroundColor: deleting || qrPaying ? theme.colors.surfaceTinted : theme.colors.dangerSurface,
                },
              ]}
              labelStyle={{ color: theme.colors.danger }}
            />
          </View>
        ) : null}
        {showPaymentActions && qrPayment ? (
          <View
            style={[
              styles.qrPanel,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <Pressable accessibilityRole="button" onPress={onHideQr} style={styles.qrDismiss}>
              <Text style={[styles.qrLink, { color: theme.colors.primary, fontFamily: theme.fonts.medium }]}>
                Ẩn QR
              </Text>
            </Pressable>
            <Image source={{ uri: qrPayment.checkoutUrl }} style={styles.qrImage} contentFit="contain" />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function getOrderStatusLabel(status: CanteenOrderRecord['status']) {
  switch (status) {
    case 'paid':
      return 'Đã thanh toán';
    case 'completed':
      return 'Đã hoàn thành';
    case 'payment_failed':
      return 'Thanh toán lỗi';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return 'Chờ thanh toán';
  }
}

function getOrderStatusTone(status: CanteenOrderRecord['status']) {
  switch (status) {
    case 'paid':
      return 'success' as const;
    case 'completed':
      return 'info' as const;
    case 'payment_failed':
      return 'danger' as const;
    case 'cancelled':
      return 'warning' as const;
    default:
      return 'warning' as const;
  }
}

function getErrorMessage(error: unknown, fallback?: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
    if (Array.isArray(message) && message.length > 0) {
      const flattened = message.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
      if (flattened.length > 0) {
        return flattened.join('\n');
      }
    }
  }

  return fallback ?? 'Không thể tạo mã QR thanh toán lúc này. Vui lòng thử lại.';
}

const styles = StyleSheet.create({
  stack: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  cartActions: {
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
  inlineButton: {
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  inlineButtonText: {
    fontSize: 14,
  },
  cartSummary: {
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  cartSummaryItem: {
    flex: 1,
    gap: 2,
    alignItems: 'center',
  },
  cartSummaryDivider: {
    width: 1,
    height: 36,
  },
  cartSummaryValue: {
    fontSize: 18,
    lineHeight: 24,
  },
  cartSummaryLabel: {
    fontSize: 12,
  },
  notePanel: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  noteHeading: {
    fontSize: 12,
  },
  noteInput: {
    minHeight: 72,
  },
  categoryBlock: {
    gap: 8,
  },
  categoryTitle: {
    fontSize: 15,
  },
  productCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    gap: 8,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  productImageWrap: {
    width: 70,
    height: 70,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  productName: {
    fontSize: 14,
    lineHeight: 19,
  },
  qtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyLabel: {
    minWidth: 18,
    textAlign: 'center',
    fontSize: 13,
  },
  orderCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  orderCodeWrap: {
    flex: 1,
    minWidth: 0,
  },
  orderCode: {
    fontSize: 14,
    lineHeight: 19,
  },
  orderStatusWrap: {
    minWidth: 88,
    maxWidth: '100%',
    alignItems: 'flex-end',
  },
  orderActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  orderActionButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  qrPanel: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  qrDismiss: {
    alignSelf: 'stretch',
    alignItems: 'flex-end',
  },
  qrLink: {
    fontSize: 13,
  },
  qrImage: {
    width: 180,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
