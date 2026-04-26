import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AttendanceSessionStatus, EnrollmentStatus, Role } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import { AttendanceService } from './attendance.service';

const redisGetMock = jest.fn();
const redisSetMock = jest.fn();
const redisDelMock = jest.fn();
const redisConnectMock = jest.fn();

jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    isOpen: true,
    connect: redisConnectMock,
    get: redisGetMock,
    set: redisSetMock,
    del: redisDelMock,
  })),
}));

describe('AttendanceService', () => {
  let service: AttendanceService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    redisGetMock.mockReset();
    redisSetMock.mockReset();
    redisDelMock.mockReset();
    redisConnectMock.mockReset();
    redisSetMock.mockResolvedValue('OK');

    const module = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: PrismaService,
          useValue: {
            classSection: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
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
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              if (key === 'REDIS_URL') {
                return 'redis://localhost:6379';
              }
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
        status: AttendanceSessionStatus.active,
        expiresAt: new Date(Date.now() + 60_000),
        classSectionId: 'section-1',
      };
      redisGetMock.mockResolvedValue(
        JSON.stringify({
          sessionId: session.id,
          issuedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 90_000).toISOString(),
        }),
      );
      (prisma.attendanceSession.findUnique as jest.Mock).mockResolvedValue(session);
      (prisma.classEnrollment.findFirst as jest.Mock).mockResolvedValue({
        id: 'enrollment-1',
      });
      (prisma.attendanceRecord.create as jest.Mock).mockResolvedValue({
        id: 'record-1',
        sessionId: session.id,
        studentId: 'student-1',
        checkinTime: new Date(),
      });

      const result = await service.checkin('student-1', { token: 'valid-token' });

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

    it('throws TOKEN_INVALID when token does not exist in Redis', async () => {
      redisGetMock.mockResolvedValue(null);

      await expect(service.checkin('student-1', { token: 'expired-token' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws SESSION_CLOSED when attendance session is expired', async () => {
      redisGetMock.mockResolvedValue(
        JSON.stringify({
          sessionId: 'session-expired',
          issuedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 90_000).toISOString(),
        }),
      );
      (prisma.attendanceSession.findUnique as jest.Mock).mockResolvedValue({
        id: 'session-expired',
        status: AttendanceSessionStatus.expired,
        expiresAt: new Date(Date.now() - 1_000),
      });

      await expect(service.checkin('student-1', { token: 'token' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ForbiddenException when student is not enrolled', async () => {
      redisGetMock.mockResolvedValue(
        JSON.stringify({
          sessionId: 'session-1',
          issuedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 90_000).toISOString(),
        }),
      );
      (prisma.attendanceSession.findUnique as jest.Mock).mockResolvedValue({
        id: 'session-1',
        status: AttendanceSessionStatus.active,
        expiresAt: new Date(Date.now() + 60_000),
        classSectionId: 'section-1',
      });
      (prisma.classEnrollment.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.checkin('student-1', { token: 'token' })).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.attendanceRecord.create).not.toHaveBeenCalled();
    });

    it('throws ALREADY_CHECKED_IN when unique constraint is violated', async () => {
      redisGetMock.mockResolvedValue(
        JSON.stringify({
          sessionId: 'session-1',
          issuedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 90_000).toISOString(),
        }),
      );
      (prisma.attendanceSession.findUnique as jest.Mock).mockResolvedValue({
        id: 'session-1',
        status: AttendanceSessionStatus.active,
        expiresAt: new Date(Date.now() + 60_000),
        classSectionId: 'section-1',
      });
      (prisma.classEnrollment.findFirst as jest.Mock).mockResolvedValue({
        id: 'enrollment-1',
      });
      (prisma.attendanceRecord.create as jest.Mock).mockRejectedValue({
        code: 'P2002',
      });

      await expect(service.checkin('student-1', { token: 'token' })).rejects.toThrow(
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
        service.startSession('lecturer-1', Role.lecturer, {
          classSectionId: 'section-1',
          durationMinutes: 10,
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.attendanceSession.create).not.toHaveBeenCalled();
    });

    it('allows admin to start session for any class section and keep assigned lecturer', async () => {
      const createdSession = {
        id: 'session-1',
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
        status: AttendanceSessionStatus.active,
      };
      (prisma.classSection.findUnique as jest.Mock).mockResolvedValue({
        id: 'section-1',
        lecturerId: 'lecturer-2',
      });
      (prisma.attendanceSession.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.attendanceSession.create as jest.Mock).mockResolvedValue(createdSession);

      await service.startSession('admin-1', Role.admin, {
        classSectionId: 'section-1',
        durationMinutes: 10,
      });

      expect(prisma.attendanceSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            classSectionId: 'section-1',
            lecturerId: 'lecturer-2',
          }),
        }),
      );
    });

    it('falls back to admin actor as session lecturer when class section has no lecturer', async () => {
      const createdSession = {
        id: 'session-2',
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
        status: AttendanceSessionStatus.active,
      };
      (prisma.classSection.findUnique as jest.Mock).mockResolvedValue({
        id: 'section-1',
        lecturerId: null,
      });
      (prisma.attendanceSession.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.attendanceSession.create as jest.Mock).mockResolvedValue(createdSession);

      await service.startSession('admin-1', Role.admin, {
        classSectionId: 'section-1',
        durationMinutes: 10,
      });

      expect(prisma.attendanceSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            classSectionId: 'section-1',
            lecturerId: 'admin-1',
          }),
        }),
      );
    });

    it('rejects canteen_admin role on attendance management actions', async () => {
      await expect(
        service.startSession('canteen-admin-1', Role.canteen_admin, {
          classSectionId: 'section-1',
          durationMinutes: 10,
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.classSection.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('management scope', () => {
    beforeEach(() => {
      (prisma.attendanceSession.findFirst as jest.Mock).mockResolvedValue({ id: 'session-1' });
      (prisma.attendanceRecord.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.attendanceRecord.count as jest.Mock).mockResolvedValue(0);
    });

    it('scopes lecturer session records by lecturerId', async () => {
      await service.getSessionRecords('session-1', 'lecturer-1', Role.lecturer, {
        page: 1,
        limit: 20,
      });

      expect(prisma.attendanceSession.findFirst).toHaveBeenCalledWith({
        where: { id: 'session-1', lecturerId: 'lecturer-1' },
        select: { id: true },
      });
    });

    it('allows admin to query records for any session', async () => {
      await service.getSessionRecords('session-1', 'admin-1', Role.admin, {
        page: 1,
        limit: 20,
      });

      expect(prisma.attendanceSession.findFirst).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        select: { id: true },
      });
    });

    it('returns all class sections for super_admin in management list', async () => {
      (prisma.classSection.findMany as jest.Mock).mockResolvedValue([]);

      await service.getLecturerClassSections('super-admin-1', Role.super_admin);

      expect(prisma.classSection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });
  });

  describe('issueQrToken', () => {
    it('throws ForbiddenException when displayKey is missing', async () => {
      await expect(service.issueQrToken('session-1', '')).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when displayKey does not match Redis', async () => {
      redisGetMock.mockResolvedValue(null);

      await expect(service.issueQrToken('session-1', 'wrong-key')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns token and session meta when displayKey is valid', async () => {
      redisGetMock.mockResolvedValueOnce('good-key');
      (prisma.attendanceSession.findUnique as jest.Mock).mockResolvedValue({
        id: 'session-1',
        status: AttendanceSessionStatus.active,
        expiresAt: new Date(Date.now() + 60_000),
        classSection: {
          classCode: 'SE346',
          sectionCode: '01',
          course: { name: 'Software Engineering' },
        },
      });
      redisSetMock.mockResolvedValue('OK');

      const result = await service.issueQrToken('session-1', 'good-key');

      expect(result.token).toMatch(/^att_/);
      expect(result.session).toEqual({
        classCode: 'SE346',
        sectionCode: '01',
        courseName: 'Software Engineering',
        status: AttendanceSessionStatus.active,
      });
      expect(redisSetMock).toHaveBeenCalled();
    });
  });
});
