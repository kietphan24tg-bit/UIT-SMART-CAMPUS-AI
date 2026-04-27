import { randomBytes } from 'node:crypto';

import ExcelJS from 'exceljs';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AttendanceSession, Prisma } from '@prisma/client';
import { AttendanceSessionStatus, EnrollmentStatus, Role } from '@prisma/client';
import { API_PREFIX, PAGINATION_DEFAULTS } from '@smart-campus/shared';
import { createClient } from 'redis';

import { PrismaService } from '../../database/prisma.service';

import type { CheckinAttendanceDto } from './dto/checkin-attendance.dto';
import type { GetAttendanceHistoryDto } from './dto/get-attendance-history.dto';
import type { GetSessionRecordsDto } from './dto/get-session-records.dto';
import type { StartAttendanceSessionDto } from './dto/start-attendance-session.dto';

interface AttendanceTokenPayload {
  sessionId: string;
  issuedAt: string;
  expiresAt: string;
}

interface MemoryValue {
  value: string;
  expiresAt: number;
}

type ExportableAttendanceSession = Prisma.AttendanceSessionGetPayload<{
  include: {
    classSection: {
      select: {
        id: true;
        classCode: true;
        sectionCode: true;
        course: {
          select: {
            code: true;
            name: true;
            credits: true;
          };
        };
      };
    };
    records: {
      include: {
        student: {
          select: {
            id: true;
            email: true;
            firstName: true;
            lastName: true;
            studentId: true;
          };
        };
      };
    };
  };
}>;

type ExportableAttendanceClassSection = Prisma.ClassSectionGetPayload<{
  include: {
    course: {
      select: {
        code: true;
        name: true;
        credits: true;
      };
    };
    lecturer: {
      select: {
        firstName: true;
        lastName: true;
        email: true;
      };
    };
    attendanceSessions: {
      include: {
        records: {
          select: {
            studentId: true;
          };
        };
      };
    };
  };
}>;

function formatFullName(firstName?: string | null, lastName?: string | null) {
  return [lastName, firstName].filter(Boolean).join(' ').trim();
}

function formatExportDateTime(value: Date | null | undefined) {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

function sanitizeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '_');
}

@Injectable()
export class AttendanceService implements OnModuleInit, OnModuleDestroy {
  private readonly qrRefreshSeconds = 30;
  private readonly tokenTtlSeconds: number;
  private readonly checkinRateLimitSeconds = 2;
  private readonly memoryStore = new Map<string, MemoryValue>();

  private readonly redisClient: ReturnType<typeof createClient>;

  private redisEnabled = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.tokenTtlSeconds = Number(
      this.configService.get<number>('ATTENDANCE_TOKEN_TTL_SECONDS', 90),
    );
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
    const isTestEnvironment = process.env.NODE_ENV === 'test';

