import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CanteenOrderStatus, Prisma } from '@prisma/client';

import { CanteenService } from './canteen.service';

describe('CanteenService', () => {
  const prisma: any = {
    $transaction: jest.fn(),
    canteenCategory: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    canteenProduct: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    canteenOrder: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    canteenPaymentTransaction: {
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const configService = {
    get: jest.fn(),
  };

  let service: CanteenService;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1730000000000);
    configService.get.mockImplementation((key: string) => {
      const values: Record<string, string> = {
        SEPAY_API_TOKEN: 'sepay-token',
        SEPAY_BANK_ACCOUNT_UUID: 'bank-account-uuid',
        SEPAY_API_BASE_URL: 'https://userapi.sepay.vn/v2',
        SEPAY_BANK_NAME: 'MBBank',
        SEPAY_ACCOUNT_NUMBER: '123456789',
        SEPAY_ACCOUNT_NAME: 'SMART CAMPUS',
        SEPAY_WEBHOOK_API_KEY: 'sepay-secret',
        SEPAY_QR_BASE_URL: 'https://qr.sepay.vn/img',
      };
      return values[key];
    });
    fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({}) } as never);
    service = new CanteenService(prisma, configService as never);
    prisma.$transaction.mockImplementation(async (callback: (tx: typeof prisma) => Promise<unknown>) =>
      callback(prisma),
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('forbids payment creation when order is not owned by current user', async () => {
    prisma.canteenOrder.findUnique.mockResolvedValue({
      id: 'order-1',
      createdById: 'student-2',
      status: CanteenOrderStatus.pending_payment,
      totalAmount: 45000,
      items: [],
    });

    await expect(service.createMomoPayment('student-1', 'order-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects payment creation when order status is not payable', async () => {
    prisma.canteenOrder.findUnique.mockResolvedValue({
      id: 'order-1',
      createdById: 'student-1',
      status: CanteenOrderStatus.paid,
      totalAmount: 45000,
      items: [],
    });

    await expect(service.createMomoPayment('student-1', 'order-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('creates a SePay QR checkout for a payable order', async () => {
    prisma.canteenOrder.findUnique.mockResolvedValue({
      id: 'order12345',
      orderCode: 'CTN-1',
      createdById: 'student-1',
      status: CanteenOrderStatus.pending_payment,
      totalAmount: 45000,
      items: [],
    });
    prisma.canteenPaymentTransaction.create.mockImplementation(async ({ data }: any) => ({
      id: 'canteen-payment-1',
      ...data,
    }));
    prisma.canteenPaymentTransaction.update.mockResolvedValue({});

    const result = await service.createSepayPayment('student-1', 'order12345');

    expect(result).toEqual({
      transactionId: 'canteen-payment-1',
      provider: 'sepay',
      mode: 'qr',
      amount: 45000,
      orderId: 'SEPAYCANTEEN1730000000000order123',
      checkoutUrl:
        'https://qr.sepay.vn/img?acc=123456789&bank=MBBank&amount=45000&des=SEPAYCANTEEN1730000000000order123',
      bankName: 'MBBank',
      accountNumber: '123456789',
      accountName: 'SMART CAMPUS',
      transferDescription: 'SEPAYCANTEEN1730000000000order123',
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(prisma.canteenPaymentTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          provider: 'sepay',
          providerOrderId: 'SEPAYCANTEEN1730000000000order123',
        }),
      }),
    );
    expect(prisma.canteenPaymentTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'canteen-payment-1' },
        data: expect.objectContaining({
          checkoutUrl:
            'https://qr.sepay.vn/img?acc=123456789&bank=MBBank&amount=45000&des=SEPAYCANTEEN1730000000000order123',
        }),
      }),
    );
  });

  it('rejects completing an order that is not paid', async () => {
    prisma.canteenOrder.findUnique.mockResolvedValue({
      id: 'order-1',
      createdById: 'student-1',
      status: CanteenOrderStatus.pending_payment,
    });

    await expect(service.completeOrder('order-1', 'canteen-admin-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('deletes a pending order of current user and restores stock', async () => {
    prisma.canteenOrder.findUnique.mockResolvedValue({
      id: 'order-1',
      createdById: 'student-1',
      status: CanteenOrderStatus.pending_payment,
      items: [
        {
          id: 'item-1',
          productId: 'product-1',
          quantity: 2,
        },
      ],
    });
    prisma.canteenProduct.update.mockResolvedValue({});
    prisma.canteenOrder.delete.mockResolvedValue({});

    await expect(service.deleteOrder('student-1', 'order-1')).resolves.toEqual({
      id: 'order-1',
      deleted: true,
    });

    expect(prisma.canteenProduct.update).toHaveBeenCalledWith({
      where: { id: 'product-1' },
      data: { stock: { increment: 2 } },
    });
    expect(prisma.canteenOrder.delete).toHaveBeenCalledWith({
      where: { id: 'order-1' },
    });
  });

  it('rejects deleting a paid order', async () => {
    prisma.canteenOrder.findUnique.mockResolvedValue({
      id: 'order-1',
      createdById: 'student-1',
      status: CanteenOrderStatus.paid,
      items: [],
    });

    await expect(service.deleteOrder('student-1', 'order-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects deleting an order owned by another user', async () => {
    prisma.canteenOrder.findUnique.mockResolvedValue({
      id: 'order-1',
      createdById: 'student-2',
      status: CanteenOrderStatus.pending_payment,
      items: [],
    });

    await expect(service.deleteOrder('student-1', 'order-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows admin history deletion and restores stock for unpaid orders', async () => {
    prisma.canteenOrder.findUnique.mockResolvedValue({
      id: 'order-2',
      status: CanteenOrderStatus.pending_payment,
      items: [
        {
          id: 'item-2',
          productId: 'product-2',
          quantity: 3,
        },
      ],
    });
    prisma.canteenProduct.update.mockResolvedValue({});
    prisma.canteenOrder.delete.mockResolvedValue({});

    await expect(service.deleteAdminOrder('order-2')).resolves.toEqual({
      id: 'order-2',
      deleted: true,
      restoredStock: true,
    });

    expect(prisma.canteenProduct.update).toHaveBeenCalledWith({
      where: { id: 'product-2' },
      data: { stock: { increment: 3 } },
    });
    expect(prisma.canteenOrder.delete).toHaveBeenCalledWith({
      where: { id: 'order-2' },
    });
  });

  it('allows admin history deletion without restoring stock for paid orders', async () => {
    prisma.canteenOrder.findUnique.mockResolvedValue({
      id: 'order-3',
      status: CanteenOrderStatus.completed,
      items: [
        {
          id: 'item-3',
          productId: 'product-3',
          quantity: 1,
        },
      ],
    });
    prisma.canteenOrder.delete.mockResolvedValue({});

    await expect(service.deleteAdminOrder('order-3')).resolves.toEqual({
      id: 'order-3',
      deleted: true,
      restoredStock: false,
    });

    expect(prisma.canteenProduct.update).not.toHaveBeenCalled();
    expect(prisma.canteenOrder.delete).toHaveBeenCalledWith({
      where: { id: 'order-3' },
    });
  });

  it('rejects admin history deletion when order does not exist', async () => {
    prisma.canteenOrder.findUnique.mockResolvedValue(null);

    await expect(service.deleteAdminOrder('missing-order')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('maps duplicate category create conflict to conflict exception', async () => {
    prisma.canteenCategory.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.createCategory({
        name: 'Drinks',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('maps duplicate product create conflict to conflict exception', async () => {
    prisma.canteenCategory.findUnique.mockResolvedValue({ id: 'category-1' });
    prisma.canteenProduct.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.createProduct({
        categoryId: 'category-1',
        name: 'Milk Tea',
        price: 25000,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
