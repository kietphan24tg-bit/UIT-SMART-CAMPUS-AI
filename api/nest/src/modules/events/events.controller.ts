import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { EventDetailResponseDto } from './dto/event-detail-response.dto';
import { ListEventsQueryDto } from './dto/list-events-query.dto';
import { ListEventsResponseDto } from './dto/list-events-response.dto';
import { EventsService } from './events.service';

@ApiTags('Events')
@Controller('events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({
    summary: 'List student activities from the UIT website',
  })
  @ApiOkResponse({ type: ListEventsResponseDto })
  list(
    @CurrentUser('id') userId: string,
    @Query() query: ListEventsQueryDto,
  ): Promise<ListEventsResponseDto> {
    return this.eventsService.listEvents(userId, query.page, query.limit);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Get a UIT student activity article by slug',
  })
  @ApiParam({ name: 'slug', example: 'ngon-duoc-xanh-2026-san-choi-cho-em' })
  @ApiOkResponse({ type: EventDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Không tìm thấy bài viết.' })
  detail(
    @CurrentUser('id') userId: string,
    @Param('slug') slug: string,
  ): Promise<EventDetailResponseDto> {
    return this.eventsService.getArticleBySlug(userId, slug);
  }
}