    this.redisClient = createClient({
      url: redisUrl,
      ...(isTestEnvironment
        ? {
            socket: {
              connectTimeout: 1000,
              reconnectStrategy: false,
            },
          }
        : {}),
    });
  }

  async onModuleInit() {
    try {
      if (!this.redisClient.isOpen) {
        await this.redisClient.connect();
      }
      this.redisEnabled = this.redisClient.isOpen;
    } catch {
      this.redisEnabled = false;
    }
  }

  async onModuleDestroy() {
    try {
      if (this.redisClient.isOpen) {
        await this.redisClient.close();
      }
    } catch {
      // Best effort cleanup for local/test environments without Redis.
    }
  }

  async startSession(actorId: string, actorRole: Role, dto: StartAttendanceSessionDto) {
    this.assertCanManageAttendance(actorRole);
    const classSection = await this.prisma.classSection.findUnique({
      where: { id: dto.classSectionId },
      select: { id: true, lecturerId: true },
    });

    if (!classSection) {
      throw new NotFoundException('Class section not found');
    }

    if (
      !this.canManageAllAttendance(actorRole) &&
      (!classSection.lecturerId || classSection.lecturerId !== actorId)
    ) {
      throw new ForbiddenException('You are not assigned to this class section');
    }

    const sessionLecturerId =
      this.canManageAllAttendance(actorRole) && classSection.lecturerId
        ? classSection.lecturerId
        : actorId;

    const existingActiveSession = await this.prisma.attendanceSession.findFirst({
      where: {
        classSectionId: dto.classSectionId,
        status: AttendanceSessionStatus.active,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });

    if (existingActiveSession) {
      throw new ConflictException(
        'This class section already has an active attendance session',
      );
    }

    const startedAt = new Date();
    const durationMinutes = dto.durationMinutes ?? 10;
    const expiresAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
    const session = await this.prisma.attendanceSession.create({
      data: {
        classSectionId: dto.classSectionId,
        lecturerId: sessionLecturerId,
        expiresAt,
      },
    });

    const displayKey = `dsp_${randomBytes(24).toString('base64url')}`;
    const displayTtlSeconds = Math.max(
      1,
      Math.ceil((expiresAt.getTime() - startedAt.getTime()) / 1000),
    );
    await this.setStoreValue(this.buildDisplayKeyStoreKey(session.id), displayKey, displayTtlSeconds);

    const appBaseUrl = this.configService.get<string>('APP_BASE_URL', 'http://localhost:3000');
    const base = appBaseUrl.replace(/\/$/, '');
    return {
      sessionId: session.id,
      displayKey,
      displayUrl: `${base}/live/attendance/${session.id}?displayKey=${encodeURIComponent(displayKey)}`,
      startedAt: session.startedAt,
      expiresAt: session.expiresAt,
      status: session.status,
    };
  }

  async stopSession(sessionId: string, actorId: string, actorRole: Role) {
    this.assertCanManageAttendance(actorRole);
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || (!this.canManageAllAttendance(actorRole) && session.lecturerId !== actorId)) {
      throw new NotFoundException('Attendance session not found');
    }

    await this.revokeDisplayKeyForSession(sessionId);

    if (session.status !== AttendanceSessionStatus.active) {
      return session;
    }

    return this.prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        status: AttendanceSessionStatus.closed,
        closedAt: new Date(),
      },
    });
  }

  async issueQrToken(sessionId: string, displayKey: string) {
    this.assertDisplayKeyPresent(displayKey);
    await this.validateDisplayKeyOrThrow(sessionId, displayKey);

    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        classSection: {
          select: {
            classCode: true,
            sectionCode: true,
            course: { select: { name: true } },
          },
        },
      },
    });

    const activeSession = await this.ensureSessionActive(session);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.tokenTtlSeconds * 1000);
    const token = `att_${randomBytes(18).toString('base64url')}`;
    const payload: AttendanceTokenPayload = {
      sessionId: activeSession.id,
      issuedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    await this.setStoreValue(
      this.buildTokenKey(token),
      JSON.stringify(payload),
      this.tokenTtlSeconds,
    );

    return {
      token,
      expiresAt,
      refreshInSeconds: this.qrRefreshSeconds,
      ttlSeconds: this.tokenTtlSeconds,
      session: {
        classCode: activeSession.classSection.classCode,
        sectionCode: activeSession.classSection.sectionCode,
        courseName: activeSession.classSection.course.name,
        status: activeSession.status,
      },
    };
  }

  async renderLiveAttendancePage(sessionId: string, displayKey: string | undefined) {
    this.assertDisplayKeyPresent(displayKey);
    await this.validateDisplayKeyOrThrow(sessionId, displayKey);
    return this.renderLiveAttendanceHtml(sessionId, displayKey);
  }

  async checkin(studentId: string, dto: CheckinAttendanceDto) {
    await this.enforceCheckinRateLimit(studentId);
    const rawTokenPayload = await this.getStoreValue(this.buildTokenKey(dto.token));
    if (!rawTokenPayload) {
      throw new BadRequestException({
        code: 'TOKEN_INVALID',
        message: 'Attendance token is invalid or expired',
      });
    }

    let tokenPayload: AttendanceTokenPayload;
    try {
      tokenPayload = JSON.parse(rawTokenPayload) as AttendanceTokenPayload;
    } catch {
      throw new BadRequestException({
        code: 'TOKEN_INVALID',
        message: 'Attendance token is invalid',
      });
    }

    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: tokenPayload.sessionId },
    });
    const activeSession = await this.ensureSessionActive(session);

    const activeEnrollment = await this.prisma.classEnrollment.findFirst({
      where: {
        studentId,
        classSectionId: activeSession.classSectionId,
        status: EnrollmentStatus.active,
      },
      select: { id: true },
    });

    if (!activeEnrollment) {
      throw new ForbiddenException({
        code: 'NOT_ENROLLED',
        message: 'Student is not enrolled in this class section',
      });
    }

    try {
      const record = await this.prisma.attendanceRecord.create({
        data: {
          sessionId: activeSession.id,
          studentId,
        },
      });

      return {
        sessionId: activeSession.id,
        studentId: record.studentId,
        checkinTime: record.checkinTime,
      };
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException({
          code: 'ALREADY_CHECKED_IN',
          message: 'Student has already checked in for this session',
        });
      }
      throw error;
    }
  }

  async getSessionRecords(
    sessionId: string,
    actorId: string,
    actorRole: Role,
    query: GetSessionRecordsDto,
  ) {
    await this.verifySessionAccessByRole(sessionId, actorId, actorRole);

    const page = Math.max(query.page ?? PAGINATION_DEFAULTS.PAGE, PAGINATION_DEFAULTS.PAGE);
    const limit = Math.min(
      Math.max(query.limit ?? PAGINATION_DEFAULTS.LIMIT, 1),
      PAGINATION_DEFAULTS.MAX_LIMIT,
    );
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where: { sessionId },
        include: {
          student: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              studentId: true,
            },
          },
        },
        orderBy: { checkinTime: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.attendanceRecord.count({ where: { sessionId } }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        checkinTime: item.checkinTime,
        student: item.student,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async exportSessionAttendance(sessionId: string, actorId: string, actorRole: Role) {
    await this.verifySessionAccessByRole(sessionId, actorId, actorRole);

    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        classSection: {
          select: {
            id: true,
            classCode: true,
            sectionCode: true,
            course: {
              select: {
                code: true,
                name: true,
                credits: true,
              },
            },
          },
        },
        records: {
          include: {
            student: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                studentId: true,
              },
            },
          },
          orderBy: { checkinTime: 'asc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Attendance session not found');
    }

    const roster = await this.prisma.classEnrollment.findMany({
      where: {
        classSectionId: session.classSectionId,
        status: EnrollmentStatus.active,
      },
      include: {
        student: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
      },
      orderBy: {
        student: {
          studentId: 'asc',
        },
      },
    });

    return this.buildAttendanceExportWorkbook(session, roster);
  }

  async exportClassSectionAttendanceSummary(
    classSectionId: string,
    actorId: string,
    actorRole: Role,
  ) {
    await this.verifyClassSectionAccessByRole(classSectionId, actorId, actorRole);

    const classSection = await this.prisma.classSection.findUnique({
      where: { id: classSectionId },
      include: {
        course: {
          select: {
            code: true,
            name: true,
            credits: true,
          },
        },
        lecturer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        attendanceSessions: {
          include: {
            records: {
              select: {
                studentId: true,
              },
            },
          },
          orderBy: { startedAt: 'asc' },
        },
      },
    });

    if (!classSection) {
      throw new NotFoundException('Class section not found');
    }

    const roster = await this.prisma.classEnrollment.findMany({
      where: {
        classSectionId,
        status: EnrollmentStatus.active,
      },
      include: {
        student: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
      },
      orderBy: {
        student: {
          studentId: 'asc',
        },
      },
    });

    return this.buildAttendanceClassSummaryWorkbook(classSection, roster);
  }

  async getHistory(actorId: string, actorRole: Role, query: GetAttendanceHistoryDto) {
    this.assertCanManageAttendance(actorRole);
    const page = Math.max(query.page ?? PAGINATION_DEFAULTS.PAGE, PAGINATION_DEFAULTS.PAGE);
    const limit = Math.min(
      Math.max(query.limit ?? PAGINATION_DEFAULTS.LIMIT, 1),
      PAGINATION_DEFAULTS.MAX_LIMIT,
    );
    const skip = (page - 1) * limit;

    const where: Prisma.AttendanceSessionWhereInput = {
      classSectionId: query.classSectionId,
      ...(!this.canManageAllAttendance(actorRole) ? { lecturerId: actorId } : {}),
    };

    if (query.date) {
      const day = new Date(query.date);
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      where.startedAt = {
        gte: dayStart,
        lt: dayEnd,
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.attendanceSession.findMany({
        where,
        include: {
          classSection: {
            select: {
              id: true,
              classCode: true,
              sectionCode: true,
            },
          },
          _count: {
            select: { records: true },
          },
        },
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.attendanceSession.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        status: item.status,
        startedAt: item.startedAt,
        expiresAt: item.expiresAt,
        closedAt: item.closedAt,
        classSection: item.classSection,
        checkedInCount: item._count.records,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getClassSectionSessionSummary(
    classSectionId: string,
    actorId: string,
    actorRole: Role,
  ) {
    this.assertCanManageAttendance(actorRole);
    await this.verifyClassSectionAccessByRole(classSectionId, actorId, actorRole);

    const scopeWhere: Prisma.AttendanceSessionWhereInput = {
      classSectionId,
      ...(!this.canManageAllAttendance(actorRole) ? { lecturerId: actorId } : {}),
    };

    const [totalSessions, activeSessions, closedSessions, expiredSessions, latestSession] =
      await Promise.all([
        this.prisma.attendanceSession.count({
          where: scopeWhere,
        }),
        this.prisma.attendanceSession.count({
          where: {
            ...scopeWhere,
            status: AttendanceSessionStatus.active,
          },
        }),
        this.prisma.attendanceSession.count({
          where: {
            ...scopeWhere,
            status: AttendanceSessionStatus.closed,
          },
        }),
        this.prisma.attendanceSession.count({
          where: {
            ...scopeWhere,
            status: AttendanceSessionStatus.expired,
          },
        }),
        this.prisma.attendanceSession.findFirst({
          where: scopeWhere,
          include: {
            _count: {
              select: { records: true },
            },
          },
          orderBy: { startedAt: 'desc' },
        }),
      ]);

    return {
      totalSessions,
      activeSessions,
      closedSessions,
      expiredSessions,
      latestSession: latestSession
        ? {
            id: latestSession.id,
            status: latestSession.status,
            startedAt: latestSession.startedAt,
            expiresAt: latestSession.expiresAt,
            checkedInCount: latestSession._count.records,
          }
        : null,
    };
  }

  async getLecturerClassSections(actorId: string, actorRole: Role) {
    this.assertCanManageAttendance(actorRole);
    const sections = await this.prisma.classSection.findMany({
      where: {
        ...(!this.canManageAllAttendance(actorRole) ? { lecturerId: actorId } : {}),
      },
      include: {
        course: {
          select: {
            code: true,
            name: true,
            credits: true,
          },
        },
        semester: {
          select: {
            id: true,
            name: true,
            isCurrent: true,
          },
        },
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
      meetings: section.meetings,
    }));
  }

  async getClassSectionStudents(classSectionId: string, actorId: string, actorRole: Role) {
    this.assertCanManageAttendance(actorRole);
    await this.verifyClassSectionAccessByRole(classSectionId, actorId, actorRole);

    const roster = await this.prisma.classEnrollment.findMany({
      where: {
        classSectionId,
        status: EnrollmentStatus.active,
      },
      include: {
        student: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
      },
      orderBy: {
        student: {
          studentId: 'asc',
        },
      },
    });

    return roster.map((enrollment) => ({
      id: enrollment.student.id,
      email: enrollment.student.email,
      firstName: enrollment.student.firstName,
      lastName: enrollment.student.lastName,
      studentId: enrollment.student.studentId,
    }));
  }

  async getStudentHistory(studentId: string, query: GetSessionRecordsDto) {
    const page = Math.max(query.page ?? PAGINATION_DEFAULTS.PAGE, PAGINATION_DEFAULTS.PAGE);
    const limit = Math.min(
      Math.max(query.limit ?? PAGINATION_DEFAULTS.LIMIT, 1),
      PAGINATION_DEFAULTS.MAX_LIMIT,
    );
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where: { studentId },
        include: {
          session: {
            include: {
              classSection: {
                include: {
                  course: {
                    select: {
                      code: true,
                      name: true,
                      credits: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { checkinTime: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.attendanceRecord.count({
        where: { studentId },
      }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        checkinTime: item.checkinTime,
        sessionId: item.sessionId,
        classSection: {
          id: item.session.classSection.id,
          classCode: item.session.classSection.classCode,
          sectionCode: item.session.classSection.sectionCode,
          course: item.session.classSection.course,
        },
        session: {
          id: item.session.id,
          status: item.session.status,
          startedAt: item.session.startedAt,
          expiresAt: item.session.expiresAt,
        },
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async verifySessionAccessByRole(
    sessionId: string,
    actorId: string,
    actorRole: Role,
  ) {
    this.assertCanManageAttendance(actorRole);
    const session = await this.prisma.attendanceSession.findFirst({
      where: {
        id: sessionId,
        ...(!this.canManageAllAttendance(actorRole) ? { lecturerId: actorId } : {}),
      },
      select: { id: true },
    });

    if (!session) {
      throw new NotFoundException('Attendance session not found');
    }
  }

  private async verifyClassSectionAccessByRole(
    classSectionId: string,
    actorId: string,
    actorRole: Role,
  ) {
    this.assertCanManageAttendance(actorRole);
    const classSection = await this.prisma.classSection.findFirst({
      where: {
        id: classSectionId,
        ...(!this.canManageAllAttendance(actorRole) ? { lecturerId: actorId } : {}),
      },
      select: { id: true },
    });

    if (!classSection) {
      throw new NotFoundException('Class section not found');
    }
  }

  private async buildAttendanceExportWorkbook(
    session: ExportableAttendanceSession,
    roster: Array<
      Prisma.ClassEnrollmentGetPayload<{
        include: {
          student: {
            select: {
              id: true;
              email: true;
              firstName: true;
              lastName: true;
              studentId: true;
            };
          };
        };
      }>
    >,
  ) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Diem danh');
    const recordsByStudentId = new Map(session.records.map((record) => [record.studentId, record]));

    worksheet.columns = [
      { header: 'STT', key: 'index', width: 8 },
      { header: 'MSSV', key: 'studentId', width: 18 },
      { header: 'Họ và tên', key: 'fullName', width: 28 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Trạng thái', key: 'status', width: 16 },
      { header: 'Giờ check-in', key: 'checkinTime', width: 22 },
    ];

    worksheet.mergeCells('A1:F1');
    worksheet.getCell('A1').value = 'BÁO CÁO ĐIỂM DANH QR';
    worksheet.getCell('A1').font = { bold: true, size: 14 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    const infoRows = [
      ['Môn học', session.classSection.course.name],
      ['Mã môn', session.classSection.course.code],
      ['Mã lớp', session.classSection.classCode],
      ['Bắt đầu', formatExportDateTime(session.startedAt)],
      ['Hết hạn', formatExportDateTime(session.expiresAt)],
      ['Đã check-in / Sĩ số', `${session.records.length}/${roster.length}`],
    ];

    infoRows.forEach(([label, value], index) => {
      const rowNumber = index + 3;
      const row = worksheet.getRow(rowNumber);
      worksheet.mergeCells(`B${rowNumber}:F${rowNumber}`);
      row.getCell(1).value = label;
      row.getCell(2).value = value;
      row.getCell(1).font = { bold: true };
      row.getCell(2).alignment = { horizontal: 'left' };
    });

    const headerRowIndex = infoRows.length + 5;
    const headerRow = worksheet.getRow(headerRowIndex);
    headerRow.values = ['STT', 'MSSV', 'Họ và tên', 'Email', 'Trạng thái', 'Giờ check-in'];
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEAF3FF' },
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD5E2F2' } },
        left: { style: 'thin', color: { argb: 'FFD5E2F2' } },
        bottom: { style: 'thin', color: { argb: 'FFD5E2F2' } },
        right: { style: 'thin', color: { argb: 'FFD5E2F2' } },
      };
    });

    roster.forEach((enrollment, index) => {
      const record = recordsByStudentId.get(enrollment.studentId);
      const row = worksheet.addRow({
        index: index + 1,
        studentId: enrollment.student.studentId ?? enrollment.student.email,
        fullName: formatFullName(enrollment.student.firstName, enrollment.student.lastName),
        email: enrollment.student.email,
        status: record ? 'Có mặt' : 'Vắng',
        checkinTime: record ? formatExportDateTime(record.checkinTime) : '',
      });

      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE4EDF7' } },
          left: { style: 'thin', color: { argb: 'FFE4EDF7' } },
          bottom: { style: 'thin', color: { argb: 'FFE4EDF7' } },
          right: { style: 'thin', color: { argb: 'FFE4EDF7' } },
        };
      });
    });

    worksheet.views = [{ state: 'frozen', ySplit: headerRowIndex }];

    const startedDate = new Intl.DateTimeFormat('sv-SE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .format(session.startedAt)
      .replace(/-/g, '');
    const fileName = sanitizeFileName(
      `attendance-${session.classSection.classCode}-${startedDate}.xlsx`,
    );

    return {
      fileName,
      buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
    };
  }

  private async buildAttendanceClassSummaryWorkbook(
    classSection: ExportableAttendanceClassSection,
    roster: Array<
      Prisma.ClassEnrollmentGetPayload<{
        include: {
          student: {
            select: {
              id: true;
              email: true;
              firstName: true;
              lastName: true;
              studentId: true;
            };
          };
        };
      }>
    >,
  ) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tong hop diem danh');
    const sessions = classSection.attendanceSessions;
    const lastColumnIndex = 4 + sessions.length;
    const lastColumnLetter = String.fromCharCode(64 + Math.max(lastColumnIndex, 4));
    const lecturerName = classSection.lecturer
      ? formatFullName(classSection.lecturer.firstName, classSection.lecturer.lastName)
      : '';

    worksheet.views = [{ state: 'frozen', ySplit: 7, xSplit: 3 }];
    worksheet.properties.defaultRowHeight = 22;
    worksheet.columns = [
      { key: 'index', width: 8 },
      { key: 'studentId', width: 16 },
      { key: 'fullName', width: 28 },
      { key: 'email', width: 30 },
      ...sessions.map(() => ({ width: 16 })),
    ];

    worksheet.mergeCells(`A1:${lastColumnLetter}1`);
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'BAO CAO TONG HOP DIEM DANH THEO LOP';
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    const infoRows = [
      ['Mon hoc', classSection.course.name],
      ['Ma mon', classSection.course.code],
      ['Ma lop', classSection.classCode],
      ['Giang vien', lecturerName || classSection.lecturer?.email || 'Chua cap nhat'],
      ['Tong sinh vien', String(roster.length)],
    ];

    infoRows.forEach(([label, value], index) => {
      const rowNumber = index + 3;
      worksheet.getCell(`A${rowNumber}`).value = label;
      worksheet.getCell(`A${rowNumber}`).font = { bold: true, size: 11 };
      worksheet.getCell(`B${rowNumber}`).value = value;
      worksheet.mergeCells(`B${rowNumber}:D${rowNumber}`);
      worksheet.getCell(`B${rowNumber}`).alignment = { horizontal: 'left' };
    });

    const legendCell = worksheet.getCell('F3');
    legendCell.value = 'Chu thich';
    legendCell.font = { bold: true, size: 11 };

    const legendItems = [
      ['F4', 'Co mat'],
      ['F5', 'Vang'],
      ['G4', 'Dang mo'],
      ['G5', 'Het han'],
    ] as const;

    legendItems.forEach(([cellRef, value]) => {
      const cell = worksheet.getCell(cellRef);
      cell.value = value;
      this.applySummaryStatusStyle(cell, value);
      this.applySummaryBorder(cell);
    });

    const headerRowNumber = 7;
    const headerRow = worksheet.getRow(headerRowNumber);
    headerRow.height = 34;
    headerRow.getCell(1).value = 'STT';
    headerRow.getCell(2).value = 'MSSV';
    headerRow.getCell(3).value = 'Ho va ten';
    headerRow.getCell(4).value = 'Email';

    sessions.forEach((session, index) => {
      const dateLabel = new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      }).format(session.startedAt);
      const timeLabel = new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(session.startedAt);
      headerRow.getCell(5 + index).value = `${dateLabel}\n${timeLabel}`;
    });

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEAF3FF' },
      };
      this.applySummaryBorder(cell, 'FFC9D7E6');
    });

    roster.forEach((enrollment, index) => {
      const row = worksheet.addRow([
        index + 1,
        enrollment.student.studentId ?? enrollment.student.email,
        formatFullName(enrollment.student.firstName, enrollment.student.lastName),
        enrollment.student.email,
        ...sessions.map((session) =>
          session.records.some((record) => record.studentId === enrollment.studentId)
            ? 'Co mat'
            : session.status === AttendanceSessionStatus.active
              ? 'Dang mo'
              : session.status === AttendanceSessionStatus.expired
                ? 'Het han'
                : 'Vang',
        ),
      ]);

      row.height = 24;
      row.eachCell((cell, colNumber) => {
        this.applySummaryBorder(cell);
        if (colNumber >= 5) {
          this.applySummaryStatusStyle(cell, String(cell.value || ''));
        } else {
          cell.alignment = { vertical: 'middle' };
        }
      });
    });

    const footerRowNumber = worksheet.lastRow.number + 2;
    worksheet.mergeCells(`A${footerRowNumber}:${lastColumnLetter}${footerRowNumber}`);
    const footerCell = worksheet.getCell(`A${footerRowNumber}`);
    footerCell.value =
      'Bao cao nay tong hop theo lop: moi cot la mot phien diem danh, moi dong la mot sinh vien.';
    footerCell.font = { italic: true, size: 10, color: { argb: 'FF667085' } };

    const fileName = sanitizeFileName(`attendance-summary-${classSection.classCode}.xlsx`);
    return {
      fileName,
      buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
    };
  }

  private applySummaryBorder(cell: ExcelJS.Cell, color = 'FFD7E0EA') {
    cell.border = {
      top: { style: 'thin', color: { argb: color } },
      left: { style: 'thin', color: { argb: color } },
      bottom: { style: 'thin', color: { argb: color } },
      right: { style: 'thin', color: { argb: color } },
    };
  }

  private applySummaryStatusStyle(cell: ExcelJS.Cell, value: string) {
    const toneByStatus: Record<string, { fill: string; text: string }> = {
      'Co mat': { fill: 'FFE8F7EC', text: 'FF146C2E' },
      Vang: { fill: 'FFFCE8E6', text: 'FFC5221F' },
      'Dang mo': { fill: 'FFFFF4E5', text: 'FF9A6700' },
      'Het han': { fill: 'FFE8F0FE', text: 'FF175CD3' },
    };

    const tone = toneByStatus[value] ?? { fill: 'FFF8FAFC', text: 'FF344054' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: tone.fill },
    };
    cell.font = { color: { argb: tone.text }, bold: true, size: 11 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  private canManageAllAttendance(role: Role) {
    return role === Role.admin || role === Role.super_admin;
  }

  private assertCanManageAttendance(role: Role) {
    if (role !== Role.lecturer && role !== Role.admin && role !== Role.super_admin) {
      throw new ForbiddenException('You are not allowed to manage attendance');
    }
  }

  private buildTokenKey(token: string) {
    return `attendance:token:${token}`;
  }

  private buildDisplayKeyStoreKey(sessionId: string) {
    return `attendance:display:${sessionId}`;
  }

  private buildCheckinRateLimitKey(studentId: string) {
    return `attendance:checkin:rate-limit:${studentId}`;
  }

  private async enforceCheckinRateLimit(studentId: string) {
    const allowed = await this.setStoreValueIfAbsent(
      this.buildCheckinRateLimitKey(studentId),
      '1',
      this.checkinRateLimitSeconds,
    );

    if (!allowed) {
      throw new HttpException(
        {
          code: 'RATE_LIMITED',
          message: 'Too many check-in requests. Please try again shortly.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async ensureSessionActive<T extends AttendanceSession | null>(
    session: T,
  ): Promise<NonNullable<T>> {
    if (!session) {
      throw new NotFoundException('Attendance session not found');
    }

    if (session.status === AttendanceSessionStatus.closed) {
      throw new BadRequestException({
        code: 'SESSION_CLOSED',
        message: 'Attendance session is closed',
      });
    }

    const now = new Date();
    if (session.expiresAt <= now || session.status === AttendanceSessionStatus.expired) {
      await this.markSessionExpired(session.id);
      throw new BadRequestException({
        code: 'SESSION_CLOSED',
        message: 'Attendance session has expired',
      });
    }

    return session;
  }

  private async markSessionExpired(sessionId: string) {
    await this.revokeDisplayKeyForSession(sessionId);
    await this.prisma.attendanceSession.updateMany({
      where: {
        id: sessionId,
        status: AttendanceSessionStatus.active,
      },
      data: {
        status: AttendanceSessionStatus.expired,
      },
    });
  }

  private assertDisplayKeyPresent(displayKey: string | undefined): asserts displayKey is string {
    if (!displayKey || !String(displayKey).trim()) {
      throw new ForbiddenException('Invalid displayKey');
    }
  }

  private async validateDisplayKeyOrThrow(sessionId: string, displayKey: string) {
    const stored = await this.getStoreValue(this.buildDisplayKeyStoreKey(sessionId));
    if (!stored || stored !== displayKey) {
      throw new ForbiddenException('Invalid displayKey');
    }
  }

  private async revokeDisplayKeyForSession(sessionId: string) {
    await this.deleteStoreValue(this.buildDisplayKeyStoreKey(sessionId));
  }

  private renderLiveAttendanceHtml(sessionId: string, displayKey: string) {
    const appBaseUrl = this.configService
      .get<string>('APP_BASE_URL', 'http://localhost:3000')
      .replace(/\/$/, '');
    const clientConfig = {
      sessionId,
      displayKey,
      apiBaseUrl: appBaseUrl,
      apiPrefix: API_PREFIX,
    };
    const configJson = JSON.stringify(clientConfig);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Attendance QR</title>
  <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
  <style>
    :root { color-scheme: light dark; }
    body { font-family: system-ui, sans-serif; margin: 0; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1.5rem; }
    h1 { font-size: 1.25rem; margin: 0 0 0.5rem; text-align: center; }
    .sub { opacity: 0.85; text-align: center; margin-bottom: 1rem; }
    #qr-wrap { background: #fff; color: #000; padding: 1rem; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.12); }
    canvas { display: block; max-width: min(70vw, 360px); height: auto !important; }
    #status { margin-top: 1rem; text-align: center; font-size: 0.95rem; }
    .err { color: #c00; }
  </style>
</head>
<body>
  <h1 id="title">Attendance</h1>
  <p class="sub" id="subtitle"></p>
  <div id="qr-wrap"><canvas id="qr" width="280" height="280" aria-label="Attendance QR code"></canvas></div>
  <p id="status">Loading...</p>
  <script>
    (function () {
      var cfg = ${configJson};
      var canvas = document.getElementById('qr');
      var statusEl = document.getElementById('status');
      var titleEl = document.getElementById('title');
      var subtitleEl = document.getElementById('subtitle');
      var pollMs = 30000;
      var timeoutId = null;

      function setStatus(text, isErr) {
        statusEl.textContent = text;
        statusEl.className = isErr ? 'err' : '';
      }

      function buildSubtitle(session) {
        if (!session) {
          return '';
        }
        var classCode = String(session.classCode || '').trim();
        var sectionCode = String(session.sectionCode || '').trim();
        if (!classCode) {
          return sectionCode;
        }
        if (!sectionCode) {
          return classCode;
        }
        return classCode.toUpperCase().endsWith(sectionCode.toUpperCase())
          ? classCode
          : (classCode + ' - ' + sectionCode);
      }

      function buildQrUrl() {
        var base = String(cfg.apiBaseUrl || '').replace(/[/]$/, '');
        var prefix = String(cfg.apiPrefix || '');
        return base + prefix + '/attendance/session/' + encodeURIComponent(cfg.sessionId) + '/qr-token?displayKey=' + encodeURIComponent(cfg.displayKey);
      }

      function scheduleNext() {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(function () {
          tick().finally(scheduleNext);
        }, pollMs);
      }

      async function tick() {
        try {
          var res = await fetch(buildQrUrl(), { credentials: 'omit' });
          var body = await res.json().catch(function () { return null; });
          if (!res.ok) {
            setStatus((body && body.message) ? body.message : ('HTTP ' + res.status), true);
            if (res.status === 403 && timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            return;
          }
          var data = body && body.data;
          if (!data || !data.token) {
            setStatus('Invalid response', true);
            return;
          }
          if (data.refreshInSeconds) {
            pollMs = Number(data.refreshInSeconds) * 1000 || 30000;
          }
          if (data.session) {
            titleEl.textContent = data.session.courseName || 'Attendance';
            subtitleEl.textContent = buildSubtitle(data.session);
          }
          await QRCode.toCanvas(canvas, data.token, { margin: 2, width: 280 });
          setStatus('Mo ung dung de quet ma diem danh');
        } catch (e) {
          setStatus(String(e && e.message ? e.message : e), true);
        }
      }

      tick().finally(scheduleNext);
    })();
  </script>
</body>
</html>`;
  }

  private async setStoreValue(key: string, value: string, ttlSeconds: number) {
    if (this.redisEnabled) {
      await this.redisClient.set(key, value, { EX: ttlSeconds });
      return;
    }

    this.memoryStore.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  private async setStoreValueIfAbsent(key: string, value: string, ttlSeconds: number) {
    if (this.redisEnabled) {
      const result = await this.redisClient.set(key, value, {
        EX: ttlSeconds,
        NX: true,
      });
      return result === 'OK';
    }

    this.cleanupExpiredKey(key);
    if (this.memoryStore.has(key)) {
      return false;
    }

    this.memoryStore.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return true;
  }

  private async getStoreValue(key: string) {
    if (this.redisEnabled) {
      return this.redisClient.get(key);
    }

    this.cleanupExpiredKey(key);
    return this.memoryStore.get(key)?.value ?? null;
  }

  private async deleteStoreValue(key: string) {
    if (this.redisEnabled) {
      await this.redisClient.del(key);
      return;
    }

    this.memoryStore.delete(key);
  }

  private cleanupExpiredKey(key: string) {
    const entry = this.memoryStore.get(key);
    if (entry && entry.expiresAt <= Date.now()) {
      this.memoryStore.delete(key);
    }
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return Boolean(
      error &&
        typeof error === 'object' &&
        'code' in error &&
        typeof (error as { code?: unknown }).code === 'string' &&
        (error as { code: string }).code === 'P2002',
    );
  }
}
