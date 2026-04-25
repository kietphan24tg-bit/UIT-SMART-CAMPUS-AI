import { ApiProperty } from '@nestjs/swagger';

export class EventDetailResponseDto {
  @ApiProperty()
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ description: 'Publication date/time label from the article page.' })
  publishedAtLabel!: string;

  @ApiProperty({ description: 'Summary excerpt for the article.' })
  excerpt!: string;

  @ApiProperty({ description: 'Thumbnail or OG image URL from UIT.', example: 'https://www.uit.edu.vn/media/example.jpg' })
  thumbnailUrl!: string;

  @ApiProperty({ description: 'Main article body HTML (`div.rich-text-content`).' })
  contentHtml!: string;

  @ApiProperty({
    description: 'Original UIT article URL.',
    example: 'https://www.uit.edu.vn/bai-viet/ngon-duoc-xanh-2026-san-choi-cho-em',
  })
  sourceUrl!: string;
}
