import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async getSchedule(userId: string, semesterId?: string) {
    const where: { userId: string; semesterId?: string } = { userId };

    if (semesterId) {
      where.semesterId = semesterId;
    } else {
      const currentSemester = await this.prisma.semester.findFirst({
        where: { isCurrent: true },
      });
      if (currentSemester) {
        where.semesterId = currentSemester.id;
      }
    }

    return this.prisma.scheduleItem.findMany({
      where,
      include: {
        course: { select: { code: true, name: true, credits: true } },
        semester: { select: { name: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async getSemesters() {
    return this.prisma.semester.findMany({
      orderBy: { startDate: 'desc' },
    });
  }

  async getScheduleItemById(id: string, userId: string) {
    const item = await this.prisma.scheduleItem.findFirst({
      where: { id, userId },
      include: {
        course: true,
        semester: true,
      },
    });
    if (!item) {
      throw new NotFoundException('Schedule item not found');
    }
    return item;
  }
}
