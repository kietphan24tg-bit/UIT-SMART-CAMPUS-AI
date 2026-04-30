import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { createHmac } from 'node:crypto';

import { PrismaService } from '../../database/prisma.service';

import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: {
    vehicle: { findUnique: jest.Mock };
    parkingSubscription: { create: jest.Mock; update: jest.Mock };
    paymentTransaction: {
      create: jest.Mock;
      update: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
    };
    paymentWebhookEvent: { create: jest.Mock };
    $transaction: jest.Mock;
  };
  let configService: { get: jest.Mock };
  let fetchSpy: jest.SpyInstance;
  let dateNowSpy: jest.SpyInstance;

  const momoConfig = {
    MOMO_PARTNER_CODE: 'partner-code',
    MOMO_ACCESS_KEY: 'access-key',
    MOMO_SECRET_KEY: 'secret-key',
    MOMO_REDIRECT_URL: 'http://192.168.1.7:3000/api/v1/payments/momo/return',
    MOMO_IPN_URL: 'http://192.168.1.7:3000/api/v1/payments/momo/webhook',
    SEPAY_API_TOKEN: 'sepay-token',
    SEPAY_BANK_ACCOUNT_UUID: 'bank-account-uuid',
    SEPAY_API_BASE_URL: 'https://userapi.sepay.vn/v2',
    SEPAY_BANK_NAME: 'MBBank',
    SEPAY_ACCOUNT_NUMBER: '123456789',
    SEPAY_ACCOUNT_NAME: 'SMART CAMPUS',
    SEPAY_WEBHOOK_API_KEY: 'sepay-secret',
    SEPAY_QR_BASE_URL: 'https://qr.sepay.vn/img',
  };

  beforeEach(async () => {
    prisma = {
      vehicle: {
        findUnique: jest.fn(),
      },
      parkingSubscription: {
        create: jest.fn(),
        update: jest.fn(),
      },
      paymentTransaction: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      paymentWebhookEvent: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
    };

    configService = {
      get: jest.fn((key: string) => momoConfig[key as keyof typeof momoConfig] ?? undefined),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = moduleRef.get(PaymentsService);
    dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1730000000000);
    fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ resultCode: 0, payUrl: 'https://momo.test/checkout' }),
    } as never);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    dateNowSpy.mockRestore();
  });

  it('creates a sandbox checkout and signs the MoMo payload', async () => {
    prisma.vehicle.findUnique.mockResolvedValue({
      id: 'veh12345',
      userId: 'user-1',
      plateNumber: '51F-123.45',
      subscription: {
        id: 'sub-1',
        monthlyFee: 50000,
        status: 'inactive',
        startDate: null,
        endDate: null,
        lastPaymentAt: null,
      },
    });

    prisma.paymentTransaction.create.mockImplementation(async ({ data }) => ({
      id: 'payment-1',
      subscriptionId: data.subscriptionId,
      providerOrderId: data.providerOrderId,
      requestId: data.requestId,
      amount: data.amount,
    }));
    prisma.paymentTransaction.update.mockResolvedValue({});

    const result = await service.createMomoPayment('user-1', 'veh12345');

    expect(result).toEqual({
      transactionId: 'payment-1',
      provider: 'momo',
      mode: 'sandbox',
      amount: 50000,
      orderId: 'MOMO-1730000000000-veh12345',
      checkoutUrl: 'https://momo.test/checkout',
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [requestUrl, requestInit] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(requestUrl).toBe('https://test-payment.momo.vn/v2/gateway/api/create');

    const payload = JSON.parse(String(requestInit.body)) as Record<string, string>;
    const requestId = 'REQ-1730000000000-veh12345';
    const orderId = 'MOMO-1730000000000-veh12345';
    const orderInfo = 'Thanh toán gửi xe tháng cho 51F-123.45';
    const rawSignature = [
      `accessKey=${momoConfig.MOMO_ACCESS_KEY}`,
      'amount=50000',
      'extraData=',
      `ipnUrl=${momoConfig.MOMO_IPN_URL}`,
      `orderId=${orderId}`,
      `orderInfo=${orderInfo}`,
      `partnerCode=${momoConfig.MOMO_PARTNER_CODE}`,
      `redirectUrl=${momoConfig.MOMO_REDIRECT_URL}`,
      `requestId=${requestId}`,
      'requestType=captureWallet',
    ].join('&');

    expect(payload).toMatchObject({
      partnerCode: momoConfig.MOMO_PARTNER_CODE,
      requestId,
      amount: '50000',
      orderId,
      orderInfo,
      redirectUrl: momoConfig.MOMO_REDIRECT_URL,
      ipnUrl: momoConfig.MOMO_IPN_URL,
      lang: 'vi',
      requestType: 'captureWallet',
      autoCapture: true,
      extraData: '',
    });
    expect(payload.signature).toBe(
      createHmac('sha256', momoConfig.MOMO_SECRET_KEY).update(rawSignature).digest('hex'),
    );

    expect(prisma.paymentTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'payment-1' },
        data: expect.objectContaining({
          checkoutUrl: 'https://momo.test/checkout',
        }),
      }),
    );
  });

  it('fails fast when MoMo config is missing', async () => {
    configService.get.mockImplementation(() => '');
    prisma.vehicle.findUnique.mockResolvedValue({
      id: 'veh12345',
      userId: 'user-1',
      plateNumber: '51F-123.45',
      subscription: {
        id: 'sub-1',
        monthlyFee: 50000,
        status: 'inactive',
        startDate: null,
        endDate: null,
        lastPaymentAt: null,
      },
    });

    await expect(service.createMomoPayment('user-1', 'veh12345')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    expect(prisma.paymentTransaction.create).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('creates a SePay QR checkout through the SePay order API', async () => {
    prisma.vehicle.findUnique.mockResolvedValue({
      id: 'veh12345',
      userId: 'user-1',
      plateNumber: '51F-123.45',
      subscription: {
        id: 'sub-1',
        monthlyFee: 50000,
        status: 'inactive',
        startDate: null,
        endDate: null,
        lastPaymentAt: null,
      },
    });

    prisma.paymentTransaction.create.mockImplementation(async ({ data }) => ({
      id: 'payment-1',
      ...data,
    }));
    prisma.paymentTransaction.update.mockResolvedValue({});
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'success',
        data: {
          id: 'sepay-order-1',
          order_code: 'SEPAYPARKING1730000000000veh12345',
          va_number: '963NQDORDER123',
          amount: 50000,
          status: 'Pending',
          bank_name: 'MBBank',
          account_holder_name: 'SMART CAMPUS',
          account_number: '123456789',
          qr_code_url: 'https://qr.sepay.vn/img?acc=123456789',
        },
      }),
    } as never);

    const result = await service.createSepayPayment('user-1', 'veh12345');

    expect(result).toEqual({
      transactionId: 'payment-1',
      provider: 'sepay',
      mode: 'qr',
      amount: 50000,
      orderId: 'SEPAYPARKING1730000000000veh12345',
      checkoutUrl: 'https://qr.sepay.vn/img?acc=123456789',
      bankName: 'MBBank',
      accountNumber: '123456789',
      accountName: 'SMART CAMPUS',
      transferDescription: 'SEPAYPARKING1730000000000veh12345',
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
          order_code: 'SEPAYPARKING1730000000000veh12345',
          amount: 50000,
          with_qrcode: '1',
          qrcode_template: 'compact',
        }),
      }),
    );
    expect(prisma.paymentTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          provider: 'sepay',
          providerOrderId: 'SEPAYPARKING1730000000000veh12345',
        }),
      }),
    );
    expect(prisma.paymentTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'payment-1' },
        data: expect.objectContaining({
          checkoutUrl: 'https://qr.sepay.vn/img?acc=123456789',
        }),
      }),
    );
  });

  it('rejects payment creation for a vehicle that belongs to another user', async () => {
    prisma.vehicle.findUnique.mockResolvedValue({
      id: 'veh12345',
      userId: 'user-2',
      plateNumber: '51F-123.45',
      subscription: {
        id: 'sub-1',
        monthlyFee: 50000,
        status: 'inactive',
        startDate: null,
        endDate: null,
        lastPaymentAt: null,
      },
    });

    await expect(service.createMomoPayment('user-1', 'veh12345')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.paymentTransaction.create).not.toHaveBeenCalled();
  });

  it('marks a webhook as paid and renews the subscription', async () => {
    prisma.paymentTransaction.findUnique.mockResolvedValue({
      id: 'payment-1',
      status: 'pending',
      providerOrderId: 'ORDER-1',
      requestId: 'REQ-1',
      amount: 50000,
      subscriptionId: 'sub-1',
      subscription: {
        startDate: new Date('2026-04-01T00:00:00.000Z'),
        endDate: new Date('2026-05-01T00:00:00.000Z'),
      },
    });
    prisma.paymentTransaction.update.mockResolvedValue({});
    prisma.parkingSubscription.update.mockResolvedValue({});

    const result = await service.handleMomoWebhook({
      orderId: 'ORDER-1',
      resultCode: 0,
      message: 'success',
    });

    expect(result).toEqual({
      acknowledged: true,
      status: 'paid',
      transactionId: 'payment-1',
    });
    expect(prisma.paymentTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'payment-1' },
        data: expect.objectContaining({ status: 'paid' }),
      }),
    );
    expect(prisma.parkingSubscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sub-1' },
        data: expect.objectContaining({ status: 'active' }),
      }),
    );
  });

  it('marks a webhook as failed when MoMo returns a non-zero result code', async () => {
    prisma.paymentTransaction.findUnique.mockResolvedValue({
      id: 'payment-1',
      status: 'pending',
      providerOrderId: 'ORDER-1',
      requestId: 'REQ-1',
      amount: 50000,
      subscriptionId: 'sub-1',
      subscription: {
        startDate: null,
        endDate: null,
      },
    });
    prisma.paymentTransaction.update.mockResolvedValue({});

    const result = await service.handleMomoWebhook({
      requestId: 'ORDER-1',
      resultCode: 1,
      message: 'failed',
    });

    expect(result).toEqual({
      acknowledged: true,
      status: 'failed',
      transactionId: 'payment-1',
    });
    expect(prisma.paymentTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'payment-1' },
        data: expect.objectContaining({ status: 'failed' }),
      }),
    );
    expect(prisma.parkingSubscription.update).not.toHaveBeenCalled();
  });

  it('returns early for an already paid transaction', async () => {
    prisma.paymentTransaction.findUnique.mockResolvedValue({
      id: 'payment-1',
      status: 'paid',
      providerOrderId: 'ORDER-1',
      requestId: 'REQ-1',
      amount: 50000,
      subscriptionId: 'sub-1',
      subscription: {
        startDate: null,
        endDate: null,
      },
    });

    const result = await service.handleMomoWebhook({
      orderId: 'ORDER-1',
      resultCode: 0,
    });

    expect(result).toEqual({
      acknowledged: true,
      status: 'paid',
      transactionId: 'payment-1',
    });
    expect(prisma.paymentTransaction.update).not.toHaveBeenCalled();
    expect(prisma.parkingSubscription.update).not.toHaveBeenCalled();
  });

  it('records SePay webhook events before marking a transaction paid', async () => {
    prisma.paymentWebhookEvent.create.mockResolvedValue({});
    prisma.paymentTransaction.findUnique.mockResolvedValue({
      id: 'payment-1',
      status: 'pending',
      providerOrderId: 'SEPAYPARKING1730000000000veh12345',
      requestId: 'SEPAYPARKING1730000000000veh12345',
      amount: 50000,
      subscriptionId: 'sub-1',
      subscription: {
        startDate: null,
        endDate: null,
      },
    });
    prisma.paymentTransaction.update.mockResolvedValue({});
    prisma.parkingSubscription.update.mockResolvedValue({});

    const result = await service.handleSepayWebhook(
      {
        id: 92704,
        code: 'SEPAYPARKING1730000000000veh12345',
        transferType: 'in',
        transferAmount: 50000,
      },
      'Apikey sepay-secret',
    );

    expect(result).toEqual({
      success: true,
      status: 'paid',
      transactionId: 'payment-1',
    });
    expect(prisma.paymentWebhookEvent.create).toHaveBeenCalledWith({
      data: {
        provider: 'sepay',
        providerEventId: '92704',
        providerOrderId: 'SEPAYPARKING1730000000000veh12345',
        payload: {
          id: 92704,
          code: 'SEPAYPARKING1730000000000veh12345',
          transferType: 'in',
          transferAmount: 50000,
        },
      },
    });
    expect(prisma.paymentTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'payment-1' },
        data: expect.objectContaining({ status: 'paid' }),
      }),
    );
  });

  it('returns success without processing duplicate SePay webhook events', async () => {
    prisma.paymentWebhookEvent.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.1.0',
      }),
    );

    const result = await service.handleSepayWebhook(
      {
        id: 92704,
        code: 'SEPAYPARKING1730000000000veh12345',
        transferType: 'in',
        transferAmount: 50000,
      },
      'Apikey sepay-secret',
    );

    expect(result).toEqual({ success: true, duplicate: true });
    expect(prisma.paymentTransaction.findUnique).not.toHaveBeenCalled();
    expect(prisma.paymentTransaction.update).not.toHaveBeenCalled();
    expect(prisma.parkingSubscription.update).not.toHaveBeenCalled();
  });
});
