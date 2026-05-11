import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'student@gm.uit.edu.vn' })
  @IsEmail({}, { message: 'Email không đúng định dạng.' })
  email!: string;

  @ApiProperty({ example: 'Password123' })
  @IsString({ message: 'Mật khẩu không hợp lệ.' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự.' })
  password!: string;
}
