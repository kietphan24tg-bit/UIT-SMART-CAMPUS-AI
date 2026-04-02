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
    message: 'Password must contain at least 1 uppercase letter and 1 number',
  })
  password!: string;

  @ApiProperty({ example: '22520001' })
  @IsString()
  @Matches(/^\d{8}$/, { message: 'Student ID must be 8 digits' })
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
