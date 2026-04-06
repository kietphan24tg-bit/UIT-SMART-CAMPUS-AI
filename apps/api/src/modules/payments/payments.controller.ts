import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
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

  @Post('payments/momo/webhook')
  @ApiOperation({ summary: 'Handle MoMo webhook callback' })
  handleMomoWebhook(@Body() payload: Record<string, unknown>) {
    return this.paymentsService.handleMomoWebhook(payload);
  }

  @Get('payments/momo/mock-success/:transactionId')
  @ApiOperation({ summary: 'Complete a mock MoMo payment for local development' })
  completeMockPayment(@Param('transactionId') transactionId: string) {
    return this.paymentsService.completeMockPayment(transactionId);
  }
}
