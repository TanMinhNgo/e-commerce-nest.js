import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, Min, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'OldPassword@123',
    description: 'Current password of the user',
  })
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword: string;

  @ApiProperty({
    example: 'NewPassword@123',
    description:
      'New password for the user (min 6 chars, must contain uppercase, lowercase, number and special character)',
  })
  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/,
    {
      message:
        'New password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
    },
  )
  newPassword: string;
}
