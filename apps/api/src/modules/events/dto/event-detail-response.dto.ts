import { ApiProperty } from '@nestjs/swagger';

export class EventDetailResponseDto {
  @ApiProperty()
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ description: 'Publication date/time label from the article page.' })
  publishedAtLabel!: string;

  @ApiProperty({ description: 'Main article body HTML (`div.rich-text-content`).' })
  contentHtml!: string;
}
