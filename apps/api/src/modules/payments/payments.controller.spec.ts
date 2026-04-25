import { Test } from '@nestjs/testing';

import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let paymentsService: {
    createMomoPayment: jest.Mock;
    handleMomoWebhook: jest.Mock;
  };

  beforeEach(async () => {
    paymentsService = {
      createMomoPayment: jest.fn(),
      handleMomoWebhook: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: paymentsService,
        },
      ],
    }).compile();

    controller = moduleRef.get(PaymentsController);
  });

  it('delegates MoMo payment creation to the service', async () => {
    paymentsService.createMomoPayment.mockResolvedValue({
      transactionId: 'payment-1',
      provider: 'momo',
      mode: 'sandbox',
      amount: 40000,
      orderId: 'ORDER-1',
      checkoutUrl: 'https://momo.test/checkout',
    });

    const result = await controller.createMomoPayment('user-1', 'vehicle-1');

    expect(result).toEqual({
      transactionId: 'payment-1',
      provider: 'momo',
      mode: 'sandbox',
      amount: 40000,
      orderId: 'ORDER-1',
      checkoutUrl: 'https://momo.test/checkout',
    });
    expect(paymentsService.createMomoPayment).toHaveBeenCalledWith('user-1', 'vehicle-1');
  });

  it('delegates MoMo webhook callbacks to the service', async () => {
    paymentsService.handleMomoWebhook.mockResolvedValue({
      acknowledged: true,
      status: 'paid',
      transactionId: 'payment-1',
    });

    const result = await controller.handleMomoWebhook({
      orderId: 'ORDER-1',
      resultCode: 0,
    });

    expect(result).toEqual({
      acknowledged: true,
      status: 'paid',
      transactionId: 'payment-1',
    });
    expect(paymentsService.handleMomoWebhook).toHaveBeenCalledWith({
      orderId: 'ORDER-1',
      resultCode: 0,
    });
  });

  it('returns a redirect landing message for MoMo returns', () => {
    expect(controller.handleMomoReturn('0', 'ORDER-1')).toContain('đã được ghi nhận');
    expect(controller.handleMomoReturn('1', 'ORDER-2')).toContain('đang chờ đồng bộ kết quả');
  });
});
