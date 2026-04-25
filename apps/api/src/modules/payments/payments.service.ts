import { createHmac } from 'node:crypto';

import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import type { PaymentCheckout } from '@smart-campus/shared';

import { PrismaService } from '../../database/prisma.service';

const MONTHLY_FEE_VND = 40000;
const MOMO_SANDBOX_ENDPOINT = 'https://test-payment.momo.vn/v2/gateway/api/create';

interface MomoConfig {
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  redirectUrl: string;
  ipnUrl: string;
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

  private asJson(value: Record<string, unknown>): Prisma.InputJsonValue {
    return value as Prisma.InputJsonValue;
  }
}
