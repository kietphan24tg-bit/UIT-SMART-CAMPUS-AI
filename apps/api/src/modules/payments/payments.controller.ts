import { Body, Controller, Get, Header, Headers, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('parking/subscriptions/:vehicleId/payments/momo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a MoMo payment for parking subscription' })
  createMomoPayment(
    @CurrentUser('id') userId: string,
    @Param('vehicleId') vehicleId: string,
  ) {
    return this.paymentsService.createMomoPayment(userId, vehicleId);
  }

  @Post('parking/subscriptions/:vehicleId/payments/sepay')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a SePay QR payment for parking subscription' })
  createSepayPayment(
    @CurrentUser('id') userId: string,
    @Param('vehicleId') vehicleId: string,
  ) {
    return this.paymentsService.createSepayPayment(userId, vehicleId);
  }

  @Post('payments/momo/webhook')
  @ApiOperation({ summary: 'Handle MoMo webhook callback' })
  handleMomoWebhook(@Body() payload: Record<string, unknown>) {
    return this.paymentsService.handleMomoWebhook(payload);
  }

  @Post('payments/sepay/webhook')
  @ApiOperation({ summary: 'Handle SePay webhook callback' })
  handleSepayWebhook(
    @Body() payload: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    return this.paymentsService.handleSepayWebhook(payload, authorization);
  }

  @Get('payments/momo/return')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  @ApiOperation({ summary: 'Handle MoMo redirect return' })
  handleMomoReturn(
    @Query('resultCode') resultCode?: string,
    @Query('orderId') orderId?: string,
  ) {
    const isSuccess = String(resultCode ?? '').trim() === '0';
    const safeOrderId = orderId?.trim() || 'không xác định';

    return isSuccess
      ? `Thanh toán MoMo cho đơn ${safeOrderId} đã được ghi nhận. Bạn có thể quay lại ứng dụng.`
      : `MoMo đã chuyển hướng về hệ thống. Giao dịch ${safeOrderId} đang chờ đồng bộ kết quả.`;
  }
}
