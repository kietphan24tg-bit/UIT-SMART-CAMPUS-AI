import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AttendanceSessionStatus, EnrollmentStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import { AttendanceService } from './attendance.service';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let prisma: jest.Mocked<PrismaService>;

  async function createSessionAndToken(overrides?: {
    sessionId?: string;
    classSectionId?: string;
    sessionStatus?: AttendanceSessionStatus;
    sessionExpiresAt?: Date;
  }) {
    const sessionId = overrides?.sessionId ?? 'session-1';
    const classSectionId = overrides?.classSectionId ?? 'section-1';

    (prisma.classSection.findUnique as jest.Mock).mockResolvedValue({
      id: classSectionId,
      lecturerId: 'lecturer-1',
    });
    (prisma.attendanceSession.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.attendanceSession.create as jest.Mock).mockResolvedValue({
      id: sessionId,
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 600_000),
      status: AttendanceSessionStatus.active,
    });

    const sessionStart = await service.startSession('lecturer-1', {
      classSectionId,
      durationMinutes: 10,
    });

    (prisma.attendanceSession.findUnique as jest.Mock).mockResolvedValue({
      id: sessionId,
      status: overrides?.sessionStatus ?? AttendanceSessionStatus.active,
      expiresAt: overrides?.sessionExpiresAt ?? new Date(Date.now() + 60_000),
      classSectionId,
      classSection: {
        classCode: 'SE346',
        sectionCode: '01',
        course: { name: 'Software Engineering' },
      },
    });

    const qr = await service.issueQrToken(sessionId, sessionStart.displayKey);

    return { sessionId, classSectionId, qr };
  }

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: PrismaService,
          useValue: {
            classSection: {
              findUnique: jest.fn(),
            },
            attendanceSession: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
            },
            attendanceRecord: {
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
            },
            classEnrollment: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              if (key === 'ATTENDANCE_TOKEN_TTL_SECONDS') {
                return 90;
              }
              if (key === 'APP_BASE_URL') {
                return 'http://localhost:3000';
              }
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(AttendanceService);
    prisma = module.get(PrismaService);
  });

  describe('checkin', () => {
    it('creates attendance record when token and session are valid', async () => {
      const session = {
        id: 'session-1',
        classSectionId: 'section-1',
      };
      (prisma.classEnrollment.findFirst as jest.Mock).mockResolvedValue({
        id: 'enrollment-1',
      });
      (prisma.attendanceRecord.create as jest.Mock).mockResolvedValue({
        id: 'record-1',
        sessionId: session.id,
        studentId: 'student-1',
        checkinTime: new Date(),
      });

      const { qr } = await createSessionAndToken();
      const result = await service.checkin('student-1', { token: qr.token });

      expect(result.studentId).toBe('student-1');
      expect(prisma.attendanceRecord.create).toHaveBeenCalledWith({
        data: {
          sessionId: session.id,
          studentId: 'student-1',
        },
      });
      expect(prisma.classEnrollment.findFirst).toHaveBeenCalledWith({
        where: {
          studentId: 'student-1',
          classSectionId: 'section-1',
          status: EnrollmentStatus.active,
        },
        select: { id: true },
      });
    });

    it('throws TOKEN_INVALID when token does not exist', async () => {
      await expect(service.checkin('student-1', { token: 'expired-token' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws SESSION_CLOSED when attendance session is expired', async () => {
      const { qr } = await createSessionAndToken({
        sessionId: 'session-expired',
      });
      (prisma.attendanceSession.findUnique as jest.Mock).mockResolvedValue({
        id: 'session-expired',
        status: AttendanceSessionStatus.expired,
        expiresAt: new Date(Date.now() - 1_000),
        classSectionId: 'section-1',
      });

      await expect(service.checkin('student-1', { token: qr.token })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ForbiddenException when student is not enrolled', async () => {
      (prisma.classEnrollment.findFirst as jest.Mock).mockResolvedValue(null);
      const { qr } = await createSessionAndToken();

      await expect(service.checkin('student-1', { token: qr.token })).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.attendanceRecord.create).not.toHaveBeenCalled();
    });

    it('throws ALREADY_CHECKED_IN when unique constraint is violated', async () => {
      (prisma.classEnrollment.findFirst as jest.Mock).mockResolvedValue({
        id: 'enrollment-1',
      });
      (prisma.attendanceRecord.create as jest.Mock).mockRejectedValue({
        code: 'P2002',
      });
      const { qr } = await createSessionAndToken();

      await expect(service.checkin('student-1', { token: qr.token })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('startSession', () => {
    it('throws ForbiddenException when lecturer does not own class section', async () => {
      (prisma.classSection.findUnique as jest.Mock).mockResolvedValue({
        id: 'section-1',
        lecturerId: 'lecturer-2',
      });

      await expect(
        service.startSession('lecturer-1', {
          classSectionId: 'section-1',
          durationMinutes: 10,
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.attendanceSession.create).not.toHaveBeenCalled();
    });
  });

  describe('issueQrToken', () => {
    it('throws ForbiddenException when displayKey is missing', async () => {
      await expect(service.issueQrToken('session-1', '')).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when displayKey does not match', async () => {
      await expect(service.issueQrToken('session-1', 'wrong-key')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns token and session meta when displayKey is valid', async () => {
      const { qr } = await createSessionAndToken();

      expect(qr.token).toMatch(/^att_/);
      expect(qr.session).toEqual({
        classCode: 'SE346',
        sectionCode: '01',
        courseName: 'Software Engineering',
        status: AttendanceSessionStatus.active,
      });
    });
  });

  describe('exportSessionAttendance', () => {
    it('exports roster with present and absent students', async () => {
      (prisma.attendanceSession.findFirst as jest.Mock).mockResolvedValue({
        id: 'session-1',
        classSectionId: 'section-1',
        lecturerId: 'lecturer-1',
        status: AttendanceSessionStatus.closed,
        startedAt: new Date('2026-04-25T00:30:00.000Z'),
        expiresAt: new Date('2026-04-25T00:45:00.000Z'),
        classSection: {
          id: 'section-1',
          classCode: 'SE346.Q21',
          sectionCode: 'Q21',
          course: {
            code: 'SE346',
            name: 'Lap trinh tren thiet bi di dong',
            credits: 4,
          },
        },
        records: [
          {
            id: 'record-1',
            studentId: 'student-1',
            checkinTime: new Date('2026-04-25T00:34:00.000Z'),
            student: {
              id: 'student-1',
              email: 'student1@gm.uit.edu.vn',
              firstName: 'Van A',
              lastName: 'Nguyen',
              studentId: '22520001',
            },
          },
        ],
      });
      (prisma.classEnrollment.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'enrollment-1',
          studentId: 'student-1',
          student: {
            id: 'student-1',
            email: 'student1@gm.uit.edu.vn',
            firstName: 'Van A',
            lastName: 'Nguyen',
            studentId: '22520001',
          },
        },
        {
          id: 'enrollment-2',
          studentId: 'student-2',
          student: {
            id: 'student-2',
            email: 'student2@gm.uit.edu.vn',
            firstName: 'Thi B',
            lastName: 'Tran',
            studentId: '22520002',
          },
        },
      ]);

      const result = await service.exportSessionAttendance('session-1', 'lecturer-1');

      expect(result.fileName).toContain('attendance-SE346.Q21-');
      expect(result.fileName.endsWith('.xlsx')).toBe(true);
      expect(Buffer.isBuffer(result.buffer)).toBe(true);
      expect(result.buffer.byteLength).toBeGreaterThan(0);
      expect(prisma.classEnrollment.findMany).toHaveBeenCalledWith({
        where: {
          classSectionId: 'section-1',
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
    });

    it('throws when session does not belong to lecturer', async () => {
      (prisma.attendanceSession.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.exportSessionAttendance('session-1', 'lecturer-1')).rejects.toThrow(
        'Attendance session not found',
      );
    });
  });
});
