import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'student@gm.uit.edu.vn' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'Mật khẩu phải có ít nhất 8 ký tự, gồm 1 chữ hoa và 1 chữ số',
  })
  password!: string;

  @ApiProperty({ example: '22520001' })
  @IsString()
  @Matches(/^\d{8}$/, { message: 'Mã số sinh viên phải gồm đúng 8 chữ số' })
  studentId!: string;

  @ApiProperty({ example: 'Nguyen' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Van A' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;
}
