import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

function buildSemesterWithSchedulesInclude(userId: string) {
  return {
    classSections: {
      include: {
        course: { select: { code: true, name: true, credits: true } },
        scheduleItems: {
          where: { userId },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
      orderBy: [{ classCode: 'asc' }],
    },
  } satisfies Prisma.SemesterInclude;
}

type SemesterWithSchedules = Prisma.SemesterGetPayload<{
  include: ReturnType<typeof buildSemesterWithSchedulesInclude>;
}>;

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllSemestersWithSchedules(userId: string) {
    const semesters = await this.prisma.semester.findMany({
      include: buildSemesterWithSchedulesInclude(userId),
      orderBy: { startDate: 'desc' },
    });

    return semesters.map((semester) => this.mapSemesterSchedule(semester));
  }

  async getCurrentSemesterSchedule(userId: string) {
    const semester = await this.prisma.semester.findFirst({
      where: { isCurrent: true },
      include: buildSemesterWithSchedulesInclude(userId),
    });

    if (!semester) {
      throw new NotFoundException('Current semester not found');
    }

    return this.mapSemesterSchedule(semester);
  }

  async getSemesterScheduleById(userId: string, semesterId: string) {
    const semester = await this.prisma.semester.findUnique({
      where: { id: semesterId },
      include: buildSemesterWithSchedulesInclude(userId),
    });

    if (!semester) {
      throw new NotFoundException('Semester not found');
    }

    return this.mapSemesterSchedule(semester);
  }

  private mapSemesterSchedule(semester: SemesterWithSchedules) {
    return {
      id: semester.id,
      name: semester.name,
      academicYear: semester.academicYear,
      term: semester.term,
      startDate: semester.startDate,
      endDate: semester.endDate,
      isCurrent: semester.isCurrent,
      sessions: semester.classSections
        .flatMap((classSection) =>
          classSection.scheduleItems.map((item) => ({
            id: item.id,
            classCode: classSection.classCode,
            sectionCode: classSection.sectionCode,
            note: classSection.note,
            instructor: item.instructor,
            room: item.room,
            dayOfWeek: item.dayOfWeek,
            startTime: item.startTime,
            endTime: item.endTime,
            startPeriod: item.startPeriod,
            endPeriod: item.endPeriod,
            sessionType: item.sessionType,
            course: classSection.course,
          })),
        )
        .sort((left, right) => {
          if (left.dayOfWeek !== right.dayOfWeek) {
            return left.dayOfWeek - right.dayOfWeek;
          }

          return left.startTime.localeCompare(right.startTime);
        }),
    };
  }
}
