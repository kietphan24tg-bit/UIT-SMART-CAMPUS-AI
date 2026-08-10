import 'reflect-metadata';

import { USER_ROLES } from '@smart-campus/shared';

import { ROLES_KEY } from '../../common/decorators/roles.decorator';

import type { IotService } from './iot.service';
import { SafetyController } from './safety.controller';

type SafetyControllerMethod = 'getFireAlerts' | 'deleteFireAlert' | 'deleteFireAlerts';
type SafetyControllerService = Pick<
  IotService,
  'createFireAlert' | 'listFireAlerts' | 'deleteFireAlert' | 'deleteFireAlerts'
>;

function getMethodRoles(methodName: SafetyControllerMethod) {
  return Reflect.getMetadata(ROLES_KEY, SafetyController.prototype[methodName]) as
    | string[]
    | undefined;
}

describe('SafetyController', () => {
  let controller: SafetyController;
  let iotService: jest.Mocked<SafetyControllerService>;

  beforeEach(() => {
    iotService = {
      createFireAlert: jest.fn(),
      listFireAlerts: jest.fn(),
      deleteFireAlert: jest.fn(),
      deleteFireAlerts: jest.fn(),
    };
    controller = new SafetyController(iotService as unknown as IotService);
  });

  it('restricts fire alert reads and deletes to admin roles', () => {
    const adminRoles = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN];

    expect(getMethodRoles('getFireAlerts')).toEqual(adminRoles);
    expect(getMethodRoles('deleteFireAlert')).toEqual(adminRoles);
    expect(getMethodRoles('deleteFireAlerts')).toEqual(adminRoles);
  });

  it('delegates fire alert delete actions to the IoT service', async () => {
    iotService.deleteFireAlert.mockResolvedValue({ deleted: true });
    iotService.deleteFireAlerts.mockResolvedValue({ count: 2 });

    await expect(controller.deleteFireAlert('fire-1')).resolves.toEqual({ deleted: true });
    await expect(controller.deleteFireAlerts()).resolves.toEqual({ count: 2 });

    expect(iotService.deleteFireAlert).toHaveBeenCalledWith('fire-1');
    expect(iotService.deleteFireAlerts).toHaveBeenCalledWith();
  });
});
