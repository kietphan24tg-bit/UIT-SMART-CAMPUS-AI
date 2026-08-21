import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { EnrollmentStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

type EnrollmentViewPayload = Prisma.ClassEnrollmentGetPayload<{
  include: {
    classSection: {
      include: {
        course: { select: { code: true; name: true; credits: true } };
        semester: { select: { id: true; name: true; isCurrent: true } };
        lecturer: { select: { id: true; firstName: true; lastName: true; email: true } };
        meetings: {
          select: {
            id: true;
            dayOfWeek: true;
            room: true;
            startTime: true;
            endTime: true;
            startPeriod: true;
            endPeriod: true;
            sessionType: true;
            note: true;
          };
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }];
        };
        _count: { select: { enrollments: { where: { status: 'active' } } } };
      };
    };
  };
}>;

type ClassSectionForRegistration = Prisma.ClassSectionGetPayload<{
  include: {
    meetings: {
      select: {
        id: true;
        dayOfWeek: true;
        startTime: true;
        endTime: true;
      };
    };
    _count: { select: { enrollments: { where: { status: 'active' } } } };
  };
}>;

function toFullName(firstName: string, lastName: string) {
  return [lastName, firstName].filter(Boolean).join(' ').trim();
}

function timeRangeOverlap(startA: string, endA: string, startB: string, endB: string) {
  return startA < endB && startB < endA;
}

function mapEnrollment(enrollment: EnrollmentViewPayload) {
  const enrolledCount = enrollment.classSection._count.enrollments;
  const seatsRemaining = Math.max(0, enrollment.classSection.capacity - enrolledCount);

  return {
    id: enrollment.id,
    status: enrollment.status,
    registeredAt: enrollment.registeredAt,
    droppedAt: enrollment.droppedAt,
    classSection: {
      id: enrollment.classSection.id,
      classCode: enrollment.classSection.classCode,
      sectionCode: enrollment.classSection.sectionCode,
      note: enrollment.classSection.note,
      registrationOpen: enrollment.classSection.registrationOpen,
      capacity: enrollment.classSection.capacity,
      enrolledCount,
      seatsRemaining,
      course: enrollment.classSection.course,
      semester: enrollment.classSection.semester,
      lecturer: enrollment.classSection.lecturer
        ? {
            id: enrollment.classSection.lecturer.id,
            email: enrollment.classSection.lecturer.email,
            fullName: toFullName(
              enrollment.classSection.lecturer.firstName,
              enrollment.classSection.lecturer.lastName,
            ),
          }
        : null,
      meetings: enrollment.classSection.meetings,
    },
  };
}

@Injectable()
export class RegistrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailableClassSections(studentId: string) {
    const activeEnrollments = await this.prisma.classEnrollment.findMany({
      where: {
        studentId,
        status: EnrollmentStatus.active,
      },
      include: {
        classSection: {
          include: {
            meetings: {
              select: {
                dayOfWeek: true,
                startTime: true,
                endTime: true,
              },
            },
          },
        },
      },
    });

    const enrolledSectionIds = new Set(activeEnrollments.map((item) => item.classSectionId));
    const activeMeetings = activeEnrollments.flatMap((item) => item.classSection.meetings);

    const sections = await this.prisma.classSection.findMany({
      where: { registrationOpen: true },
      include: {
        course: { select: { code: true, name: true, credits: true } },
        semester: { select: { id: true, name: true, isCurrent: true } },
        lecturer: { select: { id: true, email: true, firstName: true, lastName: true } },
        meetings: {
          select: {
            id: true,
            dayOfWeek: true,
            room: true,
            startTime: true,
            endTime: true,
            startPeriod: true,
            endPeriod: true,
            sessionType: true,
            note: true,
          },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
        _count: {
          select: {
            enrollments: {
              where: { status: EnrollmentStatus.active },
            },
          },
        },
      },
      orderBy: [{ semester: { startDate: 'desc' } }, { classCode: 'asc' }],
    });

    return sections.map((section) => {
      const enrolledCount = section._count.enrollments;
      const seatsRemaining = Math.max(0, section.capacity - enrolledCount);
      const isRegistered = enrolledSectionIds.has(section.id);
      const hasConflict = section.meetings.some((candidateMeeting) =>
        activeMeetings.some(
          (enrolledMeeting) =>
            candidateMeeting.dayOfWeek === enrolledMeeting.dayOfWeek &&
            timeRangeOverlap(
              candidateMeeting.startTime,
              candidateMeeting.endTime,
              enrolledMeeting.startTime,
              enrolledMeeting.endTime,
            ),
        ),
      );

      return {
        id: section.id,
        classCode: section.classCode,
        sectionCode: section.sectionCode,
        note: section.note,
        registrationOpen: section.registrationOpen,
        capacity: section.capacity,
        enrolledCount,
        seatsRemaining,
        isRegistered,
        hasConflict,
        canRegister: !isRegistered && !hasConflict && seatsRemaining > 0,
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
      };
    });
  }

  async getMyRegistrations(studentId: string, status?: EnrollmentStatus) {
    const enrollments = await this.prisma.classEnrollment.findMany({
      where: {
        studentId,
        ...(status ? { status } : {}),
      },
      include: {
        classSection: {
          include: {
            course: { select: { code: true, name: true, credits: true } },
            semester: { select: { id: true, name: true, isCurrent: true } },
            lecturer: { select: { id: true, firstName: true, lastName: true, email: true } },
            meetings: {
              select: {
                id: true,
                dayOfWeek: true,
                room: true,
                startTime: true,
                endTime: true,
                startPeriod: true,
                endPeriod: true,
                sessionType: true,
                note: true,
              },
              orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
            },
            _count: {
              select: {
                enrollments: {
                  where: { status: EnrollmentStatus.active },
                },
              },
            },
          },
        },
      },
      orderBy: [{ registeredAt: 'desc' }],
    });

    return enrollments.map(mapEnrollment);
  }

