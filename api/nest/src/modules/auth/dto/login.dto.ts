import { ApiProperty } from '@nestjs/swagger';
import { normalizeEmail } from '@smart-campus/shared';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'student@gm.uit.edu.vn' })
  @Transform(({ value }) => (typeof value === 'string' ? normalizeEmail(value) : value))
  @IsEmail({}, { message: 'Email không đúng định dạng.' })
  email!: string;

  @ApiProperty({ example: 'Password123' })
  @IsString({ message: 'Mật khẩu không hợp lệ.' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự.' })
  password!: string;
}
