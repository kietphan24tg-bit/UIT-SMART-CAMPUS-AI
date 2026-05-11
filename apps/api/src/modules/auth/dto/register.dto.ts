import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'student@gm.uit.edu.vn' })
  @IsEmail({}, { message: 'Email không đúng định dạng.' })
  email!: string;

  @ApiProperty({ example: 'Password123' })
  @IsString({ message: 'Mật khẩu không hợp lệ.' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự.' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'Mật khẩu phải có ít nhất 8 ký tự, gồm 1 chữ hoa và 1 chữ số.',
  })
  password!: string;

  @ApiProperty({ example: '22520001' })
  @IsString({ message: 'Mã số sinh viên không hợp lệ.' })
  @Matches(/^\d{8}$/, { message: 'Mã số sinh viên phải gồm đúng 8 chữ số.' })
  studentId!: string;

  @ApiProperty({ example: 'Nguyen' })
  @IsString({ message: 'Tên không hợp lệ.' })
  @IsNotEmpty({ message: 'Vui lòng nhập tên.' })
  firstName!: string;

  @ApiProperty({ example: 'Van A' })
  @IsString({ message: 'Họ không hợp lệ.' })
  @IsNotEmpty({ message: 'Vui lòng nhập họ.' })
  lastName!: string;
}
