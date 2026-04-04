import { Test } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockTokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn().mockResolvedValue(mockTokens),
            login: jest.fn().mockResolvedValue(mockTokens),
            refreshToken: jest.fn().mockResolvedValue(mockTokens),
            logout: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get(AuthController);
    authService = module.get(AuthService);
  });

  describe('register', () => {
    it('should call authService.register and return tokens', async () => {
      const dto = {
        email: 'test@uit.edu.vn',
        password: 'Password123',
        studentId: '22520001',
        firstName: 'Nguyen',
        lastName: 'Van A',
      };

      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockTokens);
    });
  });

  describe('login', () => {
    it('should call authService.login and return tokens', async () => {
      const dto = { email: 'test@uit.edu.vn', password: 'Password123' };

      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockTokens);
    });
  });

  describe('refresh', () => {
    it('should call authService.refreshToken and return new tokens', async () => {
      const dto = { refreshToken: 'old-refresh-token' };

      const result = await controller.refresh(dto);

      expect(authService.refreshToken).toHaveBeenCalledWith('old-refresh-token');
      expect(result).toEqual(mockTokens);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with userId', async () => {
      await controller.logout('user-1');

      expect(authService.logout).toHaveBeenCalledWith('user-1');
    });
  });
});
