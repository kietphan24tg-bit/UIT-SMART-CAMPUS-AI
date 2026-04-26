import { Test } from '@nestjs/testing';

import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

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
            getStudentHistory: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(AttendanceController);
    service = module.get(AttendanceService);
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

    await controller.exportSessionAttendance('session-1', 'lecturer-1', response as never);

    expect(service.exportSessionAttendance).toHaveBeenCalledWith('session-1', 'lecturer-1');
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
