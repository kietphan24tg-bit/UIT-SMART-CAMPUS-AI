import { Ionicons } from '@expo/vector-icons';
import { USER_ROLES } from '@smart-campus/shared';
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
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  ContentStack,
  EmptyState,
  FormField,
  PrimaryButton,
  Screen,
  SecondaryButton,
  StatusBadge,
} from '@/components/ui';
import {
  canteenApi,
  type AdminCanteenCategoryRecord,
  type AdminCanteenProductRecord,
  type CanteenAdminOrderRecord,
} from '@/services/api/canteen';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { formatCurrency, formatDateTime, getRoleLabel } from '@/utils/app';

type AdminTab = 'catalog' | 'history';
type CatalogTab = 'categories' | 'products';
type StatusFilter = 'all' | 'active' | 'inactive';
type ProductSort = 'name' | 'price_asc' | 'price_desc';
type OrderStatusFilter = 'all' | CanteenAdminOrderRecord['status'];
type OrderDateFilter = 'all' | 'today' | '7d' | '30d';

type CategoryFormState = {
  name: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
};

type ProductFormState = {
  categoryId: string;
  name: string;
  price: string;
  stock: string;
  description: string;
  imageUrl: string;
  sortOrder: string;
  isActive: boolean;
};

type ConfirmActionState = {
  entity: 'category' | 'product';
  id: string;
  title: string;
  message: string;
} | null;

type OptionItem = {
  key: string;
  label: string;
};

const STATUS_OPTIONS: OptionItem[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Đang hiển thị' },
  { key: 'inactive', label: 'Đã xóa' },
];

const CATEGORY_STATUS_OPTIONS: OptionItem[] = STATUS_OPTIONS;

const PRODUCT_SORT_OPTIONS: OptionItem[] = [
  { key: 'name', label: 'Tên A-Z' },
  { key: 'price_asc', label: 'Giá tăng' },
  { key: 'price_desc', label: 'Giá giảm' },
];

const ORDER_STATUS_OPTIONS: OptionItem[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending_payment', label: 'Chờ thanh toán' },
  { key: 'paid', label: 'Đã thanh toán' },
  { key: 'completed', label: 'Đã hoàn thành' },
  { key: 'payment_failed', label: 'Thanh toán lỗi' },
  { key: 'cancelled', label: 'Đã hủy' },
];

const ORDER_DATE_OPTIONS: OptionItem[] = [
  { key: 'all', label: 'Mọi lúc' },
  { key: 'today', label: 'Hôm nay' },
  { key: '7d', label: '7 ngày' },
  { key: '30d', label: '30 ngày' },
];

const QUICK_CATEGORY_DESCRIPTION = 'Danh mục tạo nhanh từ màn quản trị canteen.';

const EMPTY_CATEGORY_FORM: CategoryFormState = {
  name: '',
  description: '',
  sortOrder: '0',
  isActive: true,
};

const EMPTY_PRODUCT_FORM: ProductFormState = {
  categoryId: '',
  name: '',
  price: '',
  stock: '0',
  description: '',
  imageUrl: '',
  sortOrder: '0',
  isActive: true,
};

function resolveProductImageMimeType(mimeType?: string | null) {
  if (mimeType === 'image/png' || mimeType === 'image/webp') {
    return mimeType;
  }

  return 'image/jpeg';
}

function resolveProductImageFileName(fileName?: string | null, mimeType?: string | null) {
  if (fileName) {
    return fileName;
  }

  const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';

  return `product.${extension}`;
}

function resolveProductImageErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object') {
    return 'Không thể tải ảnh sản phẩm lúc này.';
  }

  const maybeError = error as {
    code?: unknown;
    message?: unknown;
    error?: { message?: unknown } | unknown;
  };

  const normalizedMessage =
    typeof maybeError.message === 'string' ? maybeError.message.trim().toLowerCase() : '';

  if (normalizedMessage === 'network error' || normalizedMessage.includes('network')) {
    return Platform.select({
      ios: 'KhÃ´ng káº¿t ná»‘i Ä‘Æ°á»£c backend upload. Náº¿u Ä‘ang dÃ¹ng iPhone/iPad vÃ  backend lÃ  http, hÃ£y kiá»ƒm tra ATS hoáº·c chuyá»ƒn sang https.',
      default:
        'KhÃ´ng káº¿t ná»‘i Ä‘Æ°á»£c backend upload. HÃ£y kiá»ƒm tra láº¡i IP API, restart Expo sau khi Ä‘á»•i .env, vÃ  xem log `[apiClient] request failed` Ä‘á»ƒ biáº¿t request Ä‘ang gá»i host nÃ o.',
    });
  }

  if (typeof maybeError.message === 'string' && maybeError.message.trim()) {
    return maybeError.message;
  }

  if (
    maybeError.error &&
    typeof maybeError.error === 'object' &&
    'message' in maybeError.error &&
    typeof maybeError.error.message === 'string' &&
    maybeError.error.message.trim()
  ) {
    return maybeError.error.message;
  }

  return 'Không thể tải ảnh sản phẩm lúc này.';
}

function resolveProductImageErrorMessageVi(error: unknown) {
  if (!error || typeof error !== 'object') {
    return 'Không thể tải ảnh sản phẩm lúc này.';
  }

  const maybeError = error as {
    code?: unknown;
    message?: unknown;
    error?: { message?: unknown } | unknown;
  };

  const normalizedMessage =
    typeof maybeError.message === 'string' ? maybeError.message.trim().toLowerCase() : '';

  if (normalizedMessage === 'network error' || normalizedMessage.includes('network')) {
    return Platform.select({
      ios: 'Không kết nối được backend upload. Nếu đang dùng iPhone/iPad và backend là http, hãy kiểm tra ATS hoặc chuyển sang https.',
      default:
        'Không kết nối được backend upload. Hãy kiểm tra lại địa chỉ API, khởi động lại Expo sau khi đổi .env và xem log [apiClient] request failed để biết app đang gọi host nào.',
    }) as string;
  }

  if (normalizedMessage.includes('undefined is not a function')) {
    return 'Không thể xử lý ảnh đã chọn trên thiết bị này. Ứng dụng sẽ thử tải trực tiếp ảnh gốc.';
  }

  if (normalizedMessage.includes('only jpeg') || normalizedMessage.includes('only jpg')) {
    return 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.';
  }

  if (normalizedMessage.includes('5 mb or smaller')) {
    return 'Ảnh sản phẩm phải nhỏ hơn 5 MB.';
  }

  if (typeof maybeError.message === 'string' && maybeError.message.trim()) {
    return maybeError.message;
  }

  if (
    maybeError.error &&
    typeof maybeError.error === 'object' &&
    'message' in maybeError.error &&
    typeof maybeError.error.message === 'string' &&
    maybeError.error.message.trim()
  ) {
    return maybeError.error.message;
  }

  return 'Không thể tải ảnh sản phẩm lúc này.';
}

async function prepareProductImageUpload(asset: ImagePicker.ImagePickerAsset) {
  const originalMimeType = resolveProductImageMimeType(asset.mimeType);
  const originalFileName = resolveProductImageFileName(asset.fileName, originalMimeType);

  if (typeof ImageManipulator.manipulateAsync !== 'function') {
    return {
      uri: asset.uri,
      fileName: originalFileName,
      mimeType: originalMimeType,
    };
  }

  try {
    const processedAsset = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 1200, height: 1200 } }],
      {
        compress: 0.82,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );

    return {
      uri: processedAsset.uri,
      fileName: resolveProductImageFileName(asset.fileName, 'image/jpeg'),
      mimeType: resolveProductImageMimeType('image/jpeg'),
    };
  } catch (error) {
    console.warn('[canteen] fallback to original product image before upload', error);
    return {
      uri: asset.uri,
      fileName: originalFileName,
      mimeType: originalMimeType,
    };
  }
}

