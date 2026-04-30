import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CanteenOrderStatus } from '@prisma/client';

import { CanteenService } from './canteen.service';

describe('CanteenService', () => {
  const prisma: any = {
    canteenOrder: {
      findUnique: jest.fn(),
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
    fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        data: {
          id: 'sepay-order-1',
          order_code: 'SEPAYCANTEEN1730000000000order123',
          va_number: '963NQDORDER123',
          amount: 45000,
          status: 'Pending',
          bank_name: 'MBBank',
          account_holder_name: 'SMART CAMPUS',
          account_number: '123456789',
          qr_code_url: 'https://qr.sepay.vn/img?acc=123456789',
        },
      }),
    } as never);
    service = new CanteenService(prisma, configService as never);
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
      checkoutUrl: 'https://qr.sepay.vn/img?acc=123456789',
      bankName: 'MBBank',
      accountNumber: '123456789',
      accountName: 'SMART CAMPUS',
      transferDescription: 'SEPAYCANTEEN1730000000000order123',
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://userapi.sepay.vn/v2/bank-accounts/bank-account-uuid/orders',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sepay-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          order_code: 'SEPAYCANTEEN1730000000000order123',
          amount: 45000,
          with_qrcode: '1',
          qrcode_template: 'compact',
        }),
      }),
    );
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
          checkoutUrl: 'https://qr.sepay.vn/img?acc=123456789',
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
});
