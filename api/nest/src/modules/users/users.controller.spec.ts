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
            findAll: jest.fn().mockResolvedValue({
              items: [mockProfile],
              meta: {
                total: 1,
                page: 1,
                limit: 25,
                totalPages: 1,
              },
            }),
            findById: jest.fn().mockResolvedValue(mockProfile),
            updateProfile: jest.fn().mockResolvedValue({
              ...mockProfile,
              phone: '0901234567',
            }),
            updateAvatar: jest.fn().mockResolvedValue({
              ...mockProfile,
              avatarUrl: 'https://cdn.uit.edu.vn/avatars/user-1/avatar.png',
            }),
            updateRole: jest.fn().mockResolvedValue({
              ...mockProfile,
              role: 'admin',
            }),
            updateActive: jest.fn().mockResolvedValue({
              ...mockProfile,
              isActive: false,
            }),
            deleteUser: jest.fn().mockResolvedValue({
              id: 'user-2',
              deleted: true,
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

  describe('getUsers', () => {
    it('should return the user list for admin screens', async () => {
      const result = await controller.getUsers({});

      expect(usersService.findAll).toHaveBeenCalledWith({});
      expect(result.items).toHaveLength(1);
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

  describe('uploadAvatar', () => {
    it('should upload and return updated profile', async () => {
      const file = {
        buffer: Buffer.from('avatar-bytes'),
        mimetype: 'image/png',
        size: 12,
        originalname: 'avatar.png',
      };

      const result = await controller.uploadAvatar('user-1', file as never);

      expect(usersService.updateAvatar).toHaveBeenCalledWith('user-1', file);
      expect(result.avatarUrl).toBe('https://cdn.uit.edu.vn/avatars/user-1/avatar.png');
    });
  });

  describe('updateRole', () => {
    it('should delegate role updates with actor id', async () => {
      const result = await controller.updateRole('user-2', { role: 'admin' }, 'admin-1');

      expect(usersService.updateRole).toHaveBeenCalledWith('user-2', 'admin', 'admin-1');
      expect(result.role).toBe('admin');
    });
  });

  describe('updateActive', () => {
    it('should delegate active state updates with actor id', async () => {
      const result = await controller.updateActive('user-2', { isActive: false }, 'admin-1');

      expect(usersService.updateActive).toHaveBeenCalledWith('user-2', false, 'admin-1');
      expect(result.isActive).toBe(false);
    });
  });

  describe('deleteUser', () => {
    it('should delegate account deletion with actor id', async () => {
      const result = await controller.deleteUser('user-2', 'admin-1');

      expect(usersService.deleteUser).toHaveBeenCalledWith('user-2', 'admin-1');
      expect(result).toEqual({ id: 'user-2', deleted: true });
    });
  });
});
