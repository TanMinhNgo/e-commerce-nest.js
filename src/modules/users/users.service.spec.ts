import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'USER',
    password: 'hashedPassword123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserResponse = {
    id: mockUser.id,
    email: mockUser.email,
    firstName: mockUser.firstName,
    lastName: mockUser.lastName,
    role: mockUser.role,
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUserResponse);

      const result = await service.getProfile(mockUser.id);

      expect(result).toEqual(mockUserResponse);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          password: false,
        },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const users = [mockUserResponse];
      mockPrismaService.user.findMany.mockResolvedValue(users);

      const result = await service.getAllUsers();

      expect(result).toEqual(users);
      expect(mockPrismaService.user.findMany).toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUserResponse);

      const result = await service.getUserById(mockUser.id);

      expect(result).toEqual(mockUserResponse);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          password: false,
        },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserById('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUser', () => {
    const updateDto = {
      firstName: 'Jane',
      lastName: 'Smith',
    };

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUserResponse, ...updateDto };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser(mockUser.id, updateDto);

      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: updateDto,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          password: false,
        },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.updateUser('invalid-id', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if email already exists', async () => {
      const updateWithEmail = { email: 'newemail@example.com' };
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({
          id: 'another-id',
          email: 'newemail@example.com',
        });

      await expect(
        service.updateUser(mockUser.id, updateWithEmail),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('changePassword', () => {
    const changePasswordDto = {
      currentPassword: 'Password@123',
      newPassword: 'NewPassword@123',
    };

    it('should change password successfully', async () => {
      const hashedPassword = await bcrypt.hash(
        changePasswordDto.currentPassword,
        12,
      );
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.changePassword(
        mockUser.id,
        changePasswordDto,
      );

      expect(result).toEqual({ message: 'Password changed successfully' });
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword('invalid-id', changePasswordDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if current password is incorrect', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: 'wrongHashedPassword',
      });

      await expect(
        service.changePassword(mockUser.id, changePasswordDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      const result = await service.deleteUser(mockUser.id);

      expect(result).toEqual({ message: 'User deleted successfully' });
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteUser('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
