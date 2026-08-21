import { ApiProperty } from '@nestjs/swagger';

export class EventListItemDto {
  @ApiProperty({ example: 'uitseminar-worldquant-x-uit-xu-huong-viec-lam-trong-linh-vuc-cntt' })
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({
    example:
      'https://www.uit.edu.vn/bai-viet/uitseminar-worldquant-x-uit-xu-huong-viec-lam-trong-linh-vuc-cntt',
  })
  sourceUrl!: string;

  @ApiProperty({ example: '17-04-2026' })
  dateLabel!: string;

  @ApiProperty()
  excerpt!: string;

  @ApiProperty()
  thumbnailUrl!: string;
}
