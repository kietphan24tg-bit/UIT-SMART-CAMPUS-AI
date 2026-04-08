import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, Matches } from 'class-validator';

export class PasswordResetVerifyDto {
  @ApiProperty({ example: 'student@gm.uit.edu.vn' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456' })
  @Matches(/^\d{6}$/, { message: 'OTP must be 6 digits' })
  otp!: string;
}
