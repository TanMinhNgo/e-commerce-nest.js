import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUsersService = {
    getProfile: jest.fn(),
    getAllUsers: jest.fn(),
    getUserById: jest.fn(),
    updateUser: jest.fn(),
    changePassword: jest.fn(),
    deleteUser: jest.fn(),
  };

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRequest = {
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      mockUsersService.getProfile.mockResolvedValue(mockUser);

      const result = await controller.getProfile(mockRequest as any);

      expect(result).toEqual(mockUser);
      expect(usersService.getProfile).toHaveBeenCalledWith(mockUser.id);
      expect(usersService.getProfile).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const users = [mockUser];
      mockUsersService.getAllUsers.mockResolvedValue(users);

      const result = await controller.getAllUsers();

      expect(result).toEqual(users);
      expect(usersService.getAllUsers).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      mockUsersService.getUserById.mockResolvedValue(mockUser);

      const result = await controller.getUserById(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(usersService.getUserById).toHaveBeenCalledWith(mockUser.id);
      expect(usersService.getUserById).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateUser', () => {
    it('should update user', async () => {
      const updateDto = { firstName: 'Jane' };
      const updatedUser = { ...mockUser, ...updateDto };

      mockUsersService.updateUser.mockResolvedValue(updatedUser);

      const result = await controller.updateUser(mockRequest as any, updateDto);

      expect(result).toEqual(updatedUser);
      expect(usersService.updateUser).toHaveBeenCalledWith(
        mockUser.id,
        updateDto,
      );
      expect(usersService.updateUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('changePassword', () => {
    it('should change password', async () => {
      const changePasswordDto = {
        currentPassword: 'Password@123',
        newPassword: 'NewPassword@123',
      };
      const response = { message: 'Password changed successfully' };

      mockUsersService.changePassword.mockResolvedValue(response);

      const result = await controller.changePassword(
        mockUser.id,
        changePasswordDto,
      );

      expect(result).toEqual(response);
      expect(usersService.changePassword).toHaveBeenCalledWith(
        mockUser.id,
        changePasswordDto,
      );
      expect(usersService.changePassword).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      const response = { message: 'User deleted successfully' };

      mockUsersService.deleteUser.mockResolvedValue(response);

      const result = await controller.deleteUser(mockUser.id);

      expect(result).toEqual(response);
      expect(usersService.deleteUser).toHaveBeenCalledWith(mockUser.id);
      expect(usersService.deleteUser).toHaveBeenCalledTimes(1);
    });
  });
});