  async register(studentId: string, classSectionId: string) {
    const section = await this.prisma.classSection.findUnique({
      where: { id: classSectionId },
      include: {
        meetings: {
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            room: true,
            startPeriod: true,
            endPeriod: true,
            sessionType: true,
            note: true,
          },
        },
        _count: {
          select: {
            enrollments: {
              where: { status: EnrollmentStatus.active },
            },
          },
        },
      },
    });

    if (!section) {
      throw new NotFoundException('Class section not found');
    }

    if (!section.registrationOpen) {
      throw new BadRequestException('Registration for this class section is closed');
    }

    const existingEnrollment = await this.prisma.classEnrollment.findUnique({
      where: {
        studentId_classSectionId: {
          studentId,
          classSectionId,
        },
      },
    });

    if (existingEnrollment?.status === EnrollmentStatus.active) {
      throw new ConflictException('You are already registered in this class section');
    }

    if (section._count.enrollments >= section.capacity) {
      throw new ConflictException('Class section is full');
    }

    const currentActiveEnrollments = await this.prisma.classEnrollment.findMany({
      where: {
        studentId,
        status: EnrollmentStatus.active,
      },
      include: {
        classSection: {
          include: {
            meetings: {
              select: {
                dayOfWeek: true,
                startTime: true,
                endTime: true,
              },
            },
          },
        },
      },
    });

    const hasConflict = section.meetings.some((candidateMeeting) =>
      currentActiveEnrollments.some((enrollment) =>
        enrollment.classSection.meetings.some(
          (registeredMeeting) =>
            candidateMeeting.dayOfWeek === registeredMeeting.dayOfWeek &&
            timeRangeOverlap(
              candidateMeeting.startTime,
              candidateMeeting.endTime,
              registeredMeeting.startTime,
              registeredMeeting.endTime,
            ),
        ),
      ),
    );

    if (hasConflict) {
      throw new ConflictException('Schedule conflict detected');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.classEnrollment.upsert({
        where: {
          studentId_classSectionId: {
            studentId,
            classSectionId,
          },
        },
        update: {
          status: EnrollmentStatus.active,
          registeredAt: new Date(),
          droppedAt: null,
        },
        create: {
          studentId,
          classSectionId,
          status: EnrollmentStatus.active,
        },
      });

      await tx.scheduleItem.deleteMany({
        where: {
          userId: studentId,
          classSectionId,
        },
      });

      if (section.meetings.length > 0) {
        await tx.scheduleItem.createMany({
          data: section.meetings.map((meeting) => ({
            userId: studentId,
            classSectionId,
            dayOfWeek: meeting.dayOfWeek,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            startPeriod: meeting.startPeriod,
            endPeriod: meeting.endPeriod,
            sessionType: meeting.sessionType,
            room: meeting.room ?? null,
            instructor: null,
          })),
        });
      }
    });

    const enrollment = await this.prisma.classEnrollment.findUnique({
      where: {
        studentId_classSectionId: {
          studentId,
          classSectionId,
        },
      },
      include: {
        classSection: {
          include: {
            course: { select: { code: true, name: true, credits: true } },
            semester: { select: { id: true, name: true, isCurrent: true } },
            lecturer: { select: { id: true, firstName: true, lastName: true, email: true } },
            meetings: {
              select: {
                id: true,
                dayOfWeek: true,
                room: true,
                startTime: true,
                endTime: true,
                startPeriod: true,
                endPeriod: true,
                sessionType: true,
                note: true,
              },
              orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
            },
            _count: {
              select: {
                enrollments: {
                  where: { status: EnrollmentStatus.active },
                },
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return mapEnrollment(enrollment);
  }

  async drop(studentId: string, enrollmentId: string) {
    const enrollment = await this.prisma.classEnrollment.findFirst({
      where: {
        id: enrollmentId,
        studentId,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (enrollment.status === EnrollmentStatus.dropped) {
      return this.findEnrollmentOrThrow(enrollment.id);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.classEnrollment.update({
        where: { id: enrollment.id },
        data: {
          status: EnrollmentStatus.dropped,
          droppedAt: new Date(),
        },
      });

      await tx.scheduleItem.deleteMany({
        where: {
          userId: studentId,
          classSectionId: enrollment.classSectionId,
        },
      });
    });

    return this.findEnrollmentOrThrow(enrollment.id);
  }

  private async findEnrollmentOrThrow(enrollmentId: string) {
    const enrollment = await this.prisma.classEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        classSection: {
          include: {
            course: { select: { code: true, name: true, credits: true } },
            semester: { select: { id: true, name: true, isCurrent: true } },
            lecturer: { select: { id: true, firstName: true, lastName: true, email: true } },
            meetings: {
              select: {
                id: true,
                dayOfWeek: true,
                room: true,
                startTime: true,
                endTime: true,
                startPeriod: true,
                endPeriod: true,
                sessionType: true,
                note: true,
              },
              orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
            },
            _count: {
              select: {
                enrollments: {
                  where: { status: EnrollmentStatus.active },
                },
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return mapEnrollment(enrollment);
  }
}
