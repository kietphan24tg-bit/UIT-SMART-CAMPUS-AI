import 'reflect-metadata';

import { USER_ROLES } from '@smart-campus/shared';

import { ROLES_KEY } from '../../common/decorators/roles.decorator';

import { AttendanceController } from './attendance.controller';

function getMethodRoles(methodName: keyof AttendanceController) {
  return Reflect.getMetadata(
    ROLES_KEY,
    AttendanceController.prototype[methodName as string],
  ) as string[] | undefined;
}

describe('AttendanceController roles', () => {
  it('opens attendance management endpoints for lecturer/admin/super_admin', () => {
    const managerRoles = [USER_ROLES.LECTURER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN];

    expect(getMethodRoles('startSession')).toEqual(managerRoles);
    expect(getMethodRoles('stopSession')).toEqual(managerRoles);
    expect(getMethodRoles('getSessionRecords')).toEqual(managerRoles);
    expect(getMethodRoles('getHistory')).toEqual(managerRoles);
    expect(getMethodRoles('getLecturerClassSections')).toEqual(managerRoles);
  });

  it('keeps student-only checkin and personal history endpoints', () => {
    expect(getMethodRoles('checkin')).toEqual([USER_ROLES.STUDENT]);
    expect(getMethodRoles('getStudentHistory')).toEqual([USER_ROLES.STUDENT]);
  });
});