export default function CanteenAdminScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const canManage =
    role === USER_ROLES.CANTEEN_ADMIN ||
    role === USER_ROLES.ADMIN ||
    role === USER_ROLES.SUPER_ADMIN;
  const canDelete = role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN;

  const [activeTab, setActiveTab] = useState<AdminTab>('catalog');
  const [catalogTab, setCatalogTab] = useState<CatalogTab>('categories');

  const [categorySearch, setCategorySearch] = useState('');
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<StatusFilter>('active');
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<StatusFilter>('active');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productSort, setProductSort] = useState<ProductSort>('name');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatusFilter>('all');
  const [orderDateFilter, setOrderDateFilter] = useState<OrderDateFilter>('all');

  const [selectedOrder, setSelectedOrder] = useState<CanteenAdminOrderRecord | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmActionState>(null);
  const [catalogPickerOpen, setCatalogPickerOpen] = useState(false);

  const [categorySheetVisible, setCategorySheetVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCanteenCategoryRecord | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(EMPTY_CATEGORY_FORM);

  const [productSheetVisible, setProductSheetVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminCanteenProductRecord | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>(EMPTY_PRODUCT_FORM);
  const [isUploadingProductImage, setIsUploadingProductImage] = useState(false);
  const [productImageError, setProductImageError] = useState<string | null>(null);

  const [categoryStatusOpen, setCategoryStatusOpen] = useState(false);
  const [productStatusOpen, setProductStatusOpen] = useState(false);
  const [productCategoryOpen, setProductCategoryOpen] = useState(false);
  const [productSortOpen, setProductSortOpen] = useState(false);
  const [productFormCategoryOpen, setProductFormCategoryOpen] = useState(false);
  const [categoryFormStatusOpen, setCategoryFormStatusOpen] = useState(false);
  const [productFormStatusOpen, setProductFormStatusOpen] = useState(false);
  const [orderStatusOpen, setOrderStatusOpen] = useState(false);
  const [orderDateOpen, setOrderDateOpen] = useState(false);

  const catalogQuery = useQuery({
    queryKey: ['canteen', 'catalog', 'admin'],
    queryFn: () => canteenApi.getAdminCatalog({ includeInactive: true }),
    enabled: canManage,
  });
  const ordersQuery = useQuery({
    queryKey: ['canteen', 'orders', 'admin'],
    queryFn: () => canteenApi.getAdminOrders(),
    enabled: canManage,
  });

  const invalidateOrderQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['canteen', 'orders', 'admin'] }),
      queryClient.invalidateQueries({ queryKey: ['canteen', 'orders', 'me'] }),
    ]);
  };

  const invalidateCatalogQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['canteen', 'catalog', 'admin'] }),
      queryClient.invalidateQueries({ queryKey: ['canteen', 'catalog'] }),
    ]);
  };

  const createCategoryMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      description?: string;
      sortOrder?: number;
      isActive?: boolean;
    }) => canteenApi.createCategory(payload),
    onSuccess: async () => {
      await invalidateCatalogQueries();
      closeCategorySheet();
    },
    onError: (error) => showError('Danh mục', error),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({
      categoryId,
      payload,
    }: {
      categoryId: string;
      payload: Partial<{
        name: string;
        description: string;
        sortOrder: number;
        isActive: boolean;
      }>;
    }) => canteenApi.updateCategory(categoryId, payload),
    onSuccess: async () => {
      await invalidateCatalogQueries();
      closeCategorySheet();
    },
    onError: (error) => showError('Danh mục', error),
  });

  const removeCategoryMutation = useMutation({
    mutationFn: (categoryId: string) => canteenApi.removeCategory(categoryId),
    onSuccess: async () => {
      setCategoryStatusFilter('active');
      await invalidateCatalogQueries();
    },
    onError: (error) => showError('Danh mục', error),
  });

  const createProductMutation = useMutation({
    mutationFn: (payload: {
      categoryId: string;
      name: string;
      price: number;
      stock: number;
      description?: string;
      imageUrl?: string;
      sortOrder?: number;
      isActive?: boolean;
    }) => canteenApi.createProduct(payload),
    onSuccess: async () => {
      await invalidateCatalogQueries();
      closeProductSheet();
    },
    onError: (error) => showError('Sản phẩm', error),
  });

  const updateProductMutation = useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: string;
      payload: Partial<{
        categoryId: string;
        name: string;
        price: number;
        stock: number;
        description: string;
        imageUrl: string;
        sortOrder: number;
        isActive: boolean;
      }>;
    }) => canteenApi.updateProduct(productId, payload),
    onSuccess: async () => {
      await invalidateCatalogQueries();
      closeProductSheet();
    },
    onError: (error) => showError('Sản phẩm', error),
  });

  const removeProductMutation = useMutation({
    mutationFn: (productId: string) => canteenApi.removeProduct(productId),
    onSuccess: async () => {
      setProductStatusFilter('active');
      await invalidateCatalogQueries();
    },
    onError: (error) => showError('Sản phẩm', error),
  });

  const deleteAdminOrderMutation = useMutation({
    mutationFn: (orderId: string) => canteenApi.deleteAdminOrder(orderId),
    onSuccess: async () => {
      setSelectedOrder(null);
      await invalidateOrderQueries();
    },
    onError: (error) => showError('Lịch sử đơn', error),
  });

  const allCategories = useMemo(() => catalogQuery.data ?? [], [catalogQuery.data]);
  const categories = useMemo(
    () => allCategories.filter((category) => category.isActive),
    [allCategories],
  );
  const activeCategories = useMemo(() => categories, [categories]);
  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);

  const allProducts = useMemo(
    () =>
      allCategories.flatMap((category) =>
        category.products.map((product) => ({
          ...product,
          categoryName: category.name,
          categoryIsActive: category.isActive,
        })),
      ),
    [allCategories],
  );

  useEffect(() => {
    if (!categorySheetVisible) {
      return;
    }

    if (editingCategory) {
      setCategoryForm({
        name: editingCategory.name,
        description: editingCategory.description ?? '',
        sortOrder: String(editingCategory.sortOrder),
        isActive: editingCategory.isActive,
      });
      return;
    }

    setCategoryForm(EMPTY_CATEGORY_FORM);
  }, [categorySheetVisible, editingCategory]);

  useEffect(() => {
    if (!productSheetVisible) {
      return;
    }

    setProductImageError(null);

    if (editingProduct) {
      setProductForm({
        categoryId: editingProduct.categoryId,
        name: editingProduct.name,
        price: String(editingProduct.price),
        stock: String(editingProduct.stock),
        description: editingProduct.description ?? '',
        imageUrl: editingProduct.imageUrl ?? '',
        sortOrder: String(editingProduct.sortOrder),
        isActive: editingProduct.isActive,
      });
      return;
    }

    setProductForm({
      ...EMPTY_PRODUCT_FORM,
      categoryId: activeCategories[0]?.id ?? '',
    });
  }, [activeCategories, categories, editingProduct, productSheetVisible]);

  useEffect(() => {
    if (!selectedOrder) {
      return;
    }

    setSelectedOrder(orders.find((item) => item.id === selectedOrder.id) ?? null);
  }, [orders, selectedOrder]);

  const filteredCategories = useMemo(() => {
    const normalizedSearch = categorySearch.trim().toLowerCase();

    return allCategories.filter((category) => {
      const matchesStatus =
        categoryStatusFilter === 'all'
          ? true
          : categoryStatusFilter === 'active'
            ? category.isActive
            : !category.isActive;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        category.name.toLowerCase().includes(normalizedSearch) ||
        category.description?.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [allCategories, categorySearch, categoryStatusFilter]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = productSearch.trim().toLowerCase();

    const filtered = allProducts.filter((product) => {
      const matchesStatus =
        productStatusFilter === 'all'
          ? true
          : productStatusFilter === 'active'
            ? product.isActive
            : !product.isActive;
      const matchesCategory =
        productCategoryFilter === 'all' || product.categoryId === productCategoryFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.categoryName.toLowerCase().includes(normalizedSearch) ||
        product.description?.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesCategory && matchesSearch;
    });

    return filtered.sort((left, right) => {
      switch (productSort) {
        case 'price_asc':
          return left.price - right.price;
        case 'price_desc':
          return right.price - left.price;
        default:
          return left.name.localeCompare(right.name, 'vi');
      }
    });
  }, [allProducts, productCategoryFilter, productSearch, productSort, productStatusFilter]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = orderSearch.trim().toLowerCase();
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    return orders.filter((order) => {
      const createdAtMs = new Date(order.createdAt).getTime();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        order.orderCode.toLowerCase().includes(normalizedSearch) ||
        order.requestedBy.fullName.toLowerCase().includes(normalizedSearch);
      const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
      const matchesDate =
        orderDateFilter === 'all'
          ? true
          : orderDateFilter === 'today'
            ? new Date(order.createdAt).toDateString() === new Date().toDateString()
            : orderDateFilter === '7d'
              ? now - createdAtMs <= 7 * dayMs
              : now - createdAtMs <= 30 * dayMs;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orderDateFilter, orderSearch, orderStatusFilter, orders]);

  if (!canManage) {
    return (
      <Screen>
        <ContentStack>
          <EmptyState
            icon="lock-closed-outline"
            title="Bạn không có quyền truy cập"
            description="Chỉ admin hoặc tài khoản legacy canteen mới mở được màn này."
            actionLabel="Về danh sách dịch vụ"
            onActionPress={() => router.replace('/services')}
          />
        </ContentStack>
      </Screen>
    );
  }

  return (
    <Screen>
      <ContentStack gap={14} overlapHero={false}>
        <View style={styles.headerBlock}>
          <Text
            style={[styles.headerTitle, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}
          >
            Quản trị canteen
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
            ]}
          >
            Quản lý catalog và lịch sử đơn hàng cho {getRoleLabel(role).toLowerCase()}.
          </Text>
        </View>

        <View
          style={[
            styles.tabRail,
            { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border },
          ]}
        >
          <CatalogTabChip
            value={catalogTab === 'categories' ? 'Danh mục' : 'Sản phẩm'}
            active={activeTab === 'catalog'}
            onPress={() => {
              setActiveTab('catalog');
              setCatalogPickerOpen(true);
            }}
          />
          <TabChip
            label="Lịch sử"
            active={activeTab === 'history'}
            onPress={() => setActiveTab('history')}
          />
        </View>

        {activeTab === 'catalog' ? (
          <>
            {catalogTab === 'categories' ? (
              <CatalogCategoryTab
                categories={filteredCategories}
                canDelete={canDelete}
                isLoading={catalogQuery.isLoading}
                isError={catalogQuery.isError}
                onRetry={() => void catalogQuery.refetch()}
                searchValue={categorySearch}
                onChangeSearch={setCategorySearch}
                statusFilter={categoryStatusFilter}
                onChangeStatusFilter={setCategoryStatusFilter}
                statusOpen={categoryStatusOpen}
                onOpenStatus={() => setCategoryStatusOpen(true)}
                onCloseStatus={() => setCategoryStatusOpen(false)}
                onAdd={() => {
                  setEditingCategory(null);
                  setCategorySheetVisible(true);
                }}
                onEdit={(category) => {
                  setEditingCategory(category);
                  setCategorySheetVisible(true);
                }}
                onToggleActive={(category) => {
                  setConfirmAction({
                    entity: 'category',
                    id: category.id,
                    title: 'Xóa danh mục',
                    message: `Xóa "${category.name}" khỏi catalog quản trị?`,
                  });
                }}
                isMutating={removeCategoryMutation.isPending || updateCategoryMutation.isPending}
              />
            ) : (
              <CatalogProductTab
                categories={activeCategories}
                products={filteredProducts}
                canDelete={canDelete}
                isLoading={catalogQuery.isLoading}
                isError={catalogQuery.isError}
                onRetry={() => void catalogQuery.refetch()}
                searchValue={productSearch}
                onChangeSearch={setProductSearch}
                statusFilter={productStatusFilter}
                onChangeStatusFilter={setProductStatusFilter}
                statusOpen={productStatusOpen}
                onOpenStatus={() => setProductStatusOpen(true)}
                onCloseStatus={() => setProductStatusOpen(false)}
                categoryFilter={productCategoryFilter}
                onChangeCategoryFilter={setProductCategoryFilter}
                categoryOpen={productCategoryOpen}
                onOpenCategory={() => setProductCategoryOpen(true)}
                onCloseCategory={() => setProductCategoryOpen(false)}
                sort={productSort}
                onChangeSort={setProductSort}
                sortOpen={productSortOpen}
                onOpenSort={() => setProductSortOpen(true)}
                onCloseSort={() => setProductSortOpen(false)}
                onAdd={() => {
                  setEditingProduct(null);
                  setProductSheetVisible(true);
                }}
                onEdit={(product) => {
                  setEditingProduct(product);
                  setProductSheetVisible(true);
                }}
                onToggleActive={(product) => {
                  setConfirmAction({
                    entity: 'product',
                    id: product.id,
                    title: 'Xóa sản phẩm',
                    message: `Xóa "${product.name}" khỏi menu hiện tại?`,
                  });
                }}
                isMutating={removeProductMutation.isPending || updateProductMutation.isPending}
              />
            )}
          </>
        ) : (
          <HistoryTab
            orders={filteredOrders}
            isLoading={ordersQuery.isLoading}
            isError={ordersQuery.isError}
            onRetry={() => void ordersQuery.refetch()}
            searchValue={orderSearch}
            onChangeSearch={setOrderSearch}
            statusFilter={orderStatusFilter}
            onChangeStatusFilter={setOrderStatusFilter}
            statusOpen={orderStatusOpen}
            onOpenStatus={() => setOrderStatusOpen(true)}
            onCloseStatus={() => setOrderStatusOpen(false)}
            dateFilter={orderDateFilter}
            onChangeDateFilter={setOrderDateFilter}
            dateOpen={orderDateOpen}
            onOpenDate={() => setOrderDateOpen(true)}
            onCloseDate={() => setOrderDateOpen(false)}
            onOpenOrder={setSelectedOrder}
          />
        )}
      </ContentStack>

      <BottomSheet
        visible={catalogPickerOpen}
        title="Chọn mục quản lý"
        onClose={() => setCatalogPickerOpen(false)}
      >
        <View style={styles.sheetContent}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setCatalogTab('categories');
              setCatalogPickerOpen(false);
            }}
            style={({ pressed }) => [
              styles.catalogChoiceCard,
              {
                backgroundColor:
                  catalogTab === 'categories'
                    ? theme.colors.primarySurface
                    : theme.colors.surfaceSubtle,
                borderColor:
                  catalogTab === 'categories' ? theme.colors.primary : theme.colors.border,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.catalogChoiceTitle,
                {
                  color: catalogTab === 'categories' ? theme.colors.primary : theme.colors.text,
                  fontFamily: theme.fonts.semibold,
                },
              ]}
            >
              Danh mục
            </Text>
            <Text
              style={[
                styles.catalogChoiceHint,
                { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
              ]}
            >
              Quản lý nhóm món, trạng thái hiển thị và thứ tự danh mục.
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setCatalogTab('products');
              setCatalogPickerOpen(false);
            }}
            style={({ pressed }) => [
              styles.catalogChoiceCard,
              {
                backgroundColor:
                  catalogTab === 'products'
                    ? theme.colors.primarySurface
                    : theme.colors.surfaceSubtle,
                borderColor: catalogTab === 'products' ? theme.colors.primary : theme.colors.border,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.catalogChoiceTitle,
                {
                  color: catalogTab === 'products' ? theme.colors.primary : theme.colors.text,
                  fontFamily: theme.fonts.semibold,
                },
              ]}
            >
              Sản phẩm
            </Text>
            <Text
              style={[
                styles.catalogChoiceHint,
                { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
              ]}
            >
              Quản lý món bán ra, giá, tồn kho, lọc theo danh mục và trạng thái.
            </Text>
          </Pressable>
        </View>
      </BottomSheet>

      <BottomSheet
        visible={categorySheetVisible}
        title={editingCategory ? 'Sửa danh mục' : 'Thêm danh mục'}
        subtitle={
          editingCategory ? 'Cập nhật thông tin danh mục.' : 'Tạo danh mục mới cho catalog.'
        }
        onClose={closeCategorySheet}
      >
        <View style={styles.sheetContent}>
          <FormField
            label="Tên danh mục"
            value={categoryForm.name}
            onChangeText={(value) => setCategoryForm((prev) => ({ ...prev, name: value }))}
            placeholder="VD: Cơm"
          />
          <FormField
            label="Mô tả"
            value={categoryForm.description}
            onChangeText={(value) => setCategoryForm((prev) => ({ ...prev, description: value }))}
            placeholder="Mô tả ngắn cho danh mục"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={styles.multilineInput}
          />
          <View style={styles.inlineFields}>
            <View style={styles.inlineFieldItem}>
              <FormField
                label="Thứ tự"
                value={categoryForm.sortOrder}
                onChangeText={(value) => setCategoryForm((prev) => ({ ...prev, sortOrder: value }))}
                keyboardType="number-pad"
                placeholder="0"
              />
            </View>
            <View style={styles.inlineFieldItem}>
              <SelectDropdown
                title="Trạng thái danh mục"
                label="Trạng thái"
                value={categoryForm.isActive ? 'Đang hiển thị' : 'Đã ẩn'}
                options={STATUS_OPTIONS.slice(1)}
                open={categoryFormStatusOpen}
                onOpen={() => setCategoryFormStatusOpen(true)}
                onClose={() => setCategoryFormStatusOpen(false)}
                onSelect={(key) => {
                  setCategoryForm((prev) => ({ ...prev, isActive: key === 'active' }));
                  setCategoryFormStatusOpen(false);
                }}
              />
            </View>
          </View>
          <View style={styles.sheetActionRow}>
            <SecondaryButton label="Đóng" onPress={closeCategorySheet} style={styles.flexButton} />
            <PrimaryButton
              label={editingCategory ? 'Lưu thay đổi' : 'Thêm danh mục'}
              loading={createCategoryMutation.isPending || updateCategoryMutation.isPending}
              onPress={handleSubmitCategory}
              style={styles.flexButton}
            />
          </View>
        </View>
      </BottomSheet>

      <BottomSheet
        visible={productSheetVisible}
        title={editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
        subtitle={editingProduct ? 'Cập nhật thông tin sản phẩm.' : 'Tạo sản phẩm mới cho menu.'}
        onClose={closeProductSheet}
      >
        <View style={styles.sheetContent}>
          <SelectDropdown
            title="Danh mục sản phẩm"
            label="Danh mục"
            value={
              categories.find((item) => item.id === productForm.categoryId)?.name ?? 'Chọn danh mục'
            }
            options={categories.map((item) => ({ key: item.id, label: item.name }))}
            open={productFormCategoryOpen}
            onOpen={() => setProductFormCategoryOpen(true)}
            onClose={() => setProductFormCategoryOpen(false)}
            onSelect={(key) => {
              setProductForm((prev) => ({ ...prev, categoryId: key }));
              setProductFormCategoryOpen(false);
            }}
          />
          <FormField
            label="Tên sản phẩm"
            value={productForm.name}
            onChangeText={(value) => setProductForm((prev) => ({ ...prev, name: value }))}
            placeholder="VD: Cơm gà nướng"
          />
          <View style={styles.inlineFields}>
            <View style={styles.inlineFieldItem}>
              <FormField
                label="Giá"
                value={productForm.price}
                onChangeText={(value) => setProductForm((prev) => ({ ...prev, price: value }))}
                keyboardType="number-pad"
                placeholder="25000"
              />
            </View>
            <View style={styles.inlineFieldItem}>
              <FormField
                label="Tồn kho"
                value={productForm.stock}
                onChangeText={(value) => setProductForm((prev) => ({ ...prev, stock: value }))}
                keyboardType="number-pad"
                placeholder="0"
              />
            </View>
          </View>
          <View style={styles.inlineFields}>
            <View style={styles.inlineFieldItem}>
              <FormField
                label="Thứ tự"
                value={productForm.sortOrder}
                onChangeText={(value) => setProductForm((prev) => ({ ...prev, sortOrder: value }))}
                keyboardType="number-pad"
                placeholder="0"
              />
            </View>
            <View style={styles.inlineFieldItem}>
              <SelectDropdown
                title="Trạng thái sản phẩm"
                label="Trạng thái"
                value={productForm.isActive ? 'Đang hiển thị' : 'Đã ẩn'}
                options={STATUS_OPTIONS.slice(1)}
                open={productFormStatusOpen}
                onOpen={() => setProductFormStatusOpen(true)}
                onClose={() => setProductFormStatusOpen(false)}
                onSelect={(key) => {
                  setProductForm((prev) => ({ ...prev, isActive: key === 'active' }));
                  setProductFormStatusOpen(false);
                }}
              />
            </View>
          </View>
          <FormField
            label="Mô tả"
            value={productForm.description}
            onChangeText={(value) => setProductForm((prev) => ({ ...prev, description: value }))}
            placeholder="Mô tả ngắn cho món ăn"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={styles.multilineInput}
          />
          <View style={styles.imageUploadField}>
            <Text
              style={[
                styles.filterLabel,
                { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
              ]}
            >
              Ảnh sản phẩm
            </Text>
            <View
              style={[
                styles.imageUploadCard,
                {
                  backgroundColor: theme.colors.surfaceSubtle,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              {!productForm.imageUrl ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Tải ảnh"
                  onPress={() => void handlePickProductImage()}
                  disabled={isUploadingProductImage}
                  style={({ pressed }) => [
                    styles.imageUploadDropzone,
                    {
                      borderColor: theme.colors.border,
                      opacity: isUploadingProductImage ? 0.56 : pressed ? 0.84 : 1,
                    },
                  ]}
                >
                  <Ionicons name="cloud-upload-outline" size={24} color={theme.colors.primary} />
                  <Text
                    style={[
                      styles.itemMeta,
                      { color: theme.colors.text, fontFamily: theme.fonts.medium },
                    ]}
                  >
                    Tải ảnh
                  </Text>
                </Pressable>
              ) : (
                <View style={styles.imageUploadPreviewWrap}>
                  <Image
                    source={{ uri: productForm.imageUrl }}
                    style={styles.imageUploadPreviewImage}
                    contentFit="cover"
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Xóa ảnh"
                    onPress={() => {
                      setProductImageError(null);
                      setProductForm((prev) => ({ ...prev, imageUrl: '' }));
                    }}
                    disabled={isUploadingProductImage}
                    style={({ pressed }) => [
                      styles.imageRemoveButton,
                      {
                        backgroundColor: theme.colors.surfaceElevated,
                        borderColor: theme.colors.border,
                        opacity: isUploadingProductImage ? 0.56 : pressed ? 0.84 : 1,
                      },
                    ]}
                  >
                    <Ionicons name="close" size={14} color={theme.colors.text} />
                  </Pressable>
                </View>
              )}
              {isUploadingProductImage ? (
                <View style={styles.imageUploadProgress}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text
                    style={[
                      styles.itemMeta,
                      { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
                    ]}
                  >
                    Đang tải ảnh...
                  </Text>
                </View>
              ) : null}
              {productImageError ? (
                <Text
                  style={[
                    styles.imageUploadError,
                    { color: theme.colors.danger, fontFamily: theme.fonts.medium },
                  ]}
                >
                  {productImageError}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={styles.sheetActionRow}>
            <SecondaryButton label="Đóng" onPress={closeProductSheet} style={styles.flexButton} />
            <PrimaryButton
              label={editingProduct ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
              loading={
                createProductMutation.isPending ||
                updateProductMutation.isPending ||
                isUploadingProductImage
              }
              disabled={isUploadingProductImage}
              onPress={handleSubmitProduct}
              style={styles.flexButton}
            />
          </View>
        </View>
      </BottomSheet>

      <BottomSheet
        visible={Boolean(selectedOrder)}
        title={selectedOrder?.orderCode ?? 'Chi tiết đơn'}
        subtitle={selectedOrder ? formatDateTime(selectedOrder.createdAt) : undefined}
        onClose={() => setSelectedOrder(null)}
      >
        {selectedOrder ? (
          <OrderDetailSheet
            order={selectedOrder}
            canDelete={canDelete}
            deleting={deleteAdminOrderMutation.isPending}
            onDelete={() => {
              Alert.alert(
                'Xóa lịch sử đơn',
                `Xóa vĩnh viễn đơn ${selectedOrder.orderCode} khỏi khu vực quản trị?`,
                [
                  { text: 'Hủy', style: 'cancel' },
                  {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: () => deleteAdminOrderMutation.mutate(selectedOrder.id),
                  },
                ],
              );
            }}
          />
        ) : null}
      </BottomSheet>

      <BottomSheet
        visible={Boolean(confirmAction)}
        title={confirmAction?.title ?? 'Xác nhận'}
        subtitle="Thao tác này sẽ đánh dấu item là đã xóa và ẩn khỏi danh sách đang hiển thị."
        onClose={() => setConfirmAction(null)}
      >
        <View style={styles.sheetContent}>
          <Text
            style={[
              styles.confirmMessage,
              { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
            ]}
          >
            {confirmAction?.message}
          </Text>
          <View style={styles.sheetActionRow}>
            <SecondaryButton
              label="Hủy"
              onPress={() => setConfirmAction(null)}
              style={styles.flexButton}
            />
            <PrimaryButton
              label="Xác nhận xóa"
              loading={removeCategoryMutation.isPending || removeProductMutation.isPending}
              onPress={() => {
                if (!confirmAction) {
                  return;
                }

                if (confirmAction.entity === 'category') {
                  removeCategoryMutation.mutate(confirmAction.id, {
                    onSettled: () => setConfirmAction(null),
                  });
                  return;
                }

                removeProductMutation.mutate(confirmAction.id, {
                  onSettled: () => setConfirmAction(null),
                });
              }}
              style={styles.flexButton}
            />
          </View>
        </View>
      </BottomSheet>
    </Screen>
  );

  function closeCategorySheet() {
    setCategorySheetVisible(false);
    setEditingCategory(null);
    setCategoryForm(EMPTY_CATEGORY_FORM);
    setCategoryFormStatusOpen(false);
  }

  function closeProductSheet() {
    setProductSheetVisible(false);
    setEditingProduct(null);
    setProductImageError(null);
    setProductForm({
      ...EMPTY_PRODUCT_FORM,
      categoryId: categories[0]?.id ?? '',
    });
    setProductFormCategoryOpen(false);
    setProductFormStatusOpen(false);
  }

  async function handlePickProductImage() {
    try {
      setProductImageError(null);

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Cần quyền truy cập', 'Hãy cho phép ứng dụng truy cập thư viện ảnh.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        selectionLimit: 1,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      setIsUploadingProductImage(true);
      const preparedAsset = await prepareProductImageUpload(asset);

      const uploaded = await canteenApi.uploadProductImage(
        preparedAsset.uri,
        preparedAsset.fileName,
        preparedAsset.mimeType,
      );

      setProductForm((prev) => ({ ...prev, imageUrl: uploaded.imageUrl }));
    } catch (error) {
      console.error('[canteen] uploadProductImage failed', error);
      const message = resolveProductImageErrorMessageVi(error);
      setProductImageError(message);
      Alert.alert('Ảnh sản phẩm', message);
    } finally {
      setIsUploadingProductImage(false);
    }
  }

  function handleSubmitCategory() {
    const name = categoryForm.name.trim();
    const slug = name;
    const sortOrder = Number.parseInt(categoryForm.sortOrder.trim(), 10);

    if (!name) {
      showError('Danh mục', 'Vui lòng nhập tên danh mục.');
      return;
    }
    if (!slug) {
      showError('Danh mục', 'Slug danh mục chưa hợp lệ.');
      return;
    }
    if (!Number.isFinite(sortOrder) || sortOrder < 0) {
      showError('Danh mục', 'Thứ tự phải từ 0 trở lên.');
      return;
    }

    const payload = {
      name,
      description: categoryForm.description.trim() || undefined,
      sortOrder,
      isActive: categoryForm.isActive,
    };

    if (editingCategory) {
      updateCategoryMutation.mutate({
        categoryId: editingCategory.id,
        payload,
      });
      return;
    }

    createCategoryMutation.mutate(payload);
  }

  function handleSubmitProduct() {
    const categoryId = productForm.categoryId.trim();
    const name = productForm.name.trim();
    const slug = name;
    const price = Number.parseInt(productForm.price.trim(), 10);
    const stock = Number.parseInt(productForm.stock.trim(), 10);
    const sortOrder = Number.parseInt(productForm.sortOrder.trim(), 10);

    if (!categoryId || !name) {
      showError('Sản phẩm', 'Vui lòng chọn danh mục và nhập tên sản phẩm.');
      return;
    }
    if (!slug) {
      showError('Sản phẩm', 'Tên sản phẩm chưa hợp lệ.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      showError('Sản phẩm', 'Giá sản phẩm phải lớn hơn 0.');
      return;
    }
    if (!Number.isFinite(stock) || stock < 0) {
      showError('Sản phẩm', 'Tồn kho phải từ 0 trở lên.');
      return;
    }
    if (!Number.isFinite(sortOrder) || sortOrder < 0) {
      showError('Sản phẩm', 'Thứ tự phải từ 0 trở lên.');
      return;
    }

    const payload = {
      categoryId,
      name,
      price,
      stock,
      description: productForm.description.trim() || undefined,
      imageUrl: productForm.imageUrl.trim() || undefined,
      sortOrder,
      isActive: productForm.isActive,
    };

    if (editingProduct) {
      updateProductMutation.mutate({
        productId: editingProduct.id,
        payload,
      });
      return;
    }

    createProductMutation.mutate(payload);
  }
}

function CatalogCategoryTab({
  categories,
  canDelete,
  isLoading,
  isError,
  onRetry,
  searchValue,
  onChangeSearch,
  statusFilter,
  onChangeStatusFilter,
  statusOpen,
  onOpenStatus,
  onCloseStatus,
  onAdd,
  onEdit,
  onToggleActive,
  isMutating,
}: {
  categories: AdminCanteenCategoryRecord[];
  canDelete: boolean;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  searchValue: string;
  onChangeSearch: (value: string) => void;
  statusFilter: StatusFilter;
  onChangeStatusFilter: (value: StatusFilter) => void;
  statusOpen: boolean;
  onOpenStatus: () => void;
  onCloseStatus: () => void;
  onAdd: () => void;
  onEdit: (category: AdminCanteenCategoryRecord) => void;
  onToggleActive: (category: AdminCanteenCategoryRecord) => void;
  isMutating: boolean;
}) {
  return (
    <View style={styles.sectionStack}>
      <SearchField
        value={searchValue}
        onChangeText={onChangeSearch}
        placeholder="Tìm danh mục theo tên..."
      />
      <View style={styles.dropdownGrid}>
        <SelectDropdown
          title="Trạng thái danh mục"
          label="Trạng thái"
          value={getOptionLabel(CATEGORY_STATUS_OPTIONS, statusFilter)}
          options={CATEGORY_STATUS_OPTIONS}
          open={statusOpen}
          onOpen={onOpenStatus}
          onClose={onCloseStatus}
          onSelect={(key) => {
            onChangeStatusFilter(key as StatusFilter);
            onCloseStatus();
          }}
        />
        <View style={styles.addButtonWrap}>
          <PrimaryButton label="Thêm danh mục" onPress={onAdd} />
        </View>
      </View>

      {isLoading ? (
        <SectionMessage title="Đang tải catalog..." />
      ) : isError ? (
        <RetryPanel message="Không tải được catalog quản trị." onRetry={onRetry} />
      ) : categories.length === 0 ? (
        <SectionMessage title="Chưa có danh mục phù hợp." />
      ) : (
        <View style={styles.listWrap}>
          {categories.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              canDelete={canDelete}
              onEdit={() => onEdit(category)}
              onToggleActive={() => onToggleActive(category)}
              disabling={isMutating}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function CatalogProductTab({
  categories,
  products,
  canDelete,
  isLoading,
  isError,
  onRetry,
  searchValue,
  onChangeSearch,
  statusFilter,
  onChangeStatusFilter,
  statusOpen,
  onOpenStatus,
  onCloseStatus,
  categoryFilter,
  onChangeCategoryFilter,
  categoryOpen,
  onOpenCategory,
  onCloseCategory,
  sort,
  onChangeSort,
  sortOpen,
  onOpenSort,
  onCloseSort,
  onAdd,
  onEdit,
  onToggleActive,
  isMutating,
}: {
  categories: AdminCanteenCategoryRecord[];
  products: Array<AdminCanteenProductRecord & { categoryName: string; categoryIsActive: boolean }>;
  canDelete: boolean;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  searchValue: string;
  onChangeSearch: (value: string) => void;
  statusFilter: StatusFilter;
  onChangeStatusFilter: (value: StatusFilter) => void;
  statusOpen: boolean;
  onOpenStatus: () => void;
  onCloseStatus: () => void;
  categoryFilter: string;
  onChangeCategoryFilter: (value: string) => void;
  categoryOpen: boolean;
  onOpenCategory: () => void;
  onCloseCategory: () => void;
  sort: ProductSort;
  onChangeSort: (value: ProductSort) => void;
  sortOpen: boolean;
  onOpenSort: () => void;
  onCloseSort: () => void;
  onAdd: () => void;
  onEdit: (
    product: AdminCanteenProductRecord & { categoryName: string; categoryIsActive: boolean },
  ) => void;
  onToggleActive: (
    product: AdminCanteenProductRecord & { categoryName: string; categoryIsActive: boolean },
  ) => void;
  isMutating: boolean;
}) {
  return (
    <View style={styles.sectionStack}>
      <SearchField
        value={searchValue}
        onChangeText={onChangeSearch}
        placeholder="Tìm sản phẩm theo tên, danh mục..."
      />
      <View style={styles.dropdownGrid}>
        <SelectDropdown
          title="Lọc theo danh mục"
          label="Danh mục"
          value={
            categoryFilter === 'all'
              ? 'Tất cả danh mục'
              : (categories.find((item) => item.id === categoryFilter)?.name ?? 'Tất cả danh mục')
          }
          options={[
            { key: 'all', label: 'Tất cả danh mục' },
            ...categories.map((item) => ({ key: item.id, label: item.name })),
          ]}
          open={categoryOpen}
          onOpen={onOpenCategory}
          onClose={onCloseCategory}
          onSelect={(key) => {
            onChangeCategoryFilter(key);
            onCloseCategory();
          }}
        />
        <SelectDropdown
          title="Lọc theo trạng thái"
          label="Trạng thái"
          value={getOptionLabel(STATUS_OPTIONS, statusFilter)}
          options={STATUS_OPTIONS}
          open={statusOpen}
          onOpen={onOpenStatus}
          onClose={onCloseStatus}
          onSelect={(key) => {
            onChangeStatusFilter(key as StatusFilter);
            onCloseStatus();
          }}
        />
        <SelectDropdown
          title="Sắp xếp sản phẩm"
          label="Sắp xếp"
          value={getOptionLabel(PRODUCT_SORT_OPTIONS, sort)}
          options={PRODUCT_SORT_OPTIONS}
          open={sortOpen}
          onOpen={onOpenSort}
          onClose={onCloseSort}
          onSelect={(key) => {
            onChangeSort(key as ProductSort);
            onCloseSort();
          }}
        />
      </View>
      <PrimaryButton label="Thêm sản phẩm" onPress={onAdd} />

      {isLoading ? (
        <SectionMessage title="Đang tải catalog..." />
      ) : isError ? (
        <RetryPanel message="Không tải được catalog quản trị." onRetry={onRetry} />
      ) : products.length === 0 ? (
        <SectionMessage title="Chưa có sản phẩm phù hợp." />
      ) : (
        <View style={styles.listWrap}>
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              canDelete={canDelete}
              onEdit={() => onEdit(product)}
              onToggleActive={() => onToggleActive(product)}
              disabling={isMutating}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function HistoryTab({
  orders,
  isLoading,
  isError,
  onRetry,
  searchValue,
  onChangeSearch,
  statusFilter,
  onChangeStatusFilter,
  statusOpen,
  onOpenStatus,
  onCloseStatus,
  dateFilter,
  onChangeDateFilter,
  dateOpen,
  onOpenDate,
  onCloseDate,
  onOpenOrder,
}: {
  orders: CanteenAdminOrderRecord[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  searchValue: string;
  onChangeSearch: (value: string) => void;
  statusFilter: OrderStatusFilter;
  onChangeStatusFilter: (value: OrderStatusFilter) => void;
  statusOpen: boolean;
  onOpenStatus: () => void;
  onCloseStatus: () => void;
  dateFilter: OrderDateFilter;
  onChangeDateFilter: (value: OrderDateFilter) => void;
  dateOpen: boolean;
  onOpenDate: () => void;
  onCloseDate: () => void;
  onOpenOrder: (order: CanteenAdminOrderRecord) => void;
}) {
  return (
    <View style={styles.sectionStack}>
      <SearchField
        value={searchValue}
        onChangeText={onChangeSearch}
        placeholder="Tìm mã đơn hoặc khách hàng..."
      />
      <View style={styles.dropdownGrid}>
        <SelectDropdown
          title="Trạng thái đơn"
          label="Trạng thái"
          value={getOptionLabel(ORDER_STATUS_OPTIONS, statusFilter)}
          options={ORDER_STATUS_OPTIONS}
          open={statusOpen}
          onOpen={onOpenStatus}
          onClose={onCloseStatus}
          onSelect={(key) => {
            onChangeStatusFilter(key as OrderStatusFilter);
            onCloseStatus();
          }}
        />
        <SelectDropdown
          title="Thời gian"
          label="Thời gian"
          value={getOptionLabel(ORDER_DATE_OPTIONS, dateFilter)}
          options={ORDER_DATE_OPTIONS}
          open={dateOpen}
          onOpen={onOpenDate}
          onClose={onCloseDate}
          onSelect={(key) => {
            onChangeDateFilter(key as OrderDateFilter);
            onCloseDate();
          }}
        />
      </View>

      {isLoading ? (
        <SectionMessage title="Đang tải lịch sử đơn..." />
      ) : isError ? (
        <RetryPanel message="Không tải được lịch sử đơn." onRetry={onRetry} />
      ) : orders.length === 0 ? (
        <SectionMessage title="Chưa có đơn hàng phù hợp." />
      ) : (
        <View style={styles.listWrap}>
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} onPress={() => onOpenOrder(order)} />
          ))}
        </View>
      )}
    </View>
  );
}

function SearchField({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.searchShell,
        { backgroundColor: theme.colors.input, borderColor: theme.colors.inputBorder },
      ]}
    >
      <Ionicons name="search" size={18} color={theme.colors.textSoft} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSoft}
        style={[styles.searchInput, { color: theme.colors.text, fontFamily: theme.fonts.regular }]}
      />
    </View>
  );
}

function SelectDropdown({
  title,
  label,
  value,
  options,
  open,
  onOpen,
  onClose,
  onSelect,
  disabled,
}: {
  title: string;
  label: string;
  value: string;
  options: OptionItem[];
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSelect: (key: string) => void;
  disabled?: boolean;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.dropdownField}>
      <Text
        style={[
          styles.filterLabel,
          { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
        ]}
      >
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onOpen}
        style={({ pressed }) => [
          styles.dropdownTrigger,
          {
            backgroundColor: theme.colors.surfaceSubtle,
            borderColor: theme.colors.border,
            opacity: disabled ? 0.56 : pressed ? 0.84 : 1,
          },
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.dropdownValue,
            { color: theme.colors.text, fontFamily: theme.fonts.medium },
          ]}
        >
          {value}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={theme.colors.textSoft}
        />
      </Pressable>

      {disabled ? null : (
        <Modal transparent visible={open} animationType="fade" onRequestClose={onClose}>
          <View style={styles.modalRoot}>
            <Pressable
              style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay }]}
              onPress={onClose}
            />
            <View
              style={[
                styles.optionSheet,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <View style={styles.sheetHandleWrap}>
                <View style={[styles.sheetHandle, { backgroundColor: theme.colors.border }]} />
              </View>
              <View style={styles.optionSheetHeader}>
                <Text
                  style={[
                    styles.optionSheetTitle,
                    { color: theme.colors.text, fontFamily: theme.fonts.bold },
                  ]}
                >
                  {title}
                </Text>
                <Pressable accessibilityRole="button" onPress={onClose} style={styles.sheetClose}>
                  <Ionicons name="close" size={20} color={theme.colors.text} />
                </Pressable>
              </View>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.optionList}
              >
                {options.map((option) => {
                  const active = option.label === value;
                  return (
                    <Pressable
                      key={`${title}-${option.key}`}
                      accessibilityRole="button"
                      onPress={() => onSelect(option.key)}
                      style={({ pressed }) => [
                        styles.optionRow,
                        {
                          backgroundColor: active
                            ? theme.colors.primarySurface
                            : theme.colors.surfaceSubtle,
                          borderColor: active ? theme.colors.primary : theme.colors.border,
                          opacity: pressed ? 0.84 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionRowText,
                          {
                            color: active ? theme.colors.primary : theme.colors.text,
                            fontFamily: active ? theme.fonts.semibold : theme.fonts.medium,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

function ProductImageThumbnail({
  imageUrl,
  size,
  showLabel = false,
}: {
  imageUrl?: string | null;
  size: number;
  showLabel?: boolean;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.productImageFrame,
        {
          width: size,
          height: size,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.productImageAsset} contentFit="cover" />
      ) : (
        <View style={styles.productImagePlaceholder}>
          <Ionicons name="image-outline" size={showLabel ? 22 : 18} color={theme.colors.textSoft} />
          {showLabel ? (
            <Text
              style={[
                styles.productImagePlaceholderText,
                { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
              ]}
            >
              Chưa có ảnh
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

function CategoryRow({
  category,
  canDelete,
  onEdit,
  onToggleActive,
  disabling,
}: {
  category: AdminCanteenCategoryRecord;
  canDelete: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
  disabling: boolean;
}) {
  const theme = useAppTheme();
  const activeProducts = category.products.filter((item) => item.isActive).length;

  return (
    <View
      style={[
        styles.listCard,
        { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border },
      ]}
    >
      <View style={styles.rowBetween}>
        <View style={styles.flexWrap}>
          <Text
            style={[
              styles.itemTitle,
              { color: theme.colors.text, fontFamily: theme.fonts.semibold },
            ]}
          >
            {category.name}
          </Text>
        </View>
        <StatusBadge
          label={category.isActive ? 'Đang hiển thị' : 'Đã xóa'}
          tone={category.isActive ? 'success' : 'neutral'}
          size="sm"
        />
      </View>
      <Text
        style={[styles.itemMeta, { color: theme.colors.textSoft, fontFamily: theme.fonts.medium }]}
      >
        {activeProducts}/{category.products.length} sản phẩm đang hoạt động
      </Text>
      {category.description && category.description !== QUICK_CATEGORY_DESCRIPTION ? (
        <Text
          style={[
            styles.itemMeta,
            { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
          ]}
        >
          {category.description}
        </Text>
      ) : null}
      <View style={styles.actionRow}>
        <SecondaryButton label="Sửa" onPress={onEdit} style={styles.compactActionButton} />
        <SecondaryButton
          label="Xóa"
          onPress={onToggleActive}
          disabled={disabling || !canDelete}
          style={styles.compactActionButton}
        />
      </View>
    </View>
  );
}

function ProductRow({
  product,
  canDelete,
  onEdit,
  onToggleActive,
  disabling,
}: {
  product: AdminCanteenProductRecord & { categoryName: string; categoryIsActive: boolean };
  canDelete: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
  disabling: boolean;
}) {
  const theme = useAppTheme();
  const stockTone = product.stock === 0 ? 'danger' : product.stock <= 5 ? 'warning' : 'success';

  return (
    <View
      style={[
        styles.listCard,
        { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border },
      ]}
    >
      <View style={styles.productCardHeader}>
        <ProductImageThumbnail imageUrl={product.imageUrl} size={88} />
        <View style={styles.productCardBody}>
          <View style={styles.rowBetween}>
            <View style={styles.flexWrap}>
              <Text
                style={[
                  styles.itemTitle,
                  { color: theme.colors.text, fontFamily: theme.fonts.semibold },
                ]}
              >
                {product.name}
              </Text>
              <Text
                style={[
                  styles.itemMeta,
                  { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
                ]}
              >
                {formatCurrency(product.price)}đ · {product.categoryName}
              </Text>
            </View>
            <StatusBadge label={getStockLabel(product.stock)} tone={stockTone} size="sm" />
          </View>
          <View style={styles.metricRow}>
            <StatusBadge
              label={product.isActive ? 'Đang hiển thị' : 'Đã xóa'}
              tone={product.isActive ? 'success' : 'neutral'}
              size="sm"
            />
            {!product.categoryIsActive ? (
              <StatusBadge label="Danh mục đã xóa" tone="neutral" size="sm" />
            ) : null}
          </View>
          <Text
            style={[
              styles.itemMeta,
              { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
            ]}
          >
            Tồn kho: {product.stock}
          </Text>
          <View style={styles.actionRow}>
            <SecondaryButton label="Sửa" onPress={onEdit} style={styles.compactActionButton} />
            <SecondaryButton
              label="Xóa"
              onPress={onToggleActive}
              disabled={disabling || !canDelete}
              style={styles.compactActionButton}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

function OrderRow({ order, onPress }: { order: CanteenAdminOrderRecord; onPress: () => void }) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.listCard,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.84 : 1,
        },
      ]}
    >
      <View style={styles.rowBetween}>
        <View style={styles.flexWrap}>
          <Text
            style={[
              styles.itemTitle,
              { color: theme.colors.text, fontFamily: theme.fonts.semibold },
            ]}
          >
            {order.orderCode}
          </Text>
        </View>
        <View style={styles.badgeWrap}>
          <StatusBadge
            label={getOrderStatusLabel(order.status)}
            tone={getOrderStatusTone(order.status)}
            size="sm"
          />
        </View>
      </View>
      <Text
        style={[
          styles.itemMeta,
          { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
        ]}
      >
        {order.requestedBy.fullName}
      </Text>
      <Text
        style={[
          styles.itemMeta,
          { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
        ]}
      >
        {order.items.length} món · {formatCurrency(order.totalAmount)}đ
      </Text>
      <Text
        style={[styles.itemMeta, { color: theme.colors.textSoft, fontFamily: theme.fonts.medium }]}
      >
        {formatDateTime(order.createdAt)}
      </Text>
    </Pressable>
  );
}

function RetryPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border },
      ]}
    >
      <Text
        style={[
          styles.helperText,
          { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
        ]}
      >
        {message}
      </Text>
      <SecondaryButton label="Thử lại" onPress={onRetry} style={styles.retryButton} />
    </View>
  );
}

function SectionMessage({ title }: { title: string }) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border },
      ]}
    >
      <Text
        style={[
          styles.helperText,
          { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
        ]}
      >
        {title}
      </Text>
    </View>
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
            contentContainerStyle={styles.sheetScrollContent}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function OrderDetailSheet({
  order,
  canDelete,
  deleting,
  onDelete,
}: {
  order: CanteenAdminOrderRecord;
  canDelete: boolean;
  deleting: boolean;
  onDelete: () => void;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.sheetContent}>
      <View style={styles.detailBlock}>
        <Text
          style={[
            styles.detailLabel,
            { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
          ]}
        >
          Khách hàng
        </Text>
        <Text
          style={[
            styles.detailValue,
            { color: theme.colors.text, fontFamily: theme.fonts.semibold },
          ]}
        >
          {order.requestedBy.fullName}
        </Text>
        <Text
          style={[
            styles.detailHint,
            { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
          ]}
        >
          {order.requestedBy.email}
        </Text>
      </View>

      <View style={styles.detailBlock}>
        <Text
          style={[
            styles.detailLabel,
            { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
          ]}
        >
          Trạng thái
        </Text>
        <StatusBadge
          label={getOrderStatusLabel(order.status)}
          tone={getOrderStatusTone(order.status)}
        />
      </View>

      <View style={styles.detailBlock}>
        <Text
          style={[
            styles.detailLabel,
            { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
          ]}
        >
          Món đã đặt
        </Text>
        <View style={styles.detailList}>
          {order.items.map((item) => (
            <View
              key={item.id}
              style={[
                styles.detailListCard,
                { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border },
              ]}
            >
              <Text
                style={[
                  styles.detailValue,
                  { color: theme.colors.text, fontFamily: theme.fonts.semibold },
                ]}
              >
                {item.productName}
              </Text>
              <Text
                style={[
                  styles.detailHint,
                  { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
                ]}
              >
                {item.quantity} x {formatCurrency(item.unitPrice)}đ
              </Text>
              <Text
                style={[
                  styles.detailHint,
                  { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
                ]}
              >
                Thành tiền: {formatCurrency(item.lineTotal)}đ
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.detailBlock}>
        <Text
          style={[
            styles.detailLabel,
            { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
          ]}
        >
          Ghi chú
        </Text>
        <Text
          style={[
            styles.detailHint,
            { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
          ]}
        >
          {order.note || 'Không có ghi chú'}
        </Text>
      </View>

      <View style={styles.detailBlock}>
        <Text
          style={[
            styles.detailLabel,
            { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
          ]}
        >
          Thanh toán
        </Text>
        <Text
          style={[
            styles.detailHint,
            { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
          ]}
        >
          {order.latestPayment
            ? `${order.latestPayment.status} · ${formatCurrency(order.latestPayment.amount)}đ`
            : 'Chưa có giao dịch thanh toán'}
        </Text>
      </View>

      <View style={styles.detailBlock}>
        <Text
          style={[
            styles.detailLabel,
            { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
          ]}
        >
          Tổng cộng
        </Text>
        <Text
          style={[styles.totalValue, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}
        >
          {formatCurrency(order.totalAmount)}đ
        </Text>
      </View>

      {canDelete ? (
        <View style={styles.sheetActionRow}>
          <SecondaryButton
            label={deleting ? 'Đang xóa...' : 'Xóa lịch sử đơn'}
            onPress={onDelete}
            disabled={deleting}
            style={styles.flexButton}
          />
        </View>
      ) : null}
    </View>
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

function CatalogTabChip({
  value,
  active,
  onPress,
}: {
  value: string;
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
        styles.catalogTabChip,
        {
          backgroundColor: active ? theme.colors.surface : 'transparent',
          borderColor: active ? theme.colors.border : 'transparent',
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <View style={styles.catalogTabChipContent}>
        <View style={styles.catalogTabChipValueRow}>
          <Text
            style={[
              styles.catalogTabChipValue,
              {
                color: active ? theme.colors.text : theme.colors.text,
                fontFamily: theme.fonts.semibold,
              },
            ]}
          >
            {value}
          </Text>
          <Ionicons name="chevron-down" size={16} color={theme.colors.textSoft} />
        </View>
      </View>
    </Pressable>
  );
}

function getStockLabel(stock: number) {
  if (stock === 0) {
    return 'Hết hàng';
  }
  if (stock <= 5) {
    return 'Sắp hết';
  }
  return 'Còn hàng';
}

function getOptionLabel(options: OptionItem[], key: string) {
  return options.find((item) => item.key === key)?.label ?? options[0]?.label ?? '';
}

function getOrderStatusLabel(status: CanteenAdminOrderRecord['status']) {
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

function getOrderStatusTone(status: CanteenAdminOrderRecord['status']) {
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

function showError(title: string, error: unknown) {
  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error && error.message.trim()
        ? error.message
        : error &&
            typeof error === 'object' &&
            typeof (error as { message?: unknown }).message === 'string'
          ? ((error as { message?: string }).message ?? '')
          : 'Không thể xử lý yêu cầu lúc này. Vui lòng thử lại.';

  Alert.alert(title, message);
}

const styles = StyleSheet.create({
  headerBlock: {
    gap: 6,
  },
  headerTitle: {
    fontSize: 24,
  },
  headerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
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
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  tabChipText: {
    fontSize: 14,
  },
  catalogTabChip: {
    flex: 1,
    minHeight: 58,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  catalogTabChipContent: {
    gap: 0,
  },
  catalogTabChipValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  catalogTabChipValue: {
    fontSize: 15,
  },
  catalogChoiceCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 6,
  },
  catalogChoiceTitle: {
    fontSize: 16,
  },
  catalogChoiceHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionStack: {
    gap: 12,
  },
  searchShell: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    fontSize: 15,
  },
  dropdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dropdownField: {
    flex: 1,
    minWidth: 104,
    gap: 8,
  },
  filterLabel: {
    fontSize: 12,
  },
  dropdownTrigger: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dropdownValue: {
    flex: 1,
    fontSize: 14,
  },
  addButtonWrap: {
    flexBasis: '100%',
  },
  optionSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '72%',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  optionSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 10,
  },
  optionSheetTitle: {
    fontSize: 18,
  },
  optionList: {
    gap: 8,
    paddingBottom: 8,
  },
  optionRow: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionRowText: {
    fontSize: 14,
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  productCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  productCardBody: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  productImageFrame: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImageAsset: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 8,
  },
  productImagePlaceholderText: {
    fontSize: 12,
    textAlign: 'center',
  },
  panel: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  helperText: {
    fontSize: 14,
    lineHeight: 20,
  },
  retryButton: {
    minHeight: 44,
  },
  listWrap: {
    gap: 10,
  },
  listCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    flexWrap: 'wrap',
  },
  flexWrap: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  badgeWrap: {
    minWidth: 88,
    maxWidth: '100%',
    alignItems: 'flex-end',
  },
  itemTitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  itemMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  compactActionButton: {
    flex: 1,
    minHeight: 42,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetPanel: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '86%',
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
    paddingBottom: 8,
  },
  sheetContent: {
    gap: 14,
  },
  inlineFields: {
    flexDirection: 'row',
    gap: 10,
  },
  inlineFieldItem: {
    flex: 1,
  },
  multilineInput: {
    minHeight: 84,
    paddingTop: 14,
  },
  imageUploadField: {
    gap: 8,
  },
  imageUploadCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 10,
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
  imageUploadError: {
    fontSize: 12,
    lineHeight: 18,
  },
  sheetActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flexButton: {
    flex: 1,
  },
  confirmMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  detailBlock: {
    gap: 6,
  },
  detailLabel: {
    fontSize: 12,
  },
  detailValue: {
    fontSize: 15,
    lineHeight: 20,
  },
  detailHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  detailList: {
    gap: 8,
  },
  detailListCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  totalValue: {
    fontSize: 22,
  },
});
