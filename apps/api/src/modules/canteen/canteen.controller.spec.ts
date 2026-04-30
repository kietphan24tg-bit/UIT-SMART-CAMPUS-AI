import 'reflect-metadata';

import { USER_ROLES } from '@smart-campus/shared';

import { ROLES_KEY } from '../../common/decorators/roles.decorator';

import { CanteenController } from './canteen.controller';

function getMethodRoles(methodName: keyof CanteenController) {
  const descriptor = Object.getOwnPropertyDescriptor(CanteenController.prototype, methodName);
  return Reflect.getMetadata(ROLES_KEY, descriptor?.value as object) as string[] | undefined;
}

describe('CanteenController roles', () => {
  it('allows admin and super_admin on live admin mutations', () => {
    expect(getMethodRoles('completeOrder')).toEqual([
      USER_ROLES.CANTEEN_ADMIN,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN,
    ]);
    expect(getMethodRoles('createCategory')).toEqual([
      USER_ROLES.CANTEEN_ADMIN,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN,
    ]);
    expect(getMethodRoles('updateCategory')).toEqual([
      USER_ROLES.CANTEEN_ADMIN,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN,
    ]);
    expect(getMethodRoles('removeCategory')).toEqual([
      USER_ROLES.CANTEEN_ADMIN,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN,
    ]);
    expect(getMethodRoles('createProduct')).toEqual([
      USER_ROLES.CANTEEN_ADMIN,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN,
    ]);
    expect(getMethodRoles('updateProduct')).toEqual([
      USER_ROLES.CANTEEN_ADMIN,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN,
    ]);
    expect(getMethodRoles('removeProduct')).toEqual([
      USER_ROLES.CANTEEN_ADMIN,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN,
    ]);
  });

  it('keeps student and lecturer in consumer flows only', () => {
    expect(getMethodRoles('createOrder')).toEqual([USER_ROLES.STUDENT, USER_ROLES.LECTURER]);
    expect(getMethodRoles('createPayment')).toEqual([USER_ROLES.STUDENT, USER_ROLES.LECTURER]);
    expect(getMethodRoles('createSepayPayment')).toEqual([USER_ROLES.STUDENT, USER_ROLES.LECTURER]);
  });
});
