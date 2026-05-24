import 'reflect-metadata';

import { Test } from '@nestjs/testing';
import { USER_ROLES } from '@smart-campus/shared';

import { ROLES_KEY } from '../../common/decorators/roles.decorator';

import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

function getMethodRoles(methodName: keyof AttendanceController) {
  return Reflect.getMetadata(
    ROLES_KEY,
    (AttendanceController.prototype as any)[methodName],
  ) as string[] | undefined;
}

describe('AttendanceController', () => {
  let controller: AttendanceController;
  let service: jest.Mocked<AttendanceService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AttendanceController],
      providers: [
        {
          provide: AttendanceService,
          useValue: {
            startSession: jest.fn(),
            stopSession: jest.fn(),
            issueQrToken: jest.fn(),
            checkin: jest.fn(),
            getSessionRecords: jest.fn(),
            exportSessionAttendance: jest.fn(),
            getHistory: jest.fn(),
            getLecturerClassSections: jest.fn(),
            getClassSectionStudents: jest.fn(),
            getClassSectionSessionSummary: jest.fn(),
            getStudentHistory: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(AttendanceController);
    service = module.get(AttendanceService);
  });

  it('opens attendance management endpoints for lecturer only', () => {
    const managerRoles = [USER_ROLES.LECTURER];

    expect(getMethodRoles('startSession')).toEqual(managerRoles);
    expect(getMethodRoles('stopSession')).toEqual(managerRoles);
    expect(getMethodRoles('getSessionRecords')).toEqual(managerRoles);
    expect(getMethodRoles('exportSessionAttendance')).toEqual(managerRoles);
    expect(getMethodRoles('getHistory')).toEqual(managerRoles);
    expect(getMethodRoles('getLecturerClassSections')).toEqual(managerRoles);
    expect(getMethodRoles('getClassSectionStudents')).toEqual(managerRoles);
    expect(getMethodRoles('getClassSectionSessionSummary')).toEqual(managerRoles);
  });

  it('keeps student-only checkin and personal history endpoints', () => {
    expect(getMethodRoles('checkin')).toEqual([USER_ROLES.STUDENT]);
    expect(getMethodRoles('getStudentHistory')).toEqual([USER_ROLES.STUDENT]);
  });

  it('sets Excel download headers when exporting a session', async () => {
    const response = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    service.exportSessionAttendance.mockResolvedValue({
      fileName: 'attendance-SE346.xlsx',
      buffer: Buffer.from('excel'),
    } as never);

    await controller.exportSessionAttendance(
      'session-1',
      'lecturer-1',
      'lecturer' as never,
      response as never,
    );

    expect(service.exportSessionAttendance).toHaveBeenCalledWith(
      'session-1',
      'lecturer-1',
      'lecturer',
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="attendance-SE346.xlsx"',
    );
    expect(response.send).toHaveBeenCalledWith(Buffer.from('excel'));
  });
});
