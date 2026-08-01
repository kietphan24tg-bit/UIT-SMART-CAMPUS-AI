import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, Matches } from 'class-validator';

export class RegistrationOtpVerifyDto {
  @ApiProperty({ example: '9e0df78c-d9e1-43ff-ad1e-3788f07309c6' })
  @IsUUID('4', { message: 'Mã xác thực đăng ký không hợp lệ.' })
  challengeId!: string;

  @ApiProperty({ example: '123456' })
  @Matches(/^\d{6}$/, { message: 'OTP phải gồm đúng 6 chữ số.' })
  otp!: string;
}
