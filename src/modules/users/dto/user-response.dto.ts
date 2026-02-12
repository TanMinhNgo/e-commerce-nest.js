import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User unique identifier',
  })
  id: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
    nullable: true,
  })
  firstName: string | null;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
    nullable: true,
  })
  lastName: string | null;

  @ApiProperty({
    enum: Role,
    example: Role.USER,
    description: 'User role',
  })
  role: Role;

  @ApiProperty({
    example: '2024-01-01T12:00:00.000Z',
    description: 'Timestamp when the user was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-06-01T12:00:00.000Z',
    description: 'Timestamp when the user was last updated',
  })
  updatedAt: Date;
}
