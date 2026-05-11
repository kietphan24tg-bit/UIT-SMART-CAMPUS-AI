import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, Matches } from 'class-validator';

export class PasswordResetVerifyDto {
  @ApiProperty({ example: 'student@gm.uit.edu.vn' })
  @IsEmail({}, { message: 'Email không đúng định dạng.' })
  email!: string;

  @ApiProperty({ example: '123456' })
  @Matches(/^\d{6}$/, { message: 'OTP phải gồm đúng 6 chữ số.' })
  otp!: string;
}
