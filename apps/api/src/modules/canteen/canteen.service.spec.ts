import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CanteenOrderStatus } from '@prisma/client';

import { CanteenService } from './canteen.service';

describe('CanteenService', () => {
  const prisma: any = {
    canteenOrder: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const configService = {
    get: jest.fn(),
  };

  let service: CanteenService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CanteenService(prisma, configService as never);
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
