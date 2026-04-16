import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AttendanceSessionStatus } from '@prisma/client';

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
      };
      redisGetMock.mockResolvedValue(
        JSON.stringify({
          sessionId: session.id,
          issuedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 90_000).toISOString(),
        }),
      );
      (prisma.attendanceSession.findUnique as jest.Mock).mockResolvedValue(session);
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
      });
      (prisma.attendanceRecord.create as jest.Mock).mockRejectedValue({
        code: 'P2002',
      });

      await expect(service.checkin('student-1', { token: 'token' })).rejects.toThrow(
        ConflictException,
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
