import { apiClient } from './client';

export type CanteenOrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'completed'
  | 'cancelled'
  | 'payment_failed';

export interface CanteenCatalogCategory {
  id: string;
  name: string;
  description: string | null;
  products: Array<{
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    price: number;
    stock: number;
  }>;
}

export interface AdminCanteenProductRecord {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  stock: number;
  sortOrder: number;
  isActive: boolean;
}

export interface AdminCanteenCategoryRecord {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  products: AdminCanteenProductRecord[];
}

export interface CanteenOrderRecord {
  id: string;
  orderCode: string;
  status: CanteenOrderStatus;
  totalAmount: number;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  latestPayment: {
    id: string;
    status: string;
    amount: number;
    checkoutUrl: string | null;
    createdAt: string;
    paidAt: string | null;
  } | null;
}

export interface CanteenAdminOrderRecord extends CanteenOrderRecord {
  requestedBy: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
  completedBy: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  } | null;
  viewerRole: string;
}

export interface CreateCanteenOrderInput {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  note?: string;
}

export const canteenApi = {
  getCatalog: async (): Promise<CanteenCatalogCategory[]> => {
    return (await apiClient.get('/canteen/catalog')) as CanteenCatalogCategory[];
  },

  getAdminCatalog: async (params?: {
    includeInactive?: boolean;
  }): Promise<AdminCanteenCategoryRecord[]> => {
    return (await apiClient.get('/canteen/catalog/admin', {
      params: {
        ...(params?.includeInactive ? { includeInactive: true } : {}),
      },
    })) as AdminCanteenCategoryRecord[];
  },

  createOrder: async (payload: CreateCanteenOrderInput) => {
    return (await apiClient.post('/canteen/orders', payload)) as {
      id: string;
      orderCode: string;
      status: CanteenOrderStatus;
      totalAmount: number;
    };
  },

  getMyOrders: async (): Promise<CanteenOrderRecord[]> => {
    return (await apiClient.get('/canteen/orders/me')) as CanteenOrderRecord[];
  },

  getAdminOrders: async (): Promise<CanteenAdminOrderRecord[]> => {
    return (await apiClient.get('/canteen/orders/admin')) as CanteenAdminOrderRecord[];
  },

  deleteOrder: async (orderId: string) => {
    return (await apiClient.delete(
      `/canteen/orders/${encodeURIComponent(orderId)}`,
    )) as {
      id: string;
      deleted: boolean;
    };
  },

  deleteAdminOrder: async (orderId: string) => {
    return (await apiClient.delete(
      `/canteen/orders/admin/${encodeURIComponent(orderId)}`,
    )) as {
      id: string;
      deleted: boolean;
      restoredStock: boolean;
    };
  },

  completeOrder: async (orderId: string): Promise<CanteenOrderRecord> => {
    return (await apiClient.patch(
      `/canteen/orders/${encodeURIComponent(orderId)}/complete`,
    )) as CanteenOrderRecord;
  },

  createPayment: async (orderId: string) => {
    return (await apiClient.post(
      `/canteen/orders/${encodeURIComponent(orderId)}/pay`,
    )) as {
      transactionId: string;
      provider: 'momo';
      mode: 'sandbox';
      amount: number;
      orderId: string;
      checkoutUrl: string;
    };
  },

  createSepayPayment: async (orderId: string) => {
    return (await apiClient.post(
      `/canteen/orders/${encodeURIComponent(orderId)}/pay/sepay`,
    )) as {
      transactionId: string;
      provider: 'sepay';
      mode: 'qr';
      amount: number;
      orderId: string;
      checkoutUrl: string;
      bankName?: string;
      accountNumber?: string;
      accountName?: string;
      transferDescription?: string;
    };
  },

  createCategory: async (payload: {
    name: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) => {
    return (await apiClient.post('/canteen/categories', payload)) as {
      id: string;
      name: string;
    };
  },

  updateCategory: async (
    categoryId: string,
    payload: Partial<{
      name: string;
      description: string;
      sortOrder: number;
      isActive: boolean;
    }>,
  ) => {
    return (await apiClient.patch(
      `/canteen/categories/${encodeURIComponent(categoryId)}`,
      payload,
    )) as {
      id: string;
      name: string;
      isActive: boolean;
    };
  },

  removeCategory: async (categoryId: string) => {
    return (await apiClient.delete(
      `/canteen/categories/${encodeURIComponent(categoryId)}`,
    )) as {
      id: string;
      isActive: boolean;
    };
  },

  createProduct: async (payload: {
    categoryId: string;
    name: string;
    price: number;
    stock?: number;
    description?: string;
    imageUrl?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) => {
    return (await apiClient.post('/canteen/products', payload)) as {
      id: string;
      name: string;
      stock: number;
      price: number;
      isActive: boolean;
    };
  },

  updateProduct: async (
    productId: string,
    payload: Partial<{
      categoryId: string;
      name: string;
      price: number;
      stock: number;
      description: string;
      imageUrl: string;
      sortOrder: number;
      isActive: boolean;
    }>,
  ) => {
    return (await apiClient.patch(
      `/canteen/products/${encodeURIComponent(productId)}`,
      payload,
    )) as {
      id: string;
      name: string;
      stock: number;
      price: number;
      isActive: boolean;
    };
  },

  removeProduct: async (productId: string) => {
    return (await apiClient.delete(
      `/canteen/products/${encodeURIComponent(productId)}`,
    )) as {
      id: string;
      isActive: boolean;
    };
  },
};
