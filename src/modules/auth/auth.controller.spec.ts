import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshTokens: jest.fn(),
    logout: jest.fn(),
  };

  const mockAuthResponse = {
    accessToken: 'accessToken123',
    refreshToken: 'refreshToken123',
    user: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Password@123',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(authService.register).toHaveBeenCalledTimes(1);
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'Password@123',
      };

      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(authService.login).toHaveBeenCalledTimes(1);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockAuthService.refreshTokens.mockResolvedValue(mockAuthResponse);

      const result = await controller.refresh(userId);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.refreshTokens).toHaveBeenCalledWith(userId);
      expect(authService.refreshTokens).toHaveBeenCalledTimes(1);
    });
  });

  describe('logout', () => {
    it('should logout a user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockAuthService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(userId);

      expect(result).toEqual({ message: 'Successfully logged out' });
      expect(authService.logout).toHaveBeenCalledWith(userId);
      expect(authService.logout).toHaveBeenCalledTimes(1);
    });
  });
});
