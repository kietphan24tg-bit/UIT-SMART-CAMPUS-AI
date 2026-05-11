import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class PasswordResetRequestDto {
  @ApiProperty({ example: 'student@gm.uit.edu.vn' })
  @IsEmail({}, { message: 'Email không đúng định dạng.' })
  email!: string;
}
