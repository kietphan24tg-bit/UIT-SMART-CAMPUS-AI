import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventStatus } from '@prisma/client';
import { USER_ROLES } from '@smart-campus/shared';

import { PrismaService } from '../../database/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

const SLUG_PATTERN = /^[a-zA-Z0-9_-]+$/;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function normalizeSlug(slug: string) {
  return String(slug || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function toDateLabel(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function isAdminRole(role: string) {
  return role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN;
}

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async listEvents(userId: string, pageInput?: number, limitInput?: number) {
    const page = Math.max(1, pageInput ?? 1);
    const limit = Math.min(Math.max(1, limitInput ?? DEFAULT_LIMIT), MAX_LIMIT);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.event.findMany({
        where: {
          status: {
            in: [EventStatus.planned, EventStatus.open, EventStatus.closed],
          },
        },
        include: {
          registrations: {
            where: {
              userId,
              cancelledAt: null,
            },
            select: {
              id: true,
            },
          },
          _count: {
            select: {
              registrations: {
                where: {
                  cancelledAt: null,
                },
              },
            },
          },
        },
        orderBy: [{ startAt: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.event.count({
        where: {
          status: {
            in: [EventStatus.planned, EventStatus.open, EventStatus.closed],
          },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items: items.map((item) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        url: `https://www.uit.edu.vn/bai-viet/${item.slug}`,
        dateLabel: toDateLabel(item.startAt),
        excerpt: item.excerpt,
        thumbnailUrl: item.coverImageUrl ?? '',
        location: item.location,
        status: item.status,
        category: item.category,
        startAt: item.startAt,
        endAt: item.endAt,
        maxAttendees: item.maxAttendees,
        attendeeCount: item._count.registrations,
        isRegistered: item.registrations.length > 0,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getArticleBySlug(userId: string, slug: string) {
    if (!SLUG_PATTERN.test(slug)) {
      throw new BadRequestException('Invalid slug');
    }

    const event = await this.prisma.event.findUnique({
      where: { slug },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        registrations: {
          where: {
            userId,
            cancelledAt: null,
          },
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            registrations: {
              where: {
                cancelledAt: null,
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Article not found');
    }

    return {
      id: event.id,
      slug: event.slug,
      title: event.title,
      publishedAtLabel: toDateLabel(event.startAt),
      contentHtml: event.contentHtml,
      excerpt: event.excerpt,
      location: event.location,
      status: event.status,
      category: event.category,
      startAt: event.startAt,
      endAt: event.endAt,
      maxAttendees: event.maxAttendees,
      attendeeCount: event._count.registrations,
      isRegistered: event.registrations.length > 0,
      coverImageUrl: event.coverImageUrl,
      owner: {
        id: event.owner.id,
        email: event.owner.email,
        fullName: [event.owner.lastName, event.owner.firstName].filter(Boolean).join(' ').trim(),
      },
    };
  }

  async createEvent(ownerId: string, dto: CreateEventDto) {
    const slug = normalizeSlug(dto.slug);
    if (!SLUG_PATTERN.test(slug)) {
      throw new BadRequestException('Invalid slug');
    }

    if (new Date(dto.endAt) <= new Date(dto.startAt)) {
      throw new BadRequestException('endAt must be after startAt');
    }

    return this.prisma.event.create({
      data: {
        ownerId,
        slug,
        title: dto.title.trim(),
        excerpt: dto.excerpt.trim(),
        location: dto.location.trim(),
        contentHtml: dto.contentHtml.trim(),
        coverImageUrl: dto.coverImageUrl?.trim() || null,
        status: dto.status ?? EventStatus.open,
        category: dto.category ?? 'workshop',
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        maxAttendees: dto.maxAttendees ?? null,
      },
    });
  }

  async updateEvent(eventId: string, userId: string, role: string, dto: UpdateEventDto) {
    const existing = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Event not found');
    }

    if (!isAdminRole(role) && existing.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to update this event');
    }

    const startAt = dto.startAt ? new Date(dto.startAt) : null;
    const endAt = dto.endAt ? new Date(dto.endAt) : null;
    if (startAt && endAt && endAt <= startAt) {
      throw new BadRequestException('endAt must be after startAt');
    }

    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        ...(dto.slug ? { slug: normalizeSlug(dto.slug) } : {}),
        ...(dto.title ? { title: dto.title.trim() } : {}),
        ...(dto.excerpt ? { excerpt: dto.excerpt.trim() } : {}),
        ...(dto.location ? { location: dto.location.trim() } : {}),
        ...(dto.contentHtml ? { contentHtml: dto.contentHtml.trim() } : {}),
        ...(dto.coverImageUrl !== undefined ? { coverImageUrl: dto.coverImageUrl?.trim() || null } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.category ? { category: dto.category } : {}),
        ...(startAt ? { startAt } : {}),
        ...(endAt ? { endAt } : {}),
        ...(dto.maxAttendees !== undefined ? { maxAttendees: dto.maxAttendees ?? null } : {}),
      },
    });
  }

  async register(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            registrations: {
              where: { cancelledAt: null },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.status !== EventStatus.open) {
      throw new BadRequestException('Event registration is closed');
    }

    if (event.maxAttendees && event._count.registrations >= event.maxAttendees) {
      throw new BadRequestException('Event is full');
    }

    return this.prisma.eventRegistration.upsert({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
      update: {
        cancelledAt: null,
      },
      create: {
        eventId,
        userId,
      },
    });
  }

  async unregister(eventId: string, userId: string) {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
      select: {
        id: true,
        cancelledAt: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.cancelledAt) {
      return { success: true };
    }

    await this.prisma.eventRegistration.update({
      where: { id: registration.id },
      data: {
        cancelledAt: new Date(),
      },
    });

    return { success: true };
  }

  async listRegistrations(eventId: string, userId: string, role: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (!isAdminRole(role) && event.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to view registrations');
    }

    const registrations = await this.prisma.eventRegistration.findMany({
      where: {
        eventId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            studentId: true,
            role: true,
          },
        },
      },
      orderBy: { registeredAt: 'asc' },
    });

    return registrations.map((registration) => ({
      id: registration.id,
      registeredAt: registration.registeredAt,
      cancelledAt: registration.cancelledAt,
      checkedInAt: registration.checkedInAt,
      user: {
        id: registration.user.id,
        email: registration.user.email,
        fullName: [registration.user.lastName, registration.user.firstName].filter(Boolean).join(' ').trim(),
        studentId: registration.user.studentId,
        role: registration.user.role,
      },
    }));
  }
}

