import axios from 'axios';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../database/prisma.service';

import { ExpoPushService } from './expo-push.service';

jest.mock('axios');

describe('ExpoPushService', () => {
  let service: ExpoPushService;
  let prisma: jest.Mocked<PrismaService>;
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ExpoPushService,
        {
          provide: PrismaService,
          useValue: {
            userDevicePushToken: {
              findMany: jest.fn(),
              updateMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get(ExpoPushService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should not send a request when no active tokens exist', async () => {
    (prisma.userDevicePushToken.findMany as jest.Mock).mockResolvedValue([]);

    const result = await service.sendToUsers({
      userIds: ['user-1'],
      title: 'Title',
      body: 'Body',
      type: 'general',
    });

    expect(result).toEqual({
      targetTokens: 0,
      sent: 0,
      failed: 0,
      deactivatedTokens: 0,
    });
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('should chunk Expo push requests by 100 messages', async () => {
    const tokens = Array.from({ length: 101 }, (_, index) => ({
      expoPushToken: `ExponentPushToken[token-${index}]`,
    }));
    (prisma.userDevicePushToken.findMany as jest.Mock).mockResolvedValue(tokens);
    mockedAxios.post.mockResolvedValue({
      data: {
        data: Array.from({ length: 100 }, () => ({ status: 'ok' })),
      },
    });

    const result = await service.sendToUsers({
      userIds: ['user-1'],
      title: 'Title',
      body: 'Body',
      type: 'system',
      data: { route: '/alerts' },
    });

    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    expect(mockedAxios.post.mock.calls[0]?.[1]).toHaveLength(100);
    expect(mockedAxios.post.mock.calls[1]?.[1]).toHaveLength(1);
    expect(result).toEqual({
      targetTokens: 101,
      sent: 101,
      failed: 0,
      deactivatedTokens: 0,
    });
  });

  it('should map Expo tickets and deactivate unregistered devices', async () => {
    (prisma.userDevicePushToken.findMany as jest.Mock).mockResolvedValue([
      { expoPushToken: 'ExponentPushToken[ok]' },
      { expoPushToken: 'ExponentPushToken[expired]' },
      { expoPushToken: 'ExponentPushToken[other-error]' },
    ]);
    (prisma.userDevicePushToken.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    mockedAxios.post.mockResolvedValue({
      data: {
        data: [
          { status: 'ok', id: 'ticket-1' },
          {
            status: 'error',
            message: 'Device not registered',
            details: { error: 'DeviceNotRegistered' },
          },
          {
            status: 'error',
            message: 'Message too big',
            details: { error: 'MessageTooBig' },
          },
        ],
      },
    });

    const result = await service.sendToUsers({
      userIds: ['user-1'],
      title: 'Title',
      body: 'Body',
      type: 'general',
    });

    expect(result).toEqual({
      targetTokens: 3,
      sent: 1,
      failed: 2,
      deactivatedTokens: 1,
    });
    expect(prisma.userDevicePushToken.updateMany).toHaveBeenCalledWith({
      where: { expoPushToken: { in: ['ExponentPushToken[expired]'] } },
      data: { isActive: false },
    });
  });

  it('should send notification records with notification id in push data', async () => {
    (prisma.userDevicePushToken.findMany as jest.Mock).mockResolvedValue([
      { userId: 'user-1', expoPushToken: 'ExponentPushToken[token]' },
    ]);
    mockedAxios.post.mockResolvedValue({
      data: {
        data: [{ status: 'ok', id: 'ticket-1' }],
      },
    });

    const result = await service.sendNotifications([
      {
        id: 'notif-1',
        userId: 'user-1',
        title: 'Class update',
        body: 'Bring your laptop',
        type: 'academic',
        data: { route: '/alerts' },
      },
    ]);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      [
        expect.objectContaining({
          to: 'ExponentPushToken[token]',
          title: 'Class update',
          body: 'Bring your laptop',
          data: {
            route: '/alerts',
            notificationId: 'notif-1',
            kind: 'notification',
            type: 'academic',
          },
        }),
      ],
      expect.any(Object),
    );
    expect(result.sent).toBe(1);
  });

  it('should report all chunk messages as failed when Expo request fails', async () => {
    (prisma.userDevicePushToken.findMany as jest.Mock).mockResolvedValue([
      { expoPushToken: 'ExponentPushToken[token]' },
    ]);
    mockedAxios.post.mockRejectedValue(new Error('network down'));

    const result = await service.sendToUsers({
      userIds: ['user-1'],
      title: 'Title',
      body: 'Body',
      type: 'general',
    });

    expect(result).toEqual({
      targetTokens: 1,
      sent: 0,
      failed: 1,
      deactivatedTokens: 0,
    });
  });
});
