import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { UserRole } from '@smart-campus/shared';

import { PrismaService } from '../../database/prisma.service';

import { RegisterPushTokenDto } from './dto/register-push-token.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return {
      items: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async registerPushToken(userId: string, dto: RegisterPushTokenDto) {
    return this.prisma.userDevicePushToken.upsert({
      where: {
        userId_expoPushToken: {
          userId,
          expoPushToken: dto.expoPushToken,
        },
      },
      create: {
        userId,
        expoPushToken: dto.expoPushToken,
        platform: dto.platform,
        deviceId: dto.deviceId,
        isActive: true,
        lastSeenAt: new Date(),
      },
      update: {
        platform: dto.platform,
        deviceId: dto.deviceId,
        isActive: true,
        lastSeenAt: new Date(),
      },
    });
  }

  async removePushToken(userId: string, expoPushToken: string) {
    const result = await this.prisma.userDevicePushToken.deleteMany({
      where: { userId, expoPushToken },
    });
    return { count: result.count };
  }

  async createSystemNotifications(
    title: string,
    body: string,
    type = 'general',
    data?: Record<string, unknown>,
    roles?: UserRole[],
  ) {
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        ...(roles?.length ? { role: { in: roles as never[] } } : {}),
      },
      select: { id: true },
    });

    if (users.length === 0) {
      return { count: 0 };
    }

    return this.prisma.notification.createMany({
      data: users.map((user) => ({
        userId: user.id,
        title,
        body,
        type,
        data: data as Prisma.InputJsonValue | undefined,
      })),
    });
  }
}
