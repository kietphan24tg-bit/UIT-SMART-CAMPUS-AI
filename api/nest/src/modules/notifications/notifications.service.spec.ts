import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import { ExpoPushService } from './expo-push.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: jest.Mocked<PrismaService>;
  let expoPushService: jest.Mocked<ExpoPushService>;

  const mockNotification = {
    id: 'notif-1',
    userId: 'user-1',
    title: 'Doi phong hoc',
    body: 'Mon SE346 doi sang phong B201',
    type: 'schedule',
    isRead: false,
    data: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: {
            notification: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              delete: jest.fn(),
              createMany: jest.fn(),
              create: jest.fn(),
              deleteMany: jest.fn(),
            },
            user: {
              findMany: jest.fn(),
            },
            classSection: {
              findUnique: jest.fn(),
            },
            classEnrollment: {
              findMany: jest.fn(),
            },
            userDevicePushToken: {
              upsert: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
        {
          provide: ExpoPushService,
          useValue: {
            sendToUsers: jest.fn(),
            sendNotifications: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(NotificationsService);
    prisma = module.get(PrismaService);
    expoPushService = module.get(ExpoPushService);
  });

  describe('getNotifications', () => {
    it('should return paginated notifications', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([mockNotification]);
      (prisma.notification.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getNotifications('user-1', 1, 20);

      expect(result.items).toHaveLength(1);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should calculate correct pagination offset', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.notification.count as jest.Mock).mockResolvedValue(50);

      await service.getNotifications('user-1', 3, 10);

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it('should calculate totalPages correctly', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.notification.count as jest.Mock).mockResolvedValue(25);

      const result = await service.getNotifications('user-1', 1, 10);

      expect(result.meta.totalPages).toBe(3);
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      (prisma.notification.count as jest.Mock).mockResolvedValue(5);

      const count = await service.getUnreadCount('user-1');

      expect(count).toBe(5);
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
      });
    });
  });

  describe('getNotification', () => {
    it('should return a notification owned by the current user', async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue(mockNotification);

      const result = await service.getNotification('notif-1', 'user-1');

      expect(result).toEqual(mockNotification);
      expect(prisma.notification.findFirst).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: 'user-1' },
      });
    });

    it('should throw NotFoundException for another user notification', async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getNotification('notif-1', 'user-2')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue(mockNotification);
      (prisma.notification.update as jest.Mock).mockResolvedValue({
        ...mockNotification,
        isRead: true,
      });

      const result = await service.markAsRead('notif-1', 'user-1');

      expect(result.isRead).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { isRead: true },
      });
    });

    it('should throw NotFoundException when notification not found', async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.markAsRead('nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await service.markAllAsRead('user-1');

      expect(result.count).toBe(3);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
        data: { isRead: true },
      });
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification owned by the current user', async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue({ id: 'notif-1' });
      (prisma.notification.delete as jest.Mock).mockResolvedValue({ id: 'notif-1' });

      const result = await service.deleteNotification('notif-1', 'user-1');

      expect(prisma.notification.delete).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
      });
      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException when deleting another user notification', async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteNotification('notif-1', 'user-2')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.notification.delete).not.toHaveBeenCalled();
    });
  });

  describe('deleteNotifications', () => {
    it('should delete all notifications when no filter is provided', async () => {
      (prisma.notification.deleteMany as jest.Mock).mockResolvedValue({ count: 4 });

      const result = await service.deleteNotifications('user-1', {});

      expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(result).toEqual({ count: 4 });
    });

    it('should delete only notifications matching a category filter', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([
        { id: 'notif-1', type: 'academic' },
        { id: 'notif-2', type: 'general' },
        { id: 'notif-3', type: 'schedule_update' },
      ]);
      (prisma.notification.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await service.deleteNotifications('user-1', { category: 'academic' });

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: { id: true, type: true },
      });
      expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          id: { in: ['notif-1', 'notif-3'] },
        },
      });
      expect(result).toEqual({ count: 2 });
    });

    it('should respect unreadOnly when deleting by filter', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([
        { id: 'notif-1', type: 'payment' },
      ]);
      (prisma.notification.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      await service.deleteNotifications('user-1', {
        category: 'payment',
        unreadOnly: true,
      });

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
        select: { id: true, type: true },
      });
      expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          id: { in: ['notif-1'] },
        },
      });
    });
  });

  describe('push token registration', () => {
    it('should upsert the current user push token as active', async () => {
      (prisma.userDevicePushToken.upsert as jest.Mock).mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        expoPushToken: 'ExponentPushToken[token]',
        platform: 'android',
        deviceId: null,
        isActive: true,
      });

      await service.registerPushToken('user-1', {
        expoPushToken: 'ExponentPushToken[token]',
        platform: 'android',
      });

      expect(prisma.userDevicePushToken.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ isActive: true }),
          update: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('should remove the current user push token', async () => {
      (prisma.userDevicePushToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await service.removePushToken('user-1', 'ExponentPushToken[token]');

      expect(result).toEqual({ count: 1 });
      expect(prisma.userDevicePushToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', expoPushToken: 'ExponentPushToken[token]' },
      });
    });
  });

  describe('createSystemNotifications', () => {
    it('should create notifications and send push to matching users', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 'user-1' }, { id: 'user-2' }]);
      (prisma.notification.create as jest.Mock)
        .mockResolvedValueOnce({
          ...mockNotification,
          id: 'notif-1',
          userId: 'user-1',
          title: 'Campus alert',
          body: 'Main gate closes at 10 PM',
          type: 'system',
          data: { route: '/alerts' },
        })
        .mockResolvedValueOnce({
          ...mockNotification,
          id: 'notif-2',
          userId: 'user-2',
          title: 'Campus alert',
          body: 'Main gate closes at 10 PM',
          type: 'system',
          data: { route: '/alerts' },
        });
      expoPushService.sendNotifications.mockResolvedValue({
        targetTokens: 2,
        sent: 2,
        failed: 0,
        deactivatedTokens: 0,
      });

      const result = await service.createSystemNotifications(
        'Campus alert',
        'Main gate closes at 10 PM',
        'system',
        { route: '/alerts' },
        { scope: 'roles', roles: ['student'] },
        { id: 'admin-1', role: Role.admin },
      );

      expect(prisma.notification.create).toHaveBeenNthCalledWith(1, {
        data: {
          userId: 'user-1',
          title: 'Campus alert',
          body: 'Main gate closes at 10 PM',
          type: 'system',
          data: { route: '/alerts' },
        },
      });
      expect(prisma.notification.create).toHaveBeenNthCalledWith(2, {
        data: {
          userId: 'user-2',
          title: 'Campus alert',
          body: 'Main gate closes at 10 PM',
          type: 'system',
          data: { route: '/alerts' },
        },
      });
      expect(expoPushService.sendNotifications).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'notif-1',
          userId: 'user-1',
          type: 'system',
          data: { route: '/alerts' },
        }),
        expect.objectContaining({
          id: 'notif-2',
          userId: 'user-2',
          type: 'system',
          data: { route: '/alerts' },
        }),
      ]);
      expect(result).toEqual({
        count: 2,
        push: {
          targetTokens: 2,
          sent: 2,
          failed: 0,
          deactivatedTokens: 0,
        },
      });
    });

    it('should support the legacy roles audience argument', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 'user-1' }]);
      (prisma.notification.create as jest.Mock).mockResolvedValue({
        ...mockNotification,
        id: 'notif-1',
        userId: 'user-1',
      });
      expoPushService.sendNotifications.mockResolvedValue({
        targetTokens: 1,
        sent: 1,
        failed: 0,
        deactivatedTokens: 0,
      });

      await service.createSystemNotifications('Title', 'Body', 'general', undefined, ['student']);

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { isActive: true, role: { in: ['student'] } },
        select: { id: true },
      });
    });

    it('should allow admin to broadcast to all active users', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 'user-1' }]);
      (prisma.notification.create as jest.Mock).mockResolvedValue({
        ...mockNotification,
        id: 'notif-1',
        userId: 'user-1',
      });
      expoPushService.sendNotifications.mockResolvedValue({
        targetTokens: 0,
        sent: 0,
        failed: 0,
        deactivatedTokens: 0,
      });

      await service.createSystemNotifications(
        'Title',
        'Body',
        'system',
        undefined,
        { scope: 'all' },
        { id: 'admin-1', role: Role.admin },
      );

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        select: { id: true },
      });
    });

    it('should send class section notifications to the lecturer and active enrolled students', async () => {
      (prisma.classSection.findUnique as jest.Mock).mockResolvedValue({
        id: 'section-1',
        lecturerId: 'lecturer-1',
      });
      (prisma.classEnrollment.findMany as jest.Mock).mockResolvedValue([
        { studentId: 'student-1' },
        { studentId: 'student-2' },
      ]);
      (prisma.notification.create as jest.Mock)
        .mockResolvedValueOnce({
          ...mockNotification,
          id: 'notif-1',
          userId: 'lecturer-1',
          title: 'Class update',
          body: 'Bring your laptop tomorrow',
          type: 'academic',
          data: null,
        })
        .mockResolvedValueOnce({
          ...mockNotification,
          id: 'notif-2',
          userId: 'student-1',
          title: 'Class update',
          body: 'Bring your laptop tomorrow',
          type: 'academic',
          data: null,
        })
        .mockResolvedValueOnce({
          ...mockNotification,
          id: 'notif-3',
          userId: 'student-2',
          title: 'Class update',
          body: 'Bring your laptop tomorrow',
          type: 'academic',
          data: null,
        });
      expoPushService.sendNotifications.mockResolvedValue({
        targetTokens: 3,
        sent: 3,
        failed: 0,
        deactivatedTokens: 0,
      });

      const result = await service.createSystemNotifications(
        'Class update',
        'Bring your laptop tomorrow',
        'academic',
        undefined,
        { scope: 'class_section', classSectionId: 'section-1' },
        { id: 'lecturer-1', role: Role.lecturer },
      );

      expect(prisma.classEnrollment.findMany).toHaveBeenCalledWith({
        where: {
          classSectionId: 'section-1',
          status: 'active',
          student: {
            isActive: true,
            role: 'student',
          },
        },
        select: { studentId: true },
      });
      expect(prisma.notification.create).toHaveBeenNthCalledWith(1, {
        data: {
          userId: 'lecturer-1',
          title: 'Class update',
          body: 'Bring your laptop tomorrow',
          type: 'academic',
          data: undefined,
        },
      });
      expect(prisma.notification.create).toHaveBeenNthCalledWith(2, {
        data: {
          userId: 'student-1',
          title: 'Class update',
          body: 'Bring your laptop tomorrow',
          type: 'academic',
          data: undefined,
        },
      });
      expect(prisma.notification.create).toHaveBeenNthCalledWith(3, {
        data: {
          userId: 'student-2',
          title: 'Class update',
          body: 'Bring your laptop tomorrow',
          type: 'academic',
          data: undefined,
        },
      });
      expect(result.count).toBe(3);
    });

    it('should reject lecturers broadcasting to classes they do not own', async () => {
      (prisma.classSection.findUnique as jest.Mock).mockResolvedValue({
        id: 'section-1',
        lecturerId: 'lecturer-2',
      });

      await expect(
        service.createSystemNotifications(
          'Class update',
          'Body',
          'academic',
          undefined,
          { scope: 'class_section', classSectionId: 'section-1' },
          { id: 'lecturer-1', role: Role.lecturer },
        ),
      ).rejects.toThrow('You are not allowed to notify this class section');
      expect(prisma.notification.create).not.toHaveBeenCalled();
      expect(expoPushService.sendNotifications).not.toHaveBeenCalled();
    });

    it('should reject lecturers broadcasting to role audiences', async () => {
      await expect(
        service.createSystemNotifications(
          'Title',
          'Body',
          'general',
          undefined,
          { scope: 'roles', roles: ['student'] },
          { id: 'lecturer-1', role: Role.lecturer },
        ),
      ).rejects.toThrow('You are not allowed to broadcast to this audience');
      expect(prisma.user.findMany).not.toHaveBeenCalled();
    });

    it('should return count only when no users match', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.createSystemNotifications('Title', 'Body');

      expect(result).toEqual({ count: 0 });
      expect(prisma.notification.create).not.toHaveBeenCalled();
      expect(expoPushService.sendNotifications).not.toHaveBeenCalled();
    });

    it('should not throw when push delivery fails', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 'user-1' }]);
      (prisma.notification.create as jest.Mock).mockResolvedValue({
        ...mockNotification,
        id: 'notif-1',
        userId: 'user-1',
      });
      expoPushService.sendNotifications.mockRejectedValue(new Error('Expo unavailable'));

      const result = await service.createSystemNotifications('Title', 'Body');

      expect(result).toEqual({
        count: 1,
        push: {
          targetTokens: 0,
          sent: 0,
          failed: 0,
          deactivatedTokens: 0,
        },
      });
    });
  });
});
