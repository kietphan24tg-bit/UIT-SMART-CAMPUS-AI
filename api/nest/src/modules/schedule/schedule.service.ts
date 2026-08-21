import { Injectable, NotFoundException } from '@nestjs/common';
import { Role, type Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

const DEMO_SCHEDULE_USER_EMAIL = 'student@gm.uit.edu.vn';

function buildStudentSemesterInclude(userId: string) {
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

function buildLecturerSemesterInclude(userId: string) {
  return {
    classSections: {
      where: {
        lecturerId: userId,
      },
      include: {
        course: { select: { code: true, name: true, credits: true } },
        lecturer: { select: { firstName: true, lastName: true } },
        meetings: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
      orderBy: [{ classCode: 'asc' }],
    },
  } satisfies Prisma.SemesterInclude;
}

type StudentSemesterWithSchedules = Prisma.SemesterGetPayload<{
  include: ReturnType<typeof buildStudentSemesterInclude>;
}>;

type LecturerSemesterWithSchedules = Prisma.SemesterGetPayload<{
  include: ReturnType<typeof buildLecturerSemesterInclude>;
}>;

function toFullName(firstName: string, lastName: string) {
  return [lastName, firstName].filter(Boolean).join(' ').trim();
}

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllSemestersWithSchedules(userId?: string) {
    const effectiveUserId = await this.resolveScheduleUserId(userId);
    // const role = await this.getUserRole(userId);
    // return this.getSemestersByRole(role, userId);
    const role = await this.getUserRole(effectiveUserId);
    return this.getSemestersByRole(role, effectiveUserId);
  }

  async getCurrentSemesterSchedule(userId?: string) {
    const effectiveUserId = await this.resolveScheduleUserId(userId);
    // const role = await this.getUserRole(userId);
    // const semesters = await this.getSemestersByRole(role, userId);
    const role = await this.getUserRole(effectiveUserId);
    const semesters = await this.getSemestersByRole(role, effectiveUserId);
    const current = semesters.find((item) => item.isCurrent);

    if (!current) {
      throw new NotFoundException('Current semester not found');
    }

    return current;
  }

  async getSemesterScheduleById(userId: string | undefined, semesterId: string) {
    const effectiveUserId = await this.resolveScheduleUserId(userId);
    // const role = await this.getUserRole(userId);
    // const semesters = await this.getSemestersByRole(role, userId);
    const role = await this.getUserRole(effectiveUserId);
    const semesters = await this.getSemestersByRole(role, effectiveUserId);
    const semester = semesters.find((entry) => entry.id === semesterId);

    if (!semester) {
      throw new NotFoundException('Semester not found');
    }

    return semester;
  }

  private async resolveScheduleUserId(userId?: string) {
    if (userId) {
      return userId;
    }

    const demoUser = await this.prisma.user.findUnique({
      where: { email: DEMO_SCHEDULE_USER_EMAIL },
      select: { id: true },
    });

    if (!demoUser) {
      throw new NotFoundException('Demo schedule user not found');
    }

    return demoUser.id;
  }

  private async getUserRole(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.role;
  }

  private async getSemestersByRole(role: Role, userId: string) {
    if (role === Role.student) {
      const semesters = await this.prisma.semester.findMany({
        include: buildStudentSemesterInclude(userId),
        orderBy: { startDate: 'desc' },
      });

      return semesters.map((semester) => this.mapStudentSemesterSchedule(semester));
    }

    if (role === Role.lecturer) {
      const semesters = await this.prisma.semester.findMany({
        include: buildLecturerSemesterInclude(userId),
        orderBy: { startDate: 'desc' },
      });

      return semesters.map((semester) => this.mapLecturerSemesterSchedule(semester));
    }

    const semesters = await this.prisma.semester.findMany({
      orderBy: { startDate: 'desc' },
    });

    return semesters.map((semester) => ({
      id: semester.id,
      name: semester.name,
      academicYear: semester.academicYear,
      term: semester.term,
      startDate: semester.startDate,
      endDate: semester.endDate,
      isCurrent: semester.isCurrent,
      sessions: [],
    }));
  }

  private mapStudentSemesterSchedule(semester: StudentSemesterWithSchedules) {
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

  private mapLecturerSemesterSchedule(semester: LecturerSemesterWithSchedules) {
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
          classSection.meetings.map((meeting) => ({
            id: meeting.id,
            classCode: classSection.classCode,
            sectionCode: classSection.sectionCode,
            note: meeting.note ?? classSection.note,
            instructor: classSection.lecturer
              ? toFullName(classSection.lecturer.firstName, classSection.lecturer.lastName)
              : null,
            room: meeting.room ?? null,
            dayOfWeek: meeting.dayOfWeek,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            startPeriod: meeting.startPeriod,
            endPeriod: meeting.endPeriod,
            sessionType: meeting.sessionType,
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

