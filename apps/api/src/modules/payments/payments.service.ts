import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import { createHmac } from 'node:crypto';
import type { PaymentCheckout } from '@smart-campus/shared';

import { PrismaService } from '../../database/prisma.service';

const MONTHLY_FEE_VND = 40000;
const MOMO_SANDBOX_ENDPOINT = 'https://test-payment.momo.vn/v2/gateway/api/create';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async createMomoPayment(
    userId: string,
    vehicleId: string,
  ): Promise<PaymentCheckout> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: { subscription: true },
    });

    if (!vehicle) {
      throw new NotFoundException('Khong tim thay xe');
    }

    if (vehicle.userId !== userId) {
      throw new ForbiddenException('Ban khong co quyen thanh toan cho xe nay');
    }

    const subscription =
      vehicle.subscription ??
      (await this.prisma.parkingSubscription.create({
        data: {
          vehicleId: vehicle.id,
          monthlyFee: MONTHLY_FEE_VND,
          status: 'inactive',
        },
      }));

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
        amount: subscription.monthlyFee || MONTHLY_FEE_VND,
        status: 'pending',
        requestPayload: {
          orderId,
          requestId,
          vehicleId: vehicle.id,
          plateNumber: vehicle.plateNumber,
        },
      },
    });

    const checkout = this.hasMomoCredentials()
      ? await this.createSandboxCheckout(vehicle.plateNumber, transaction)
      : this.createMockCheckout(
          transaction.id,
          transaction.providerOrderId,
          transaction.amount,
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
      throw new NotFoundException('Webhook khong co orderId');
    }

    const transaction =
      (await this.prisma.paymentTransaction.findUnique({
        where: { providerOrderId: orderId },
      })) ??
      (await this.prisma.paymentTransaction.findFirst({
        where: { requestId: orderId },
      }));

    if (!transaction) {
      throw new NotFoundException('Khong tim thay giao dich');
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

  async completeMockPayment(transactionId: string) {
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Khong tim thay giao dich mock');
    }

    await this.markTransactionPaid(transactionId, {
      orderId: transaction.providerOrderId,
      requestId: transaction.requestId,
      resultCode: 0,
      message: 'Mock payment success',
    });

    return {
      success: true,
      transactionId,
      redirectUrl: '/parking',
    };
  }

  private createMockCheckout(
    transactionId: string,
    orderId: string,
    amount: number,
  ): PaymentCheckout {
    const appBaseUrl =
      this.configService.get<string>('APP_BASE_URL') || 'http://localhost:3000';

    return {
      transactionId,
      provider: 'momo',
      mode: 'mock',
      amount,
      orderId,
      checkoutUrl: `${appBaseUrl}/api/v1/payments/momo/mock-success/${transactionId}`,
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
  ): Promise<PaymentCheckout> {
    const partnerCode = this.configService.get<string>('MOMO_PARTNER_CODE') || '';
    const accessKey = this.configService.get<string>('MOMO_ACCESS_KEY') || '';
    const secretKey = this.configService.get<string>('MOMO_SECRET_KEY') || '';
    const redirectUrl =
      this.configService.get<string>('MOMO_REDIRECT_URL') || '';
    const ipnUrl = this.configService.get<string>('MOMO_IPN_URL') || '';
    const requestType = 'captureWallet';
    const requestId = transaction.requestId || transaction.providerOrderId;
    const extraData = '';
    const orderInfo = `Thanh toan gui xe thang cho ${plateNumber}`;

    const rawSignature = [
      `accessKey=${accessKey}`,
      `amount=${transaction.amount}`,
      `extraData=${extraData}`,
      `ipnUrl=${ipnUrl}`,
      `orderId=${transaction.providerOrderId}`,
      `orderInfo=${orderInfo}`,
      `partnerCode=${partnerCode}`,
      `redirectUrl=${redirectUrl}`,
      `requestId=${requestId}`,
      `requestType=${requestType}`,
    ].join('&');

    const signature = createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestPayload = {
      partnerCode,
      requestId,
      amount: String(transaction.amount),
      orderId: transaction.providerOrderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
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

    const responseData = (await response.json()) as Record<string, unknown>;
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
        String(responseData.message || 'Khong tao duoc link thanh toan MoMo'),
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
      throw new NotFoundException('Khong tim thay giao dich');
    }

    if (!transaction.subscriptionId) {
      throw new NotFoundException('Giao dich chua duoc lien ket voi goi gui xe');
    }

    const now = new Date();
    const currentEndDate = transaction.subscription?.endDate;
    const renewalBase =
      currentEndDate && currentEndDate > now ? currentEndDate : now;
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

  private hasMomoCredentials() {
    return Boolean(
      this.configService.get<string>('MOMO_PARTNER_CODE') &&
        this.configService.get<string>('MOMO_ACCESS_KEY') &&
        this.configService.get<string>('MOMO_SECRET_KEY') &&
        this.configService.get<string>('MOMO_REDIRECT_URL') &&
        this.configService.get<string>('MOMO_IPN_URL'),
    );
  }

  private asJson(value: Record<string, unknown>): Prisma.InputJsonValue {
    return value as Prisma.InputJsonValue;
  }
}
