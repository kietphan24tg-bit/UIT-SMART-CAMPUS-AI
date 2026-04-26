import { USER_ROLES } from '@smart-campus/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ContentStack,
  EmptyState,
  PrimaryButton,
  Screen,
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
import { formatCurrency } from '@/utils/app';

type CartMap = Record<string, number>;

function isConsumerRole(role?: string | null) {
  return role === USER_ROLES.STUDENT || role === USER_ROLES.LECTURER;
}

export default function CanteenScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const consumer = isConsumerRole(role);
  const [cart, setCart] = useState<CartMap>({});
  const [note, setNote] = useState('');

  const catalogQuery = useQuery({
    queryKey: ['canteen', 'catalog'],
    queryFn: () => canteenApi.getCatalog(),
  });
  const ordersQuery = useQuery({
    queryKey: ['canteen', 'orders', 'me'],
    queryFn: () => canteenApi.getMyOrders(),
    enabled: consumer,
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
  const payMutation = useMutation({
    mutationFn: (orderId: string) => canteenApi.createPayment(orderId),
    onSuccess: async (checkout) => {
      await Linking.openURL(checkout.checkoutUrl);
      await queryClient.invalidateQueries({ queryKey: ['canteen', 'orders', 'me'] });
    },
  });

  const categories = catalogQuery.data ?? [];
  const allProducts = useMemo(
    () => categories.flatMap((category) => category.products.map((product) => ({ ...product, category }))),
    [categories],
  );
  const cartItems = allProducts
    .map((product) => ({ ...product, quantity: cart[product.id] ?? 0 }))
    .filter((item) => item.quantity > 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (role === USER_ROLES.CANTEEN_ADMIN) {
    return (
      <Screen>
        <TopHero
          eyebrow="Dịch vụ campus"
          title="Canteen"
          subtitle="Tài khoản của bạn là quản trị canteen."
          badge={{ label: 'Quản trị canteen', tone: 'info' }}
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
        subtitle="Đặt món, thanh toán online và theo dõi lịch sử đơn."
        showBrand
        variant="accent"
      />

      <ContentStack overlapHero={false}>
        <SectionCard
          title="Giỏ hàng"
          subtitle={`${cartCount} món · ${formatCurrency(cartAmount)}đ`}
          variant="highlight"
          tone="campus"
          headerAccessory={<StatusBadge label={consumer ? 'Có thể thanh toán' : 'Chỉ xem'} tone={consumer ? 'success' : 'info'} />}
        >
          <View style={styles.stack}>
            {!consumer ? (
              <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                Vai trò hiện tại chỉ có quyền xem menu và lịch sử đơn, không thể tạo thanh toán.
              </Text>
            ) : null}
            <Text style={[styles.noteLabel, { color: theme.colors.textSoft, fontFamily: theme.fonts.medium }]}>
              Ghi chú đơn: {note || 'Không có'}
            </Text>
            {consumer ? (
              <View style={styles.row}>
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
                    Ghi chú mẫu
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </SectionCard>

        <SectionCard title="Menu hôm nay" subtitle={`${allProducts.length} sản phẩm`} variant="glass" tone="academic">
          {catalogQuery.isLoading ? (
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
                  paying={payMutation.isPending}
                  onPay={() => payMutation.mutate(order.id)}
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
                  <Text style={[styles.productName, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>
                    {product.name}
                  </Text>
                  <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                    {formatCurrency(product.price)}đ · Tồn {product.stock}
                  </Text>
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
  paying,
  onPay,
}: {
  order: CanteenOrderRecord;
  paying: boolean;
  onPay: () => void;
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
        <Text style={[styles.productName, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
          {order.orderCode}
        </Text>
        <StatusBadge
          label={getOrderStatusLabel(order.status)}
          tone={getOrderStatusTone(order.status)}
          size="sm"
        />
      </View>
      <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
        Tổng tiền: {formatCurrency(order.totalAmount)}đ · {order.items.length} dòng món
      </Text>
      <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
        Cập nhật: {new Date(order.updatedAt).toLocaleString('vi-VN')}
      </Text>
      {order.status === 'pending_payment' || order.status === 'payment_failed' ? (
        <PrimaryButton label="Thanh toán MoMo" loading={paying} onPress={onPay} />
      ) : null}
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

const styles = StyleSheet.create({
  stack: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
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
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  inlineButtonText: {
    fontSize: 14,
  },
  noteLabel: {
    fontSize: 12,
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
    flex: 1,
    minWidth: 0,
    gap: 3,
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
});
