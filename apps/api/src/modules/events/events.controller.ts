import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { EventDetailResponseDto } from './dto/event-detail-response.dto';
import { ListEventsQueryDto } from './dto/list-events-query.dto';
import { ListEventsResponseDto } from './dto/list-events-response.dto';
import { EventsService } from './events.service';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({
    summary: 'List UIT student activity articles',
    description:
      'Returns articles scraped from uit.edu.vn/hoat-dong-sinh-vien (cached). Uses page-based pagination.',
  })
  @ApiOkResponse({ type: ListEventsResponseDto })
  list(@Query() query: ListEventsQueryDto): Promise<ListEventsResponseDto> {
    return this.eventsService.listEvents(query.page, query.limit);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Get one article body from UIT',
    description: 'Loads https://www.uit.edu.vn/bai-viet/{slug} and returns `div.rich-text-content` HTML.',
  })
  @ApiParam({ name: 'slug', example: 'uitseminar-worldquant-x-uit-xu-huong-viec-lam-trong-linh-vuc-cntt' })
  @ApiOkResponse({ type: EventDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Article not found or could not be parsed.' })
  detail(@Param('slug') slug: string): Promise<EventDetailResponseDto> {
    return this.eventsService.getArticleBySlug(slug);
  }
}
