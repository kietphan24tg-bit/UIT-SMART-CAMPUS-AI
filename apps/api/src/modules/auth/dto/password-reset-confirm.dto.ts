import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, Matches, MinLength } from 'class-validator';

export class PasswordResetConfirmDto {
  @ApiProperty({ example: 'student@gm.uit.edu.vn' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456' })
  @Matches(/^\d{6}$/, { message: 'OTP phải gồm đúng 6 chữ số' })
  otp!: string;

  @ApiProperty({ example: 'Password123' })
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'Mật khẩu phải có ít nhất 8 ký tự, gồm 1 chữ hoa và 1 chữ số',
  })
  newPassword!: string;
}
