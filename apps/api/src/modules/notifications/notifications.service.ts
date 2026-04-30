import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentStatus, Role, type Prisma } from '@prisma/client';
import type { UserRole } from '@smart-campus/shared';

import { PrismaService } from '../../database/prisma.service';

import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { ExpoPushService, PushDeliveryStats } from './expo-push.service';

const EMPTY_PUSH_STATS: PushDeliveryStats = {
  targetTokens: 0,
  sent: 0,
  failed: 0,
  deactivatedTokens: 0,
};

type NotificationAudience =
  | { scope: 'all' }
  | { scope: 'roles'; roles: UserRole[] }
  | { scope: 'class_section'; classSectionId: string };

type RawNotificationAudience = {
  scope: 'all' | 'roles' | 'class_section';
  roles?: UserRole[];
  classSectionId?: string;
};

type NotificationAudienceInput = NotificationAudience | RawNotificationAudience | UserRole[] | undefined;

export interface NotificationActor {
  id: string;
  role: Role;
}

export interface CreateNotificationForUsersInput {
  userIds: string[];
  title: string;
  body: string;
  type?: string;
  data?: Record<string, unknown>;
}

export interface CreateNotificationForClassSectionInput {
  classSectionId: string;
  title: string;
  body: string;
  type?: string;
  data?: Record<string, unknown>;
  actor?: NotificationActor;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly expoPushService: ExpoPushService,
  ) {}

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

  async getNotification(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
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
    audienceInput?: NotificationAudienceInput,
    actor?: NotificationActor,
  ) {
    const audience = this.normalizeAudience(audienceInput);
    const users = await this.resolveAudienceUserIds(audience, actor);

    if (users.length === 0) {
      return { count: 0 };
    }

    const notifications = await Promise.all(
      users.map((user) =>
        this.prisma.notification.create({
          data: {
            userId: user.id,
            title,
            body,
            type,
            data: data as Prisma.InputJsonValue | undefined,
          },
        }),
      ),
    );

    const push = await this.sendPushBestEffort(notifications);

    return {
      count: notifications.length,
      push,
    };
  }

  async createNotificationsForUsers(input: CreateNotificationForUsersInput) {
    const userIds = [...new Set(input.userIds.filter(Boolean))];

    if (userIds.length === 0) {
      return { count: 0 };
    }

    const notifications = await Promise.all(
      userIds.map((userId) =>
        this.prisma.notification.create({
          data: {
            userId,
            title: input.title,
            body: input.body,
            type: input.type ?? 'general',
            data: input.data as Prisma.InputJsonValue | undefined,
          },
        }),
      ),
    );

    const push = await this.sendPushBestEffort(notifications);

    return {
      count: notifications.length,
      push,
    };
  }

  async createNotificationsForClassSection(input: CreateNotificationForClassSectionInput) {
    return this.createSystemNotifications(
      input.title,
      input.body,
      input.type,
      input.data,
      { scope: 'class_section', classSectionId: input.classSectionId },
      input.actor,
    );
  }

  private async sendPushBestEffort(
    notifications: Array<{
      id: string;
      userId: string;
      title: string;
      body: string;
      type: string;
      data?: Prisma.JsonValue | null;
    }>,
  ) {
    try {
      return await this.expoPushService.sendNotifications(
        notifications.map((notification) => ({
          id: notification.id,
          userId: notification.userId,
          title: notification.title,
          body: notification.body,
          type: notification.type,
          data: this.toPushData(notification.data),
        })),
      );
    } catch (error) {
      this.logger.warn(
        `Push delivery failed after notifications were created: ${this.getErrorMessage(error)}`,
      );
      return EMPTY_PUSH_STATS;
    }
  }

  private toPushData(data?: Prisma.JsonValue | null): Record<string, unknown> | null {
    return data && typeof data === 'object' && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : null;
  }

  private getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Unknown error';
  }

  private normalizeAudience(input?: NotificationAudienceInput): NotificationAudience {
    if (Array.isArray(input)) {
      return input.length ? { scope: 'roles', roles: input } : { scope: 'all' };
    }

    if (!input) {
      return { scope: 'all' };
    }

    if (input.scope === 'roles') {
      return { scope: 'roles', roles: input.roles ?? [] };
    }

    if (input.scope === 'class_section') {
      return { scope: 'class_section', classSectionId: input.classSectionId ?? '' };
    }

    return { scope: 'all' };
  }

  private async resolveAudienceUserIds(
    audience: NotificationAudience,
    actor?: NotificationActor,
  ) {
    this.assertAudienceShape(audience);
    this.assertAudiencePermission(audience, actor);

    if (audience.scope === 'class_section') {
      return this.resolveClassSectionAudience(audience.classSectionId, actor);
    }

    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        ...(audience.scope === 'roles' && audience.roles.length
          ? { role: { in: audience.roles as never[] } }
          : {}),
      },
      select: { id: true },
    });

    return users;
  }

  private assertAudiencePermission(audience: NotificationAudience, actor?: NotificationActor) {
    if (!actor || this.canBroadcastToAnyAudience(actor.role)) {
      return;
    }

    if (actor.role === Role.lecturer && audience.scope === 'class_section') {
      return;
    }

    throw new ForbiddenException('You are not allowed to broadcast to this audience');
  }

  private canBroadcastToAnyAudience(role: Role) {
    return role === Role.admin || role === Role.super_admin;
  }

  private assertAudienceShape(audience: NotificationAudience) {
    if (audience.scope === 'roles' && audience.roles.length === 0) {
      throw new BadRequestException('roles must contain at least one role');
    }

    if (audience.scope === 'class_section' && !audience.classSectionId) {
      throw new BadRequestException('classSectionId is required');
    }
  }

  private async resolveClassSectionAudience(classSectionId: string, actor?: NotificationActor) {
    const classSection = await this.prisma.classSection.findUnique({
      where: { id: classSectionId },
      select: { id: true, lecturerId: true },
    });

    if (!classSection) {
      throw new NotFoundException('Class section not found');
    }

    if (actor?.role === Role.lecturer && classSection.lecturerId !== actor.id) {
      throw new ForbiddenException('You are not allowed to notify this class section');
    }

    const enrollments = await this.prisma.classEnrollment.findMany({
      where: {
        classSectionId,
        status: EnrollmentStatus.active,
        student: {
          isActive: true,
          role: Role.student,
        },
      },
      select: {
        studentId: true,
      },
    });

    const userIds = new Set<string>();
    if (classSection.lecturerId) {
      userIds.add(classSection.lecturerId);
    }
    enrollments.forEach((enrollment) => userIds.add(enrollment.studentId));

    return [...userIds].map((id) => ({ id }));
  }
}
