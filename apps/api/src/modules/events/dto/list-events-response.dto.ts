import { ApiProperty } from '@nestjs/swagger';

import { EventListItemDto } from './event-list-item.dto';

export class ListEventsResponseDto {
  @ApiProperty({ type: [EventListItemDto] })
  items!: EventListItemDto[];

  @ApiProperty({ description: 'Total number of articles in the cached list.' })
  total!: number;

  @ApiProperty({ description: 'Active page after clamping to valid range (1-based).' })
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty({ description: 'Total number of pages for the given limit.' })
  totalPages!: number;
}
