import 'reflect-metadata';

import { USER_ROLES } from '@smart-campus/shared';

import { ROLES_KEY } from '../../common/decorators/roles.decorator';

import { StudyMaterialsController } from './study-materials.controller';

function getMethodRoles(methodName: keyof StudyMaterialsController) {
  return Reflect.getMetadata(ROLES_KEY, (StudyMaterialsController.prototype as any)[methodName]) as
    | string[]
    | undefined;
}

describe('StudyMaterialsController roles', () => {
  it('allows student and lecturer to create materials', () => {
    expect(getMethodRoles('create')).toEqual([USER_ROLES.STUDENT, USER_ROLES.LECTURER]);
  });

  it('allows all authenticated academic roles to list materials', () => {
    expect(getMethodRoles('list')).toEqual([
      USER_ROLES.STUDENT,
      USER_ROLES.LECTURER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN,
    ]);
  });

  it('allows owner paths and admin paths on update/delete', () => {
    expect(getMethodRoles('update')).toEqual([
      USER_ROLES.STUDENT,
      USER_ROLES.LECTURER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN,
    ]);
    expect(getMethodRoles('remove')).toEqual([
      USER_ROLES.STUDENT,
      USER_ROLES.LECTURER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN,
    ]);
  });
});
