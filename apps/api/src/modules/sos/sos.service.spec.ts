import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Role, SosRequestStatus } from '@prisma/client';

import { SosService } from './sos.service';

describe('SosService', () => {
  const prisma: any = {
    sosRequest: {
      updateMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    notification: {
      createMany: jest.fn(),
    },
  };

  const configService = {
    get: jest.fn(),
  };
  const realtimeGateway = {
    publish: jest.fn(),
  };

  let service: SosService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SosService(
      prisma,
      configService as never,
      realtimeGateway as never,
    );
  });

  it('rejects creating a new SOS when user already has one active request', async () => {
    prisma.sosRequest.findMany.mockResolvedValue([]);
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

  it('uses fallback TrackAsia map key for directions when server key is missing', async () => {
    prisma.sosRequest.findUnique.mockResolvedValue({
      id: 'sos-1',
      latitude: 10.8,
      longitude: 106.8,
      status: SosRequestStatus.active,
    });
    configService.get.mockImplementation((key: string) => {
      if (key === 'TRACK_ASIA_SERVER_KEY') {
        return '';
      }
      if (key === 'EXPO_PUBLIC_TRACK_ASIA_MAP_KEY') {
        return 'public-demo-key';
      }
      return undefined;
    });
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        routes: [
          {
            overview_polyline: { points: 'encoded' },
          },
        ],
      }),
    });

    const originalFetch = global.fetch;
    global.fetch = fetchMock as never;

    await expect(service.getRoute('sos-1', 10.9, 106.9)).resolves.toEqual({
      sosId: 'sos-1',
      route: {
        routes: [
          {
            overview_polyline: { points: 'encoded' },
          },
        ],
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('key=public-demo-key'),
    );

    global.fetch = originalFetch;
  });

  it('publishes realtime event when SOS is cancelled', async () => {
    prisma.sosRequest.findUnique.mockResolvedValue({
      id: 'sos-1',
      requesterId: 'student-1',
      status: SosRequestStatus.active,
    });
    prisma.sosRequest.update.mockResolvedValue({
      id: 'sos-1',
      requesterId: 'student-1',
      resolverId: null,
      status: SosRequestStatus.cancelled,
      latitude: 10.8,
      longitude: 106.8,
      accuracyMeters: null,
      addressSnapshot: null,
      contactSnapshot: null,
      note: null,
      createdAt: new Date('2026-05-08T00:00:00.000Z'),
      updatedAt: new Date('2026-05-08T00:01:00.000Z'),
      resolvedAt: new Date('2026-05-08T00:01:00.000Z'),
      expiresAt: new Date('2026-05-08T06:00:00.000Z'),
    });

    await service.cancelRequest('student-1', 'sos-1');

    expect(realtimeGateway.publish).toHaveBeenCalledWith(
      'sos:cancelled',
      expect.objectContaining({
        sosId: 'sos-1',
        request: expect.objectContaining({
          id: 'sos-1',
          status: 'cancelled',
        }),
      }),
    );
  });

  it('publishes realtime event when SOS is resolved', async () => {
    prisma.sosRequest.findUnique.mockResolvedValue({
      id: 'sos-1',
      requesterId: 'student-2',
      status: SosRequestStatus.active,
    });
    prisma.sosRequest.update.mockResolvedValue({
      id: 'sos-1',
      requesterId: 'student-2',
      resolverId: 'admin-1',
      status: SosRequestStatus.resolved,
      latitude: 10.8,
      longitude: 106.8,
      accuracyMeters: null,
      addressSnapshot: null,
      contactSnapshot: null,
      note: null,
      createdAt: new Date('2026-05-08T00:00:00.000Z'),
      updatedAt: new Date('2026-05-08T00:01:00.000Z'),
      resolvedAt: new Date('2026-05-08T00:01:00.000Z'),
      expiresAt: new Date('2026-05-08T06:00:00.000Z'),
    });

    await service.resolveRequest('admin-1', Role.admin, 'sos-1');

    expect(realtimeGateway.publish).toHaveBeenCalledWith(
      'sos:resolved',
      expect.objectContaining({
        sosId: 'sos-1',
        request: expect.objectContaining({
          id: 'sos-1',
          status: 'resolved',
        }),
      }),
    );
  });

  it('publishes realtime events when stale SOS requests expire', async () => {
    prisma.sosRequest.findMany
      .mockResolvedValueOnce([
        {
          id: 'sos-expired',
          requesterId: 'student-1',
          resolverId: null,
          status: SosRequestStatus.active,
          latitude: 10.8,
          longitude: 106.8,
          accuracyMeters: null,
          addressSnapshot: null,
          contactSnapshot: null,
          note: null,
          createdAt: new Date('2026-05-08T00:00:00.000Z'),
          updatedAt: new Date('2026-05-08T00:00:00.000Z'),
          resolvedAt: null,
          expiresAt: new Date('2026-05-07T00:00:00.000Z'),
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'sos-expired',
          requesterId: 'student-1',
          resolverId: null,
          status: SosRequestStatus.expired,
          latitude: 10.8,
          longitude: 106.8,
          accuracyMeters: null,
          addressSnapshot: null,
          contactSnapshot: null,
          note: null,
          createdAt: new Date('2026-05-08T00:00:00.000Z'),
          updatedAt: new Date('2026-05-08T00:01:00.000Z'),
          resolvedAt: null,
          expiresAt: new Date('2026-05-07T00:00:00.000Z'),
        },
      ]);
    prisma.sosRequest.findFirst.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue({
      id: 'student-1',
      firstName: 'A',
      lastName: 'B',
      email: 'a@example.com',
      phone: null,
    });
    prisma.user.findMany.mockResolvedValue([]);
    prisma.sosRequest.create.mockResolvedValue({
      id: 'sos-new',
      requesterId: 'student-1',
      resolverId: null,
      status: SosRequestStatus.active,
      latitude: 10.8,
      longitude: 106.8,
      accuracyMeters: null,
      addressSnapshot: null,
      contactSnapshot: null,
      note: null,
      createdAt: new Date('2026-05-08T00:02:00.000Z'),
      updatedAt: new Date('2026-05-08T00:02:00.000Z'),
      resolvedAt: null,
      expiresAt: new Date('2026-05-08T06:00:00.000Z'),
    });
    jest
      .spyOn(service as never, 'reverseGeocode')
      .mockResolvedValue(null as never);

    await service.createRequest('student-1', {
      lat: 10.8,
      lng: 106.8,
    });

    expect(realtimeGateway.publish).toHaveBeenCalledWith(
      'sos:expired',
      expect.objectContaining({
        sosId: 'sos-expired',
        request: expect.objectContaining({
          id: 'sos-expired',
          status: 'expired',
        }),
      }),
    );
  });
});
