import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, SosRequestStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';

import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../database/prisma.service';

import type { CreateSosRequestDto } from './dto/sos.dto';

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

@Injectable()
export class SosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
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
      throw new BadRequestException('Bạn đang có một SOS đang mở. Hãy hủy hoặc kết thúc trước khi tạo mới.');
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

    return this.mapRequest(created);
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

    return this.prisma.sosRequest.update({
      where: { id: request.id },
      data: {
        status: SosRequestStatus.cancelled,
        resolvedAt: new Date(),
      },
    });
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
      request.requesterId === userId || role === Role.admin || role === Role.super_admin;
    if (!canResolve) {
      throw new ForbiddenException('Bạn không có quyền kết thúc yêu cầu SOS này');
    }
    if (request.status !== SosRequestStatus.active) {
      return request;
    }

    return this.prisma.sosRequest.update({
      where: { id: request.id },
      data: {
        status: SosRequestStatus.resolved,
        resolverId: userId,
        resolvedAt: new Date(),
      },
    });
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
      throw new BadRequestException('Yêu cầu SOS này không còn ở trạng thái hoạt động');
    }

    const apiKey = this.configService.get<string>('TRACK_ASIA_SERVER_KEY')?.trim();
    if (!apiKey) {
      throw new BadRequestException('Thiếu cấu hình TRACK_ASIA_SERVER_KEY cho tính năng chỉ đường');
    }

    const url = `https://maps.track-asia.com/v2/directions/driving?coordinates=${toNumber(
      fromLng,
    )},${toNumber(fromLat)};${request.longitude},${request.latitude}&key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url);
    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      throw new BadRequestException('Không thể lấy lộ trình từ TrackAsia');
    }

    return {
      sosId: request.id,
      route: payload,
    };
  }

  private async reverseGeocode(lat: number, lng: number) {
    const apiKey = this.configService.get<string>('TRACK_ASIA_SERVER_KEY')?.trim();
    if (!apiKey) {
      return null;
    }

    const url = `https://maps.track-asia.com/v2/geocode/reverse?latlng=${lat},${lng}&key=${encodeURIComponent(
      apiKey,
    )}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return null;
      }
      const payload = (await response.json()) as Record<string, unknown>;
      const features = Array.isArray(payload.features)
        ? (payload.features as Array<Record<string, unknown>>)
        : [];
      const first = features[0];
      if (!first) {
        return null;
      }
      return String(first.place_name || first.name || '');
    } catch {
      return null;
    }
  }

  private async expireStaleRequests() {
    await this.prisma.sosRequest.updateMany({
      where: {
        status: SosRequestStatus.active,
        expiresAt: { lt: new Date() },
      },
      data: {
        status: SosRequestStatus.expired,
      },
    });
  }

  private mapRequest(item: {
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
  }) {
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
