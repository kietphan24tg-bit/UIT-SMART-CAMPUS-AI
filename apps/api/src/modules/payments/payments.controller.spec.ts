import { Test } from '@nestjs/testing';

import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let paymentsService: {
    createMomoPayment: jest.Mock;
    createSepayPayment: jest.Mock;
    handleMomoWebhook: jest.Mock;
    handleSepayWebhook: jest.Mock;
  };

  beforeEach(async () => {
    paymentsService = {
      createMomoPayment: jest.fn(),
      createSepayPayment: jest.fn(),
      handleMomoWebhook: jest.fn(),
      handleSepayWebhook: jest.fn(),
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

  it('delegates SePay payment creation to the service', async () => {
    paymentsService.createSepayPayment.mockResolvedValue({
      transactionId: 'payment-1',
      provider: 'sepay',
      mode: 'qr',
      amount: 40000,
      orderId: 'SEPAY-PARKING-1',
      checkoutUrl: 'https://qr.sepay.vn/img?acc=123&bank=MBBank&amount=40000&des=SEPAY-PARKING-1',
    });

    const result = await controller.createSepayPayment('user-1', 'vehicle-1');

    expect(result).toEqual({
      transactionId: 'payment-1',
      provider: 'sepay',
      mode: 'qr',
      amount: 40000,
      orderId: 'SEPAY-PARKING-1',
      checkoutUrl: 'https://qr.sepay.vn/img?acc=123&bank=MBBank&amount=40000&des=SEPAY-PARKING-1',
    });
    expect(paymentsService.createSepayPayment).toHaveBeenCalledWith('user-1', 'vehicle-1');
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

  it('delegates SePay webhook callbacks to the service', async () => {
    paymentsService.handleSepayWebhook.mockResolvedValue({
      success: true,
      status: 'paid',
      transactionId: 'payment-1',
    });

    const result = await controller.handleSepayWebhook(
      {
        code: 'SEPAY-PARKING-1',
        transferType: 'in',
        transferAmount: 40000,
      },
      'Apikey secret',
    );

    expect(result).toEqual({
      success: true,
      status: 'paid',
      transactionId: 'payment-1',
    });
    expect(paymentsService.handleSepayWebhook).toHaveBeenCalledWith(
      {
        code: 'SEPAY-PARKING-1',
        transferType: 'in',
        transferAmount: 40000,
      },
      'Apikey secret',
    );
  });

  it('returns a redirect landing message for MoMo returns', () => {
    expect(controller.handleMomoReturn('0', 'ORDER-1')).toContain('đã được ghi nhận');
    expect(controller.handleMomoReturn('1', 'ORDER-2')).toContain('đang chờ đồng bộ kết quả');
  });
});
