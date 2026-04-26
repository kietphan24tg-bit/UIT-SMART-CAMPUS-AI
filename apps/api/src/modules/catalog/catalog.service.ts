import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, type ScheduleSessionType } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { CreateClassSectionDto } from './dto/create-class-section.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { ReplaceClassMeetingsDto } from './dto/replace-class-meetings.dto';
import { UpdateClassSectionDto } from './dto/update-class-section.dto';

const DEFAULT_SCHEDULE_SESSION_TYPE: ScheduleSessionType = 'daytime';

function toFullName(firstName: string, lastName: string) {
  return [lastName, firstName].filter(Boolean).join(' ').trim();
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listSemesters() {
    return this.prisma.semester.findMany({
      orderBy: { startDate: 'desc' },
      select: {
        id: true,
        name: true,
        academicYear: true,
        term: true,
        startDate: true,
        endDate: true,
        isCurrent: true,
      },
    });
  }

  async listCourses() {
    return this.prisma.course.findMany({
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        credits: true,
        faculty: true,
        description: true,
      },
    });
  }

  async createCourse(dto: CreateCourseDto) {
    return this.prisma.course.upsert({
      where: { code: dto.code.trim().toUpperCase() },
      update: {
        name: dto.name.trim(),
        credits: dto.credits,
        faculty: dto.faculty?.trim() || null,
        description: dto.description?.trim() || null,
      },
      create: {
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        credits: dto.credits,
        faculty: dto.faculty?.trim() || null,
        description: dto.description?.trim() || null,
      },
      select: {
        id: true,
        code: true,
        name: true,
        credits: true,
        faculty: true,
        description: true,
      },
    });
  }

  async listLecturers() {
    const users = await this.prisma.user.findMany({
      where: {
        role: Role.lecturer,
        isActive: true,
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      fullName: toFullName(user.firstName, user.lastName),
    }));
  }

  async listClassSections(semesterId?: string) {
    const sections = await this.prisma.classSection.findMany({
      where: semesterId ? { semesterId } : undefined,
      include: {
        course: { select: { id: true, code: true, name: true, credits: true } },
        semester: { select: { id: true, name: true, isCurrent: true } },
        lecturer: { select: { id: true, email: true, firstName: true, lastName: true } },
        meetings: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
        _count: {
          select: {
            enrollments: {
              where: { status: 'active' },
            },
          },
        },
      },
      orderBy: [{ semester: { startDate: 'desc' } }, { classCode: 'asc' }],
    });

    return sections.map((section) => ({
      id: section.id,
      classCode: section.classCode,
      sectionCode: section.sectionCode,
      note: section.note,
      capacity: section.capacity,
      registrationOpen: section.registrationOpen,
      enrolledCount: section._count.enrollments,
      course: section.course,
      semester: section.semester,
      lecturer: section.lecturer
        ? {
            id: section.lecturer.id,
            email: section.lecturer.email,
            fullName: toFullName(section.lecturer.firstName, section.lecturer.lastName),
          }
        : null,
      meetings: section.meetings,
    }));
  }

  async createClassSection(dto: CreateClassSectionDto) {
    const [semester, course] = await Promise.all([
      this.prisma.semester.findUnique({ where: { id: dto.semesterId }, select: { id: true } }),
      this.prisma.course.findUnique({
        where: { code: dto.courseCode.trim().toUpperCase() },
        select: { id: true },
      }),
    ]);

    if (!semester) {
      throw new NotFoundException('Semester not found');
    }

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (dto.lecturerId) {
      const lecturer = await this.prisma.user.findFirst({
        where: {
          id: dto.lecturerId,
          role: Role.lecturer,
          isActive: true,
        },
        select: { id: true },
      });
      if (!lecturer) {
        throw new NotFoundException('Lecturer not found');
      }
    }

    const classCode = dto.classCode.trim().toUpperCase();
    const sectionCode = dto.sectionCode.trim().toUpperCase();

    const duplicated = await this.prisma.classSection.findFirst({
      where: {
        semesterId: semester.id,
        courseId: course.id,
        sectionCode,
      },
      select: { id: true },
    });

    if (duplicated) {
      throw new BadRequestException('Section code already exists for this course and semester');
    }

    return this.prisma.classSection.create({
      data: {
        semesterId: semester.id,
        courseId: course.id,
        classCode,
        sectionCode,
        note: dto.note?.trim() || null,
        lecturerId: dto.lecturerId ?? null,
        capacity: dto.capacity ?? 60,
        registrationOpen: dto.registrationOpen ?? true,
      },
      include: {
        course: { select: { code: true, name: true, credits: true } },
        semester: { select: { id: true, name: true, isCurrent: true } },
        lecturer: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async updateClassSection(sectionId: string, dto: UpdateClassSectionDto) {
    const section = await this.prisma.classSection.findUnique({
      where: { id: sectionId },
      select: { id: true },
    });

    if (!section) {
      throw new NotFoundException('Class section not found');
    }

    if (dto.lecturerId) {
      const lecturer = await this.prisma.user.findFirst({
        where: {
          id: dto.lecturerId,
          role: Role.lecturer,
          isActive: true,
        },
        select: { id: true },
      });

      if (!lecturer) {
        throw new NotFoundException('Lecturer not found');
      }
    }

    return this.prisma.classSection.update({
      where: { id: sectionId },
      data: {
        ...(dto.sectionCode ? { sectionCode: dto.sectionCode.trim().toUpperCase() } : {}),
        ...(dto.note !== undefined ? { note: dto.note?.trim() || null } : {}),
        ...(dto.lecturerId !== undefined ? { lecturerId: dto.lecturerId || null } : {}),
        ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
        ...(dto.registrationOpen !== undefined ? { registrationOpen: dto.registrationOpen } : {}),
      },
    });
  }

  async replaceClassMeetings(sectionId: string, dto: ReplaceClassMeetingsDto) {
    const section = await this.prisma.classSection.findUnique({
      where: { id: sectionId },
      select: { id: true },
    });

    if (!section) {
      throw new NotFoundException('Class section not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.classMeeting.deleteMany({
        where: {
          classSectionId: sectionId,
        },
      });

      if (dto.meetings.length > 0) {
        await tx.classMeeting.createMany({
          data: dto.meetings.map((meeting) => ({
            classSectionId: sectionId,
            dayOfWeek: meeting.dayOfWeek,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            startPeriod: meeting.startPeriod ?? null,
            endPeriod: meeting.endPeriod ?? null,
            room: meeting.room?.trim() || null,
            sessionType: meeting.sessionType ?? DEFAULT_SCHEDULE_SESSION_TYPE,
            note: meeting.note?.trim() || null,
          })),
        });
      }
    });

    return this.prisma.classSection.findUnique({
      where: { id: sectionId },
      include: {
        meetings: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
    });
  }
}

