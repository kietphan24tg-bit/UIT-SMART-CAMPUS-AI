import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role, SosRequestStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import type { CreateSosRequestDto } from './dto/sos.dto';
import {
  SosRealtimeGateway,
  type SosRealtimeEventName,
} from './sos-realtime.gateway';

const SOS_EXPIRES_HOURS = 6;

function toInputJson(value: Record<string, unknown>) {
  return value as Prisma.InputJsonValue;
}

function toNumber(value: string | number) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new BadRequestException('Tọa độ không hợp lệ');
  }
  return n;
}

type SosRequestWithOptionalRequester = {
  id: string;
  requesterId: string;
  resolverId?: string | null;
  status: SosRequestStatus;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  addressSnapshot: string | null;
  contactSnapshot: Prisma.JsonValue | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  expiresAt: Date;
  requester?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
};

@Injectable()
export class SosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly sosRealtimeGateway: SosRealtimeGateway,
  ) {}

  async createRequest(userId: string, dto: CreateSosRequestDto) {
    await this.expireStaleRequests();
    const active = await this.prisma.sosRequest.findFirst({
      where: {
        requesterId: userId,
        status: SosRequestStatus.active,
      },
      select: { id: true },
    });
    if (active) {
      throw new BadRequestException(
        'Bạn đang có một SOS đang mở. Hãy hủy hoặc kết thúc trước khi tạo mới.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + SOS_EXPIRES_HOURS);
    const addressSnapshot = await this.reverseGeocode(dto.lat, dto.lng);

    const created = await this.prisma.sosRequest.create({
      data: {
        requesterId: userId,
        latitude: dto.lat,
        longitude: dto.lng,
        accuracyMeters: dto.accuracyMeters ?? null,
        addressSnapshot,
        note: dto.note?.trim() || null,
        expiresAt,
        contactSnapshot: toInputJson({
          name: `${user.lastName} ${user.firstName}`.trim(),
          email: user.email,
          phone: user.phone,
        }),
      },
    });

    const peers = await this.prisma.user.findMany({
      where: {
        isActive: true,
        id: { not: userId },
      },
      select: { id: true },
    });
    if (peers.length) {
      await this.prisma.notification.createMany({
        data: peers.map((peer) => ({
          userId: peer.id,
          type: 'sos',
          title: 'Có yêu cầu SOS mới',
          body: 'Một người dùng đang cần hỗ trợ gần vị trí hiện tại của họ.',
          data: toInputJson({ sosId: created.id }),
        })),
      });
    }

    const mapped = this.mapRequest(created);
    this.publishRealtime('sos:created', mapped);
    return mapped;
  }

  async listActiveRequests() {
    await this.expireStaleRequests();
    const items = await this.prisma.sosRequest.findMany({
      where: { status: SosRequestStatus.active },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
    return items.map((item) => this.mapRequest(item));
  }

  async listMyRequests(userId: string) {
    const items = await this.prisma.sosRequest.findMany({
      where: { requesterId: userId },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
    return items.map((item) => this.mapRequest(item));
  }

  async cancelRequest(userId: string, requestId: string) {
    const request = await this.prisma.sosRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        requesterId: true,
        status: true,
      },
    });
    if (!request) {
      throw new NotFoundException('Không tìm thấy yêu cầu SOS');
    }
    if (request.requesterId !== userId) {
      throw new ForbiddenException('Bạn không có quyền hủy yêu cầu SOS này');
    }
    if (request.status !== SosRequestStatus.active) {
      return request;
    }

    const updated = await this.prisma.sosRequest.update({
      where: { id: request.id },
      data: {
        status: SosRequestStatus.cancelled,
        resolvedAt: new Date(),
      },
    });
    const mapped = this.mapRequest(updated);
    this.publishRealtime('sos:cancelled', mapped);
    return mapped;
  }

  async resolveRequest(userId: string, role: Role, requestId: string) {
    const request = await this.prisma.sosRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        requesterId: true,
        status: true,
      },
    });
    if (!request) {
      throw new NotFoundException('Không tìm thấy yêu cầu SOS');
    }

    const canResolve =
      request.requesterId === userId ||
      role === Role.admin ||
      role === Role.super_admin;
    if (!canResolve) {
      throw new ForbiddenException('Bạn không có quyền kết thúc yêu cầu SOS này');
    }
    if (request.status !== SosRequestStatus.active) {
      return request;
    }

    const updated = await this.prisma.sosRequest.update({
      where: { id: request.id },
      data: {
        status: SosRequestStatus.resolved,
        resolverId: userId,
        resolvedAt: new Date(),
      },
    });
    const mapped = this.mapRequest(updated);
    this.publishRealtime('sos:resolved', mapped);
    return mapped;
  }

  async getRoute(requestId: string, fromLat: number, fromLng: number) {
    const request = await this.prisma.sosRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        status: true,
      },
    });
    if (!request) {
      throw new NotFoundException('Không tìm thấy yêu cầu SOS');
    }
    if (request.status !== SosRequestStatus.active) {
      throw new BadRequestException(
        'Yêu cầu SOS này không còn ở trạng thái hoạt động',
      );
    }

    const apiKey = this.getTrackAsiaApiKey();
    if (!apiKey) {
      throw new BadRequestException(
        'Thiếu TrackAsia API key cho tính năng chỉ đường',
      );
    }

    const url =
      `https://maps.track-asia.com/route/v2/directions/json?origin=${toNumber(
        fromLat,
      )},${toNumber(fromLng)}` +
      `&destination=${request.latitude},${request.longitude}` +
      `&mode=driving&key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url);
    const payload = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (!response.ok) {
      throw new BadRequestException('Không thể lấy lộ trình từ TrackAsia');
    }

    return {
      sosId: request.id,
      route: payload,
    };
  }

  private async reverseGeocode(lat: number, lng: number) {
    const apiKey = this.getTrackAsiaApiKey();
    if (!apiKey) {
      return null;
    }

    const url = `https://maps.track-asia.com/api/v2/geocode/json?latlng=${lat},${lng}&key=${encodeURIComponent(
      apiKey,
    )}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return null;
      }
      const payload = (await response.json()) as Record<string, unknown>;
      const results = Array.isArray(payload.results)
        ? (payload.results as Array<Record<string, unknown>>)
        : [];
      const first = results[0];
      if (!first) {
        return null;
      }
      return String(
        first.formatted_address || first.vicinity || first.name || '',
      );
    } catch {
      return null;
    }
  }

  private async expireStaleRequests() {
    const expiring = await this.prisma.sosRequest.findMany({
      where: {
        status: SosRequestStatus.active,
        expiresAt: { lt: new Date() },
      },
    });
    if (!expiring.length) {
      return;
    }

    await this.prisma.sosRequest.updateMany({
      where: {
        status: SosRequestStatus.active,
        expiresAt: { lt: new Date() },
      },
      data: {
        status: SosRequestStatus.expired,
      },
    });

    const expiredItems = await this.prisma.sosRequest.findMany({
      where: {
        id: { in: expiring.map((item) => item.id) },
      },
    });
    expiredItems.forEach((item) => {
      this.publishRealtime('sos:expired', this.mapRequest(item));
    });
  }

  private getTrackAsiaApiKey() {
    return (
      this.configService.get<string>('TRACK_ASIA_SERVER_KEY')?.trim() ||
      this.configService.get<string>('EXPO_PUBLIC_TRACK_ASIA_MAP_KEY')?.trim() ||
      ''
    );
  }

  private publishRealtime(
    event: SosRealtimeEventName,
    request: ReturnType<SosService['mapRequest']>,
  ) {
    this.sosRealtimeGateway.publish(event, {
      sosId: request.id,
      request,
    });
  }

  private mapRequest(item: SosRequestWithOptionalRequester) {
    return {
      id: item.id,
      requesterId: item.requesterId,
      resolverId: item.resolverId ?? null,
      status: item.status,
      lat: item.latitude,
      lng: item.longitude,
      accuracyMeters: item.accuracyMeters,
      addressSnapshot: item.addressSnapshot,
      contactSnapshot: item.contactSnapshot,
      note: item.note,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      resolvedAt: item.resolvedAt?.toISOString() ?? null,
      expiresAt: item.expiresAt.toISOString(),
      requester: item.requester
        ? {
            id: item.requester.id,
            fullName: `${item.requester.lastName} ${item.requester.firstName}`.trim(),
            email: item.requester.email,
            phone: item.requester.phone,
          }
        : null,
    };
  }
}
