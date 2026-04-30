import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

import { PrismaService } from '../../database/prisma.service';

const EXPO_PUSH_SEND_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_PUSH_CHUNK_SIZE = 100;
const DEVICE_NOT_REGISTERED = 'DeviceNotRegistered';

export interface PushNotificationPayload {
  userIds: string[];
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
}

export interface PushNotificationRecord {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown> | null;
}

export interface PushDeliveryStats {
  targetTokens: number;
  sent: number;
  failed: number;
  deactivatedTokens: number;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  sound: 'default';
  priority: 'high';
  data: Record<string, unknown>;
}

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);

  constructor(private readonly prisma: PrismaService) {}

  async sendToUsers(payload: PushNotificationPayload): Promise<PushDeliveryStats> {
    const tokens = await this.getActiveTokens(payload.userIds);

    if (tokens.length === 0) {
      return this.emptyStats();
    }

    const messages = tokens.map((token) => this.toExpoMessage(token, payload));
    const stats: PushDeliveryStats = {
      targetTokens: tokens.length,
      sent: 0,
      failed: 0,
      deactivatedTokens: 0,
    };

    for (const chunk of this.chunk(messages, EXPO_PUSH_CHUNK_SIZE)) {
      const chunkStats = await this.sendChunk(chunk);
      stats.sent += chunkStats.sent;
      stats.failed += chunkStats.failed;
      stats.deactivatedTokens += chunkStats.deactivatedTokens;
    }

    return stats;
  }

  async sendNotifications(records: PushNotificationRecord[]): Promise<PushDeliveryStats> {
    const notificationsByUserId = new Map(records.map((record) => [record.userId, record]));
    const tokens = await this.getActiveTokenRows(records.map((record) => record.userId));

    if (tokens.length === 0) {
      return this.emptyStats();
    }

    const messages = tokens
      .map((token) => {
        const record = notificationsByUserId.get(token.userId);
        return record ? this.toExpoMessageForRecord(token.expoPushToken, record) : null;
      })
      .filter((message): message is ExpoPushMessage => Boolean(message));

    const stats: PushDeliveryStats = {
      targetTokens: messages.length,
      sent: 0,
      failed: 0,
      deactivatedTokens: 0,
    };

    for (const chunk of this.chunk(messages, EXPO_PUSH_CHUNK_SIZE)) {
      const chunkStats = await this.sendChunk(chunk);
      stats.sent += chunkStats.sent;
      stats.failed += chunkStats.failed;
      stats.deactivatedTokens += chunkStats.deactivatedTokens;
    }

    return stats;
  }

  private async getActiveTokens(userIds: string[]) {
    const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
    if (uniqueUserIds.length === 0) {
      return [];
    }

    const rows = await this.getActiveTokenRows(uniqueUserIds);

    return [...new Set(rows.map((row) => row.expoPushToken).filter(Boolean))];
  }

  private async getActiveTokenRows(userIds: string[]) {
    const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
    if (uniqueUserIds.length === 0) {
      return [];
    }

    return this.prisma.userDevicePushToken.findMany({
      where: {
        userId: { in: uniqueUserIds },
        isActive: true,
      },
      select: { userId: true, expoPushToken: true },
    });
  }

  private toExpoMessage(token: string, payload: PushNotificationPayload): ExpoPushMessage {
    return {
      to: token,
      title: payload.title,
      body: payload.body,
      sound: 'default',
      priority: 'high',
      data: {
        type: payload.type,
        ...(payload.data ?? {}),
      },
    };
  }

  private toExpoMessageForRecord(token: string, record: PushNotificationRecord): ExpoPushMessage {
    return {
      to: token,
      title: record.title,
      body: record.body,
      sound: 'default',
      priority: 'high',
      data: {
        ...(record.data ?? {}),
        notificationId: record.id,
        kind: 'notification',
        type: record.type,
      },
    };
  }

  private async sendChunk(messages: ExpoPushMessage[]): Promise<PushDeliveryStats> {
    try {
      const response = await axios.post<{ data: ExpoPushTicket[] }>(EXPO_PUSH_SEND_URL, messages, {
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
      });

      return this.mapTickets(messages, response.data.data);
    } catch (error) {
      this.logger.warn(`Expo push request failed: ${this.getErrorMessage(error)}`);
      return {
        targetTokens: messages.length,
        sent: 0,
        failed: messages.length,
        deactivatedTokens: 0,
      };
    }
  }

  private async mapTickets(
    messages: ExpoPushMessage[],
    tickets: ExpoPushTicket[] = [],
  ): Promise<PushDeliveryStats> {
    const tokensToDeactivate: string[] = [];
    let sent = 0;
    let failed = 0;

    messages.forEach((message, index) => {
      const ticket = tickets[index];
      if (ticket?.status === 'ok') {
        sent += 1;
        return;
      }

      failed += 1;
      if (ticket?.details?.error === DEVICE_NOT_REGISTERED) {
        tokensToDeactivate.push(message.to);
      }
    });

    const deactivatedTokens = await this.deactivateTokens(tokensToDeactivate);

    return {
      targetTokens: messages.length,
      sent,
      failed,
      deactivatedTokens,
    };
  }

  private async deactivateTokens(tokens: string[]) {
    const uniqueTokens = [...new Set(tokens)];
    if (uniqueTokens.length === 0) {
      return 0;
    }

    const result = await this.prisma.userDevicePushToken.updateMany({
      where: { expoPushToken: { in: uniqueTokens } },
      data: { isActive: false },
    });

    return result.count;
  }

  private chunk<T>(items: T[], size: number) {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
      chunks.push(items.slice(index, index + size));
    }
    return chunks;
  }

  private emptyStats(): PushDeliveryStats {
    return {
      targetTokens: 0,
      sent: 0,
      failed: 0,
      deactivatedTokens: 0,
    };
  }

  private getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
