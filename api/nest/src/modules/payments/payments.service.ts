import { createHmac } from 'node:crypto';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CanteenOrderStatus, Prisma, Role } from '@prisma/client';
import type { PaymentCheckout } from '@smart-campus/shared';

import { PrismaService } from '../../database/prisma.service';

const MONTHLY_FEE_VND = 40000;
const MOMO_SANDBOX_ENDPOINT = 'https://test-payment.momo.vn/v2/gateway/api/create';
const SEPAY_DEFAULT_API_BASE_URL = 'https://userapi.sepay.vn/v2';
const SEPAY_DEFAULT_QR_BASE_URL = 'https://qr.sepay.vn/img';

interface MomoConfig {
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  redirectUrl: string;
  ipnUrl: string;
}

interface SepayConfig {
  apiToken: string;
  bankAccountUuid: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  webhookApiKey: string;
  apiBaseUrl: string;
  vaPrefix: string;
  qrBaseUrl: string;
}

interface SepayOrderData {
  id?: string;
  order_code?: string;
  va_number?: string;
  amount?: number;
  status?: string;
  bank_name?: string;
  account_holder_name?: string;
  account_number?: string;
  qr_code?: string;
  qr_code_url?: string;
}

function resolveMonthlyFee(value: number | null | undefined) {
  return typeof value === 'number' && value > 0 ? value : MONTHLY_FEE_VND;
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async createMomoPayment(userId: string, vehicleId: string): Promise<PaymentCheckout> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: { subscription: true },
    });

    if (!vehicle) {
      throw new NotFoundException('Không tìm thấy xe');
    }

    if (vehicle.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền thanh toán cho xe này');
    }

    const momoConfig = this.getMomoConfigOrThrow();

    const subscription =
      vehicle.subscription ??
      (await this.prisma.parkingSubscription.create({
        data: {
          vehicleId: vehicle.id,
          monthlyFee: MONTHLY_FEE_VND,
          status: 'inactive',
        },
      }));

    const amount = resolveMonthlyFee(subscription.monthlyFee);
    const now = Date.now();
    const orderId = `MOMO-${now}-${vehicle.id.slice(0, 8)}`;
    const requestId = `REQ-${now}-${vehicle.id.slice(0, 8)}`;

    const transaction = await this.prisma.paymentTransaction.create({
      data: {
        vehicleId: vehicle.id,
        subscriptionId: subscription.id,
        provider: 'momo',
        providerOrderId: orderId,
        requestId,
        amount,
        status: 'pending',
        requestPayload: {
          orderId,
          requestId,
          vehicleId: vehicle.id,
          plateNumber: vehicle.plateNumber,
        },
      },
    });

    const checkout = await this.createSandboxCheckout(
      vehicle.plateNumber,
      transaction,
      momoConfig,
    );

    await this.prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        checkoutUrl: checkout.checkoutUrl,
        requestPayload: {
          orderId,
          requestId,
          vehicleId: vehicle.id,
          plateNumber: vehicle.plateNumber,
          mode: checkout.mode,
        },
      },
    });

    return checkout;
  }

  async createSepayPayment(userId: string, vehicleId: string): Promise<PaymentCheckout> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: { subscription: true },
    });

    if (!vehicle) {
      throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y xe');
    }

    if (vehicle.userId !== userId) {
      throw new ForbiddenException('Báº¡n khÃ´ng cÃ³ quyá»n thanh toÃ¡n cho xe nÃ y');
    }

    const sepayConfig = this.getSepayConfigOrThrow();
    const subscription =
      vehicle.subscription ??
      (await this.prisma.parkingSubscription.create({
        data: {
          vehicleId: vehicle.id,
          monthlyFee: MONTHLY_FEE_VND,
          status: 'inactive',
        },
      }));

    const amount = resolveMonthlyFee(subscription.monthlyFee);
    const now = Date.now();
    const orderId = `SEPAYPARKING${now}${vehicle.id.slice(0, 8).replace(/[^a-zA-Z0-9]/g, '')}`;
    const checkoutUrl = this.buildSepayCheckoutUrl(sepayConfig, amount, orderId);

    const transaction = await this.prisma.paymentTransaction.create({
      data: {
        vehicleId: vehicle.id,
        subscriptionId: subscription.id,
        provider: 'sepay',
        providerOrderId: orderId,
        requestId: orderId,
        amount,
        status: 'pending',
        requestPayload: {
          orderId,
          vehicleId: vehicle.id,
          plateNumber: vehicle.plateNumber,
          bankName: sepayConfig.bankName,
          accountNumber: sepayConfig.accountNumber,
          transferDescription: orderId,
        },
      },
    });

    await this.prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        checkoutUrl,
        responsePayload: this.asJson({
          checkoutUrl,
          bankName: sepayConfig.bankName,
          accountNumber: sepayConfig.accountNumber,
          accountName: sepayConfig.accountName,
          transferDescription: orderId,
          generatedAt: new Date().toISOString(),
        }),
      },
    });

    return {
      transactionId: transaction.id,
      provider: 'sepay',
      mode: 'qr',
      amount,
      orderId,
      checkoutUrl,
      bankName: sepayConfig.bankName,
      accountNumber: sepayConfig.accountNumber,
      accountName: sepayConfig.accountName,
      transferDescription: orderId,
    };
  }

  async handleMomoWebhook(payload: Record<string, unknown>) {
    const orderId = String(payload.orderId || payload.requestId || '');
    if (!orderId) {
      throw new NotFoundException('Webhook không có orderId');
    }

    const transaction =
      (await this.prisma.paymentTransaction.findUnique({
        where: { providerOrderId: orderId },
      })) ??
      (await this.prisma.paymentTransaction.findFirst({
        where: { requestId: orderId },
      }));

    if (!transaction) {
      throw new NotFoundException('Không tìm thấy giao dịch');
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
      await this.markTransactionPaid(transaction.id, payload);
      return {
        acknowledged: true,
        status: 'paid',
        transactionId: transaction.id,
      };
    }

    await this.prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: 'failed',
        responsePayload: this.asJson(payload),
      },
    });

    return {
      acknowledged: true,
      status: 'failed',
      transactionId: transaction.id,
    };
  }

  async handleSepayWebhook(payload: Record<string, unknown>, authorization?: string) {
    this.assertSepayWebhookAuthorization(authorization);

    const orderCode = this.resolveSepayOrderCode(payload);
    const transferType = String(payload.transferType || '').trim().toLowerCase();
    const transferAmount = Number(payload.transferAmount ?? 0);
    const eventId = this.resolveSepayWebhookEventId(payload);

    if (!orderCode) {
      throw new BadRequestException('Webhook SePay thiáº¿u mÃ£ giao dá»‹ch');
    }
    if (!eventId) {
      throw new BadRequestException('Webhook SePay thiáº¿u mÃ£ idempotency');
    }
    if (transferType !== 'in') {
      return { success: true, ignored: true };
    }
    if (!Number.isFinite(transferAmount) || transferAmount <= 0) {
      throw new BadRequestException('Webhook SePay cÃ³ sá»‘ tiá»n khÃ´ng há»£p lá»‡');
    }

    const isNewEvent = await this.recordSepayWebhookEvent(eventId, orderCode, payload);
    if (!isNewEvent) {
      return { success: true, duplicate: true };
    }

    if (orderCode.startsWith('SEPAYPARKING')) {
      return this.handleSepayParkingWebhook(orderCode, transferAmount, payload);
    }
    if (orderCode.startsWith('SEPAYCANTEEN')) {
      return this.handleSepayCanteenWebhook(orderCode, transferAmount, payload);
    }

    throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y giao dá»‹ch SePay');
  }

  private async createSandboxCheckout(
    plateNumber: string,
    transaction: {
      id: string;
      amount: number;
      providerOrderId: string;
      requestId: string | null;
    },
    momoConfig: MomoConfig,
  ): Promise<PaymentCheckout> {
    const requestType = 'captureWallet';
    const requestId = transaction.requestId || transaction.providerOrderId;
    const extraData = '';
    const orderInfo = `Thanh toán gửi xe tháng cho ${plateNumber}`;

    const rawSignature = [
      `accessKey=${momoConfig.accessKey}`,
      `amount=${transaction.amount}`,
      `extraData=${extraData}`,
      `ipnUrl=${momoConfig.ipnUrl}`,
      `orderId=${transaction.providerOrderId}`,
      `orderInfo=${orderInfo}`,
      `partnerCode=${momoConfig.partnerCode}`,
      `redirectUrl=${momoConfig.redirectUrl}`,
      `requestId=${requestId}`,
      `requestType=${requestType}`,
    ].join('&');

    const signature = createHmac('sha256', momoConfig.secretKey).update(rawSignature).digest('hex');

    const requestPayload = {
      partnerCode: momoConfig.partnerCode,
      requestId,
      amount: String(transaction.amount),
      orderId: transaction.providerOrderId,
      orderInfo,
      redirectUrl: momoConfig.redirectUrl,
      ipnUrl: momoConfig.ipnUrl,
      lang: 'vi',
      requestType,
      autoCapture: true,
      extraData,
      signature,
    };

    const response = await fetch(MOMO_SANDBOX_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload),
    });

    const responseData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    const checkoutUrl = String(responseData.payUrl || responseData.deeplink || '');

    if (!response.ok || Number(responseData.resultCode ?? -1) !== 0 || !checkoutUrl) {
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'failed',
          responsePayload: this.asJson(responseData),
        },
      });
      throw new InternalServerErrorException(
        String(responseData.message || 'Không tạo được link thanh toán MoMo'),
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

  private async markTransactionPaid(
    transactionId: string,
    responsePayload: Record<string, unknown>,
  ) {
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: { subscription: true },
    });

    if (!transaction) {
      throw new NotFoundException('Không tìm thấy giao dịch');
    }

    if (!transaction.subscriptionId) {
      throw new NotFoundException('Giao dịch chưa được liên kết với gói gửi xe');
    }

    const now = new Date();
    const currentEndDate = transaction.subscription?.endDate;
    const renewalBase = currentEndDate && currentEndDate > now ? currentEndDate : now;
    const nextEndDate = new Date(renewalBase.getTime() + 30 * 24 * 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'paid',
          paidAt: now,
          responsePayload: this.asJson(responsePayload),
        },
      }),
      this.prisma.parkingSubscription.update({
        where: { id: transaction.subscriptionId },
        data: {
          status: 'active',
          monthlyFee: transaction.amount,
          startDate:
            transaction.subscription?.endDate &&
            transaction.subscription.endDate > now &&
            transaction.subscription.startDate
              ? transaction.subscription.startDate
              : now,
          endDate: nextEndDate,
          lastPaymentAt: now,
        },
      }),
    ]);
  }

  private async handleSepayParkingWebhook(
    orderCode: string,
    transferAmount: number,
    payload: Record<string, unknown>,
  ) {
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { providerOrderId: orderCode },
    });

    if (!transaction) {
      throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y giao dá»‹ch SePay parking');
    }

    if (transaction.status === 'paid') {
      return { success: true, status: transaction.status, transactionId: transaction.id };
    }

    if (transferAmount < transaction.amount) {
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'failed',
          responsePayload: this.asJson(payload),
        },
      });
      return { success: true, status: 'failed', transactionId: transaction.id };
    }

    await this.markTransactionPaid(transaction.id, payload);
    return { success: true, status: 'paid', transactionId: transaction.id };
  }

  private async handleSepayCanteenWebhook(
    orderCode: string,
    transferAmount: number,
    payload: Record<string, unknown>,
  ) {
    const transaction = await this.prisma.canteenPaymentTransaction.findUnique({
      where: { providerOrderId: orderCode },
    });

    if (!transaction) {
      throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y giao dá»‹ch SePay canteen');
    }

    if (transaction.status === 'paid') {
      return { success: true, status: transaction.status, transactionId: transaction.id };
    }

    if (transferAmount < transaction.amount) {
      await this.prisma.$transaction([
        this.prisma.canteenPaymentTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'failed',
            responsePayload: this.asJson(payload),
          },
        }),
        this.prisma.canteenOrder.update({
          where: { id: transaction.orderId },
          data: { status: CanteenOrderStatus.payment_failed },
        }),
      ]);
      return { success: true, status: 'failed', transactionId: transaction.id };
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const paidTx = await tx.canteenPaymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'paid',
          paidAt: new Date(),
          responsePayload: this.asJson(payload),
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

    await this.notifyCanteenOrder(
      [updated.paidOrder.createdBy.id, ...(await this.getCanteenAdminUserIds())],
      'canteen',
      'ÄÆ¡n canteen Ä‘Ã£ thanh toÃ¡n',
      'Thanh toÃ¡n Ä‘Æ¡n hÃ ng canteen thÃ nh cÃ´ng.',
      { orderId: updated.paidOrder.id, status: CanteenOrderStatus.paid },
    );

    return { success: true, status: 'paid', transactionId: updated.paidTx.id };
  }

  private getMomoConfigOrThrow(): MomoConfig {
    const partnerCode = this.configService.get<string>('MOMO_PARTNER_CODE')?.trim();
    const accessKey = this.configService.get<string>('MOMO_ACCESS_KEY')?.trim();
    const secretKey = this.configService.get<string>('MOMO_SECRET_KEY')?.trim();
    const redirectUrl = this.configService.get<string>('MOMO_REDIRECT_URL')?.trim();
    const ipnUrl = this.configService.get<string>('MOMO_IPN_URL')?.trim();

    if (!partnerCode || !accessKey || !secretKey || !redirectUrl || !ipnUrl) {
      throw new InternalServerErrorException(
        'Cấu hình MoMo chưa đầy đủ. Hãy kiểm tra các biến MOMO_* trên backend.',
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
    const apiToken = this.configService.get<string>('SEPAY_API_TOKEN')?.trim();
    const bankAccountUuid = this.configService.get<string>('SEPAY_BANK_ACCOUNT_UUID')?.trim();
    const bankName = this.configService.get<string>('SEPAY_BANK_NAME')?.trim();
    const accountNumber = this.configService.get<string>('SEPAY_ACCOUNT_NUMBER')?.trim();
    const accountName = this.configService.get<string>('SEPAY_ACCOUNT_NAME')?.trim() || '';
    const webhookApiKey =
      this.configService.get<string>('SEPAY_WEBHOOK_API_KEY')?.trim() || apiToken || '';
    const apiBaseUrl =
      this.configService.get<string>('SEPAY_API_BASE_URL')?.trim() || SEPAY_DEFAULT_API_BASE_URL;
    const vaPrefix = this.configService.get<string>('SEPAY_VA_PREFIX')?.trim() || '';
    const qrBaseUrl =
      this.configService.get<string>('SEPAY_QR_BASE_URL')?.trim() || SEPAY_DEFAULT_QR_BASE_URL;

    if (!bankName || !accountNumber || !webhookApiKey) {
      throw new InternalServerErrorException(
        'Cấu hình SePay chưa đầy đủ. Hãy kiểm tra SEPAY_BANK_NAME, SEPAY_ACCOUNT_NUMBER và SEPAY_WEBHOOK_API_KEY trên backend.',
      );
    }

    return {
      apiToken: apiToken || '',
      bankAccountUuid: bankAccountUuid || '',
      bankName,
      accountNumber,
      accountName,
      webhookApiKey,
      apiBaseUrl,
      vaPrefix,
      qrBaseUrl,
    };
  }

  private buildSepayCheckoutUrl(
    config: SepayConfig,
    amount: number,
    transferDescription: string,
  ) {
    const params = new URLSearchParams({
      acc: config.accountNumber,
      bank: config.bankName,
      amount: String(amount),
      des: transferDescription,
    });

    return `${config.qrBaseUrl.replace(/\/$/, '')}?${params.toString()}`;
  }

  private async createSepayOrder(
    config: SepayConfig,
    orderCode: string,
    amount: number,
    transactionId: string,
    markFailed: (responseData: Record<string, unknown>) => Promise<unknown>,
  ) {
    const requestPayload: Record<string, unknown> = {
      order_code: orderCode,
      amount,
      with_qrcode: '1',
      qrcode_template: 'compact',
    };
    if (config.vaPrefix) {
      requestPayload.va_prefix = config.vaPrefix;
    }

    const response = await fetch(
      `${config.apiBaseUrl.replace(/\/$/, '')}/bank-accounts/${config.bankAccountUuid}/orders`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      },
    );
    const responseData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    const data = (responseData.data ?? {}) as SepayOrderData;
    const checkoutUrl = String(data.qr_code_url || data.qr_code || '');

    if (!response.ok || responseData.status !== 'success' || !checkoutUrl) {
      await markFailed(responseData);
      throw new InternalServerErrorException(
        String(responseData.message || 'KhÃ´ng táº¡o Ä‘Æ°á»£c QR SePay'),
      );
    }

    return {
      checkoutUrl,
      data,
      responseData: {
        ...responseData,
        localTransactionId: transactionId,
      },
    };
  }

  private assertSepayWebhookAuthorization(authorization?: string) {
    const expectedKey = this.getSepayConfigOrThrow().webhookApiKey;
    const expectedAuthorization = `Apikey ${expectedKey}`;
    if (!authorization || authorization.trim() !== expectedAuthorization) {
      throw new UnauthorizedException('Webhook SePay khÃ´ng há»£p lá»‡');
    }
  }

  private resolveSepayWebhookEventId(payload: Record<string, unknown>) {
    return String(payload.id || payload.referenceCode || '').trim();
  }

  private resolveSepayOrderCode(payload: Record<string, unknown>) {
    const directCode = String(payload.code || '').trim();
    if (directCode) {
      return directCode;
    }

    const textCandidates = [payload.content, payload.description]
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter(Boolean);

    for (const candidate of textCandidates) {
      const match = candidate.match(/SEPAY(?:PARKING|CANTEEN)[A-Za-z0-9]+/i);
      if (match?.[0]) {
        return match[0];
      }
    }

    return '';
  }

  private async recordSepayWebhookEvent(
    eventId: string,
    orderCode: string,
    payload: Record<string, unknown>,
  ) {
    try {
      await this.prisma.paymentWebhookEvent.create({
        data: {
          provider: 'sepay',
          providerEventId: eventId,
          providerOrderId: orderCode,
          payload: this.asJson(payload),
        },
      });
      return true;
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        return false;
      }
      throw error;
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

  private async notifyCanteenOrder(
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
        data: data ? this.asJson(data) : undefined,
      })),
    });
  }

  private asJson(value: Record<string, unknown>): Prisma.InputJsonValue {
    return value as Prisma.InputJsonValue;
  }

  private isUniqueConstraintError(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }
}
