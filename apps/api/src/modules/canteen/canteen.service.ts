import { createHmac } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CanteenOrderStatus, Prisma, Role } from '@prisma/client';
import type { PaymentCheckout } from '@smart-campus/shared';

import { PrismaService } from '../../database/prisma.service';
import { AvatarStorageService, type AvatarUploadFile } from '../storage/avatar-storage.service';

import type {
  CreateCanteenCategoryDto,
  CreateCanteenOrderDto,
  CreateCanteenProductDto,
  UpdateCanteenCategoryDto,
  UpdateCanteenProductDto,
} from './dto/canteen.dto';

const MOMO_SANDBOX_ENDPOINT = 'https://test-payment.momo.vn/v2/gateway/api/create';
const SEPAY_DEFAULT_QR_BASE_URL = 'https://qr.sepay.vn/img';

interface MomoConfig {
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  redirectUrl: string;
  ipnUrl: string;
}

interface SepayConfig {
  bankName: string;
  accountNumber: string;
  accountName: string;
  webhookApiKey: string;
  qrBaseUrl: string;
}

function toInputJson(value: Record<string, unknown>) {
  return value as Prisma.InputJsonValue;
}

function makeOrderCode() {
  const now = new Date();
  const compact = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate(),
  ).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(
    2,
    '0',
  )}${String(now.getSeconds()).padStart(2, '0')}`;
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CTN-${compact}-${suffix}`;
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function buildInternalSlug(name: string) {
  const base = slugify(name) || 'item';
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

@Injectable()
export class CanteenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly avatarStorageService: AvatarStorageService,
  ) {}

  async getCatalog() {
    const categories = await this.prisma.canteenCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        products: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      products: category.products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        price: product.price,
        stock: product.stock,
      })),
    }));
  }

  async getAdminCatalog(includeInactive = false) {
    const categories = await this.prisma.canteenCategory.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        products: {
          where: includeInactive ? undefined : { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      products: category.products.map((product) => ({
        id: product.id,
        categoryId: product.categoryId,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        price: product.price,
        stock: product.stock,
        sortOrder: product.sortOrder,
        isActive: product.isActive,
      })),
    }));
  }

  async createCategory(dto: CreateCanteenCategoryDto) {
    try {
      return await this.prisma.canteenCategory.create({
        data: {
          name: dto.name.trim(),
          slug: buildInternalSlug(dto.name.trim()),
          description: dto.description?.trim() || null,
          isActive: dto.isActive ?? true,
          sortOrder: dto.sortOrder ?? 0,
        },
      });
    } catch (error) {
      this.rethrowCatalogConflict(error, 'Danh mục canteen');
    }
  }

  async updateCategory(categoryId: string, dto: UpdateCanteenCategoryDto) {
    await this.assertCategoryExists(categoryId);
    try {
      return await this.prisma.canteenCategory.update({
        where: { id: categoryId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description?.trim() || null }
            : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
          ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        },
      });
    } catch (error) {
      this.rethrowCatalogConflict(error, 'Danh mục canteen');
    }
  }

  async removeCategory(categoryId: string) {
    await this.assertCategoryExists(categoryId);
    return this.prisma.canteenCategory.update({
      where: { id: categoryId },
      data: { isActive: false },
    });
  }

  async createProduct(dto: CreateCanteenProductDto) {
    await this.assertCategoryExists(dto.categoryId);
    try {
      return await this.prisma.canteenProduct.create({
        data: {
          categoryId: dto.categoryId,
          name: dto.name.trim(),
          slug: buildInternalSlug(dto.name.trim()),
          description: dto.description?.trim() || null,
          imageUrl: dto.imageUrl?.trim() || null,
          price: dto.price,
          stock: dto.stock ?? 0,
          isActive: dto.isActive ?? true,
          sortOrder: dto.sortOrder ?? 0,
        },
      });
    } catch (error) {
      this.rethrowCatalogConflict(error, 'Sản phẩm canteen');
    }
  }

  async updateProduct(productId: string, dto: UpdateCanteenProductDto) {
    await this.assertProductExists(productId);
    if (dto.categoryId) {
      await this.assertCategoryExists(dto.categoryId);
    }

    try {
      return await this.prisma.canteenProduct.update({
        where: { id: productId },
        data: {
          ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description?.trim() || null }
            : {}),
          ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl?.trim() || null } : {}),
          ...(dto.price !== undefined ? { price: dto.price } : {}),
          ...(dto.stock !== undefined ? { stock: dto.stock } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
          ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        },
      });
    } catch (error) {
      this.rethrowCatalogConflict(error, 'Sản phẩm canteen');
    }
  }

  async uploadProductImage(actorId: string, file: AvatarUploadFile) {
    return this.avatarStorageService.uploadCanteenProductImage(actorId, file);
  }

  async removeProduct(productId: string) {
    await this.assertProductExists(productId);
    return this.prisma.canteenProduct.update({
      where: { id: productId },
      data: { isActive: false },
    });
  }

  async createOrder(userId: string, dto: CreateCanteenOrderDto) {
    if (!dto.items.length) {
      throw new BadRequestException('Đơn hàng phải có ít nhất một món');
    }
    const productIds = [...new Set(dto.items.map((item) => item.productId.trim()))];
    const products = await this.prisma.canteenProduct.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException('Có sản phẩm không tồn tại hoặc đã ngừng bán');
    }

    const productById = new Map(products.map((product) => [product.id, product]));
    const lineItems = dto.items.map((item) => {
      const product = productById.get(item.productId.trim());
      if (!product) {
        throw new NotFoundException('Có sản phẩm không hợp lệ');
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Sản phẩm ${product.name} không đủ tồn kho`);
      }
      return {
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: item.quantity,
        lineTotal: product.price * item.quantity,
      };
    });
    const totalAmount = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.canteenOrder.create({
        data: {
          orderCode: makeOrderCode(),
          createdById: userId,
          note: dto.note?.trim() || null,
          totalAmount,
          items: {
            createMany: {
              data: lineItems,
            },
          },
        },
      });

      for (const item of lineItems) {
        await tx.canteenProduct.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return order;
    });
  }

  async listMyOrders(userId: string) {
    const orders = await this.prisma.canteenOrder.findMany({
      where: { createdById: userId },
      include: {
        items: true,
        payments: {
          orderBy: [{ createdAt: 'desc' }],
          take: 1,
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
    return orders.map((order) => this.mapOrder(order));
  }

  async listAdminOrders(viewerRole: Role) {
    const orders = await this.prisma.canteenOrder.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        completedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        items: true,
        payments: {
          orderBy: [{ createdAt: 'desc' }],
          take: 1,
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return orders.map((order) => ({
      ...this.mapOrder(order),
      requestedBy: this.mapUser(order.createdBy),
      completedBy: order.completedBy ? this.mapUser(order.completedBy) : null,
      viewerRole,
    }));
  }

  async deleteOrder(userId: string, orderId: string) {
    const order = await this.prisma.canteenOrder.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }
    if (order.createdById !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa đơn hàng này');
    }

    const deletableStatuses: CanteenOrderStatus[] = [
      CanteenOrderStatus.pending_payment,
      CanteenOrderStatus.payment_failed,
    ];
    if (!deletableStatuses.includes(order.status)) {
      throw new BadRequestException('Chỉ có thể xóa đơn chưa thanh toán hoặc thanh toán lỗi');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.canteenProduct.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      await tx.canteenOrder.delete({
        where: { id: order.id },
      });
    });

    return {
      id: order.id,
      deleted: true,
    };
  }

  async deleteAdminOrder(orderId: string) {
    const order = await this.prisma.canteenOrder.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    const restorableStatuses: CanteenOrderStatus[] = [
      CanteenOrderStatus.pending_payment,
      CanteenOrderStatus.payment_failed,
      CanteenOrderStatus.cancelled,
    ];
    const shouldRestoreStock = restorableStatuses.includes(order.status);

    await this.prisma.$transaction(async (tx) => {
      if (shouldRestoreStock) {
        for (const item of order.items) {
          await tx.canteenProduct.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      await tx.canteenOrder.delete({
        where: { id: order.id },
      });
    });

    return {
      id: order.id,
      deleted: true,
      restoredStock: shouldRestoreStock,
    };
  }

  async completeOrder(orderId: string, actorId: string) {
    const order = await this.prisma.canteenOrder.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        createdById: true,
        status: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }
    if (order.status !== CanteenOrderStatus.paid) {
      throw new BadRequestException('Chỉ đơn hàng đã thanh toán mới được hoàn thành');
    }

    const updated = await this.prisma.canteenOrder.update({
      where: { id: order.id },
      data: {
        status: CanteenOrderStatus.completed,
        completedById: actorId,
        completedAt: new Date(),
      },
      include: {
        items: true,
        payments: {
          orderBy: [{ createdAt: 'desc' }],
          take: 1,
        },
      },
    });

    await this.notifyOrder(
      [order.createdById, ...(await this.getCanteenAdminUserIds())],
      'canteen',
      'Đơn canteen đã hoàn thành',
      `Đơn ${updated.orderCode} đã được đánh dấu hoàn thành.`,
      { orderId: updated.id, status: updated.status },
    );
    return this.mapOrder(updated);
  }

  async createMomoPayment(userId: string, orderId: string) {
    const order = await this.prisma.canteenOrder.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }
    if (order.createdById !== userId) {
      throw new ForbiddenException('Bạn không có quyền thanh toán đơn hàng này');
    }
    const payableStatuses: CanteenOrderStatus[] = [
      CanteenOrderStatus.pending_payment,
      CanteenOrderStatus.payment_failed,
    ];
    if (!payableStatuses.includes(order.status)) {
      throw new BadRequestException('Đơn hàng không còn ở trạng thái cho phép thanh toán');
    }

    const momoConfig = this.getMomoConfigOrThrow();
    const now = Date.now();
    const providerOrderId = `MOMO-CANTEEN-${now}-${order.id.slice(0, 8)}`;
    const requestId = `REQ-CANTEEN-${now}-${order.id.slice(0, 8)}`;

    const transaction = await this.prisma.canteenPaymentTransaction.create({
      data: {
        orderId: order.id,
        provider: 'momo',
        providerOrderId,
        requestId,
        amount: order.totalAmount,
        status: 'pending',
        requestPayload: toInputJson({ orderId: order.id, orderCode: order.orderCode }),
      },
    });

    const checkout = await this.createSandboxCheckout(
      `Thanh toán canteen ${order.orderCode}`,
      transaction,
      momoConfig,
    );

    await this.prisma.canteenPaymentTransaction.update({
      where: { id: transaction.id },
      data: {
        checkoutUrl: checkout.checkoutUrl,
      },
    });

    return checkout;
  }

  async createSepayPayment(userId: string, orderId: string): Promise<PaymentCheckout> {
    const order = await this.prisma.canteenOrder.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }
    if (order.createdById !== userId) {
      throw new ForbiddenException('Bạn không có quyền thanh toán đơn hàng này');
    }
    const payableStatuses: CanteenOrderStatus[] = [
      CanteenOrderStatus.pending_payment,
      CanteenOrderStatus.payment_failed,
    ];
    if (!payableStatuses.includes(order.status)) {
      throw new BadRequestException('Đơn hàng không còn ở trạng thái cho phép thanh toán');
    }

    const sepayConfig = this.getSepayConfigOrThrow();
    const now = Date.now();
    const providerOrderId = `SEPAYCANTEEN${now}${order.id.slice(0, 8).replace(/[^a-zA-Z0-9]/g, '')}`;
    const checkoutUrl = this.buildSepayCheckoutUrl(sepayConfig, order.totalAmount, providerOrderId);

    const transaction = await this.prisma.canteenPaymentTransaction.create({
      data: {
        orderId: order.id,
        provider: 'sepay',
        providerOrderId,
        requestId: providerOrderId,
        amount: order.totalAmount,
        status: 'pending',
        requestPayload: toInputJson({
          orderId: order.id,
          orderCode: order.orderCode,
          bankName: sepayConfig.bankName,
          accountNumber: sepayConfig.accountNumber,
          transferDescription: providerOrderId,
        }),
      },
    });

    await this.prisma.canteenPaymentTransaction.update({
      where: { id: transaction.id },
      data: {
        checkoutUrl,
        responsePayload: toInputJson({
          checkoutUrl,
          bankName: sepayConfig.bankName,
          accountNumber: sepayConfig.accountNumber,
          accountName: sepayConfig.accountName,
          transferDescription: providerOrderId,
          generatedAt: new Date().toISOString(),
        }),
      },
    });

    return {
      transactionId: transaction.id,
      provider: 'sepay',
      mode: 'qr',
      amount: order.totalAmount,
      orderId: providerOrderId,
      checkoutUrl,
      bankName: sepayConfig.bankName,
      accountNumber: sepayConfig.accountNumber,
      accountName: sepayConfig.accountName,
      transferDescription: providerOrderId,
    };
  }

  async handleMomoWebhook(payload: Record<string, unknown>) {
    const orderToken = String(payload.orderId || payload.requestId || '').trim();
    if (!orderToken) {
      throw new BadRequestException('Webhook thiếu orderId');
    }

    const transaction =
      (await this.prisma.canteenPaymentTransaction.findUnique({
        where: { providerOrderId: orderToken },
      })) ??
      (await this.prisma.canteenPaymentTransaction.findFirst({
        where: { requestId: orderToken },
      }));

    if (!transaction) {
      throw new NotFoundException('Không tìm thấy giao dịch thanh toán canteen');
    }

    if (transaction.status === 'paid') {
      return {
        acknowledged: true,
        status: transaction.status,
        transactionId: transaction.id,
      };
    }

    const resultCode = Number(payload.resultCode ?? -1);
    if (resultCode === 0) {
      const updated = await this.prisma.$transaction(async (tx) => {
        const paidTx = await tx.canteenPaymentTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'paid',
            paidAt: new Date(),
            responsePayload: toInputJson(payload),
          },
        });
        const paidOrder = await tx.canteenOrder.update({
          where: { id: transaction.orderId },
          data: { status: CanteenOrderStatus.paid },
          include: {
            createdBy: {
              select: { id: true },
            },
          },
        });
        return { paidTx, paidOrder };
      });

      await this.notifyOrder(
        [updated.paidOrder.createdBy.id, ...(await this.getCanteenAdminUserIds())],
        'canteen',
        'Đơn canteen đã thanh toán',
        'Thanh toán đơn hàng canteen thành công.',
        { orderId: updated.paidOrder.id, status: CanteenOrderStatus.paid },
      );

      return {
        acknowledged: true,
        status: 'paid',
        transactionId: updated.paidTx.id,
      };
    }

    await this.prisma.$transaction([
      this.prisma.canteenPaymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'failed',
          responsePayload: toInputJson(payload),
        },
      }),
      this.prisma.canteenOrder.update({
        where: { id: transaction.orderId },
        data: { status: CanteenOrderStatus.payment_failed },
      }),
    ]);

    return {
      acknowledged: true,
      status: 'failed',
      transactionId: transaction.id,
    };
  }

  private mapOrder(order: {
    id: string;
    orderCode: string;
    status: CanteenOrderStatus;
    totalAmount: number;
    note: string | null;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | null;
    cancelledAt: Date | null;
    items: Array<{
      id: string;
      productId: string;
      productName: string;
      unitPrice: number;
      quantity: number;
      lineTotal: number;
    }>;
    payments: Array<{
      id: string;
      status: string;
      amount: number;
      checkoutUrl: string | null;
      createdAt: Date;
      paidAt: Date | null;
    }>;
  }) {
    return {
      id: order.id,
      orderCode: order.orderCode,
      status: order.status,
      totalAmount: order.totalAmount,
      note: order.note,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      completedAt: order.completedAt?.toISOString() ?? null,
      cancelledAt: order.cancelledAt?.toISOString() ?? null,
      items: order.items,
      latestPayment: order.payments[0]
        ? {
            id: order.payments[0].id,
            status: order.payments[0].status,
            amount: order.payments[0].amount,
            checkoutUrl: order.payments[0].checkoutUrl,
            createdAt: order.payments[0].createdAt.toISOString(),
            paidAt: order.payments[0].paidAt?.toISOString() ?? null,
          }
        : null,
    };
  }

  private mapUser(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
  }) {
    return {
      id: user.id,
      email: user.email,
      fullName: `${user.lastName} ${user.firstName}`.trim(),
      role: user.role,
    };
  }

  private async assertCategoryExists(categoryId: string) {
    const category = await this.prisma.canteenCategory.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục canteen');
    }
  }

  private async assertProductExists(productId: string) {
    const product = await this.prisma.canteenProduct.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm canteen');
    }
  }

  private async getCanteenAdminUserIds() {
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        role: Role.canteen_admin,
      },
      select: { id: true },
    });
    return users.map((item) => item.id);
  }

  private async notifyOrder(
    userIds: string[],
    type: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ) {
    const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
    if (!uniqueUserIds.length) {
      return;
    }

    await this.prisma.notification.createMany({
      data: uniqueUserIds.map((userId) => ({
        userId,
        title,
        body,
        type,
        data: data ? toInputJson(data) : undefined,
      })),
    });
  }

  private async createSandboxCheckout(
    orderInfo: string,
    transaction: {
      id: string;
      providerOrderId: string;
      requestId: string | null;
      amount: number;
    },
    config: MomoConfig,
  ) {
    const requestType = 'captureWallet';
    const requestId = transaction.requestId || transaction.providerOrderId;
    const extraData = '';
    const rawSignature = [
      `accessKey=${config.accessKey}`,
      `amount=${transaction.amount}`,
      `extraData=${extraData}`,
      `ipnUrl=${config.ipnUrl}`,
      `orderId=${transaction.providerOrderId}`,
      `orderInfo=${orderInfo}`,
      `partnerCode=${config.partnerCode}`,
      `redirectUrl=${config.redirectUrl}`,
      `requestId=${requestId}`,
      `requestType=${requestType}`,
    ].join('&');

    const signature = createHmac('sha256', config.secretKey).update(rawSignature).digest('hex');
    const payload = {
      partnerCode: config.partnerCode,
      requestId,
      amount: String(transaction.amount),
      orderId: transaction.providerOrderId,
      orderInfo,
      redirectUrl: config.redirectUrl,
      ipnUrl: config.ipnUrl,
      lang: 'vi',
      requestType,
      autoCapture: true,
      extraData,
      signature,
    };

    const response = await fetch(MOMO_SANDBOX_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const responseData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    const checkoutUrl = String(responseData.payUrl || responseData.deeplink || '');

    if (!response.ok || Number(responseData.resultCode ?? -1) !== 0 || !checkoutUrl) {
      await this.prisma.canteenPaymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'failed',
          responsePayload: toInputJson(responseData),
        },
      });
      throw new InternalServerErrorException(
        String(responseData.message || 'Không tạo được link thanh toán canteen'),
      );
    }

    return {
      transactionId: transaction.id,
      provider: 'momo',
      mode: 'sandbox',
      amount: transaction.amount,
      orderId: transaction.providerOrderId,
      checkoutUrl,
    };
  }

  private getMomoConfigOrThrow(): MomoConfig {
    const partnerCode = this.configService.get<string>('MOMO_PARTNER_CODE')?.trim();
    const accessKey = this.configService.get<string>('MOMO_ACCESS_KEY')?.trim();
    const secretKey = this.configService.get<string>('MOMO_SECRET_KEY')?.trim();
    const redirectUrl = this.configService.get<string>('MOMO_REDIRECT_URL')?.trim();
    const ipnUrl = this.configService.get<string>('MOMO_IPN_URL')?.trim();

    if (!partnerCode || !accessKey || !secretKey || !redirectUrl || !ipnUrl) {
      throw new InternalServerErrorException(
        'Cấu hình MoMo chưa đầy đủ cho canteen. Hãy kiểm tra các biến MOMO_*.',
      );
    }
    return {
      partnerCode,
      accessKey,
      secretKey,
      redirectUrl,
      ipnUrl,
    };
  }

  private getSepayConfigOrThrow(): SepayConfig {
    const bankName = this.configService.get<string>('SEPAY_BANK_NAME')?.trim();
    const accountNumber = this.configService.get<string>('SEPAY_ACCOUNT_NUMBER')?.trim();
    const accountName = this.configService.get<string>('SEPAY_ACCOUNT_NAME')?.trim() || '';
    const webhookApiKey =
      this.configService.get<string>('SEPAY_WEBHOOK_API_KEY')?.trim() ||
      this.configService.get<string>('SEPAY_API_TOKEN')?.trim() ||
      '';
    const qrBaseUrl =
      this.configService.get<string>('SEPAY_QR_BASE_URL')?.trim() || SEPAY_DEFAULT_QR_BASE_URL;

    if (!bankName || !accountNumber || !webhookApiKey) {
      throw new InternalServerErrorException(
        'Cấu hình SePay chưa đầy đủ cho canteen. Hãy kiểm tra SEPAY_BANK_NAME, SEPAY_ACCOUNT_NUMBER và SEPAY_WEBHOOK_API_KEY.',
      );
    }
    return {
      bankName,
      accountNumber,
      accountName,
      webhookApiKey,
      qrBaseUrl,
    };
  }

  private buildSepayCheckoutUrl(config: SepayConfig, amount: number, transferDescription: string) {
    const params = new URLSearchParams({
      acc: config.accountNumber,
      bank: config.bankName,
      amount: String(amount),
      des: transferDescription,
    });

    return `${config.qrBaseUrl.replace(/\/$/, '')}?${params.toString()}`;
  }

  private rethrowCatalogConflict(error: unknown, entityLabel: string): never {
    if (this.isUniqueConstraintError(error)) {
      throw new ConflictException(`${entityLabel} đã tồn tại`);
    }
    throw error;
  }

  private isUniqueConstraintError(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }
}
