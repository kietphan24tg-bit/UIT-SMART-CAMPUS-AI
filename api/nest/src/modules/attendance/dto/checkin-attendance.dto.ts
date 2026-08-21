import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CheckinAttendanceDto {
  @ApiProperty({
    description: 'Dynamic QR token',
    example: 'att_xxxxx',
  })
  @IsString()
  token!: string;
}
