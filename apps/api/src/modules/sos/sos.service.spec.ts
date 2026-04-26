import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Role, SosRequestStatus } from '@prisma/client';

import { SosService } from './sos.service';

describe('SosService', () => {
  const prisma: any = {
    sosRequest: {
      updateMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const configService = {
    get: jest.fn(),
  };

  let service: SosService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SosService(prisma, configService as never);
  });

  it('rejects creating a new SOS when user already has one active request', async () => {
    prisma.sosRequest.findFirst.mockResolvedValue({
      id: 'sos-1',
    });

    await expect(
      service.createRequest('student-1', {
        lat: 10.8,
        lng: 106.8,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('forbids resolving SOS from unrelated user role', async () => {
    prisma.sosRequest.findUnique.mockResolvedValue({
      id: 'sos-1',
      requesterId: 'student-2',
      status: SosRequestStatus.active,
    });

    await expect(
      service.resolveRequest('student-1', Role.lecturer, 'sos-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects route request when TrackAsia key is missing', async () => {
    prisma.sosRequest.findUnique.mockResolvedValue({
      id: 'sos-1',
      latitude: 10.8,
      longitude: 106.8,
      status: SosRequestStatus.active,
    });
    configService.get.mockReturnValue(undefined);

    await expect(service.getRoute('sos-1', 10.9, 106.9)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
