import { ApiProperty } from '@nestjs/swagger';

export class RoomAvailabilityDto {
  @ApiProperty({ example: 'B1.02' })
  roomCode!: string;

  @ApiProperty({ example: 60 })
  capacity!: number;

  @ApiProperty({
    example: 'Trống hiện tại',
    enum: ['Trống hiện tại', 'Đang được sử dụng'],
  })
  status!: 'Trống hiện tại' | 'Đang được sử dụng';
}
