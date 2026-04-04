import { Test } from '@nestjs/testing';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  const mockProfile = {
    id: 'user-1',
    email: 'test@uit.edu.vn',
    studentId: '22520001',
    firstName: 'Nguyen',
    lastName: 'Van A',
    avatarUrl: null,
    role: 'student',
    faculty: 'SE',
    major: 'Software Engineering',
    yearOfAdmission: 2022,
    phone: null,
    dateOfBirth: null,
    address: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn().mockResolvedValue(mockProfile),
            updateProfile: jest.fn().mockResolvedValue({
              ...mockProfile,
              phone: '0901234567',
            }),
          },
        },
      ],
    }).compile();

    controller = module.get(UsersController);
    usersService = module.get(UsersService);
  });

  describe('getProfile', () => {
    it('should return the current user profile', async () => {
      const result = await controller.getProfile('user-1');

      expect(usersService.findById).toHaveBeenCalledWith('user-1');
      expect(result.email).toBe('test@uit.edu.vn');
    });
  });

  describe('updateProfile', () => {
    it('should update and return updated profile', async () => {
      const dto = { phone: '0901234567' };

      const result = await controller.updateProfile('user-1', dto);

      expect(usersService.updateProfile).toHaveBeenCalledWith('user-1', dto);
      expect(result.phone).toBe('0901234567');
    });
  });
});
