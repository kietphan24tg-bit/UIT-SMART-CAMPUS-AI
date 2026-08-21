import { ApiProperty } from '@nestjs/swagger';
import { normalizeEmail, UIT_EMAIL_PATTERN } from '@smart-campus/shared';
import { Transform } from 'class-transformer';
import { IsEmail, Matches } from 'class-validator';

const UIT_EMAIL_MESSAGE = 'Email cần thuộc miền UIT.';

export class PasswordResetRequestDto {
  @ApiProperty({ example: 'student@gm.uit.edu.vn' })
  @Transform(({ value }) => (typeof value === 'string' ? normalizeEmail(value) : value))
  @IsEmail({}, { message: 'Email không đúng định dạng.' })
  @Matches(UIT_EMAIL_PATTERN, { message: UIT_EMAIL_MESSAGE })
  email!: string;
}
