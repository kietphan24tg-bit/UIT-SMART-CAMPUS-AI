import { ApiProperty } from '@nestjs/swagger';

import { EventListItemDto } from './event-list-item.dto';

export class ListEventsResponseDto {
  @ApiProperty({ type: [EventListItemDto] })
  items!: EventListItemDto[];

  @ApiProperty({ nullable: true, description: 'Pass as `cursor` on the next request.' })
  nextCursor!: string | null;

  @ApiProperty()
  hasMore!: boolean;
}
