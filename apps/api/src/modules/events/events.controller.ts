import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { USER_ROLES } from '@smart-campus/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateEventDto } from './dto/create-event.dto';
import { EventDetailResponseDto } from './dto/event-detail-response.dto';
import { ListEventsQueryDto } from './dto/list-events-query.dto';
import { ListEventsResponseDto } from './dto/list-events-response.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';

@ApiTags('Events')
@Controller('events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({
    summary: 'List events and community activities',
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
    summary: 'Get event detail by slug',
  })
  @ApiParam({ name: 'slug', example: 'hoi-thao-iot-cho-do-an-se346' })
  @ApiOkResponse({ type: EventDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Event not found.' })
  detail(
    @CurrentUser('id') userId: string,
    @Param('slug') slug: string,
  ): Promise<EventDetailResponseDto> {
    return this.eventsService.getArticleBySlug(userId, slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.LECTURER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create event' })
  createEvent(@CurrentUser('id') userId: string, @Body() dto: CreateEventDto) {
    return this.eventsService.createEvent(userId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.LECTURER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiParam({ name: 'id', description: 'Event id' })
  @ApiOperation({ summary: 'Update event' })
  updateEvent(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.updateEvent(eventId, userId, role, dto);
  }

  @Post(':id/register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.STUDENT)
  @ApiParam({ name: 'id', description: 'Event id' })
  @ApiOperation({ summary: 'Register event for current student' })
  register(@Param('id') eventId: string, @CurrentUser('id') userId: string) {
    return this.eventsService.register(eventId, userId);
  }

  @Delete(':id/register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.STUDENT)
  @ApiParam({ name: 'id', description: 'Event id' })
  @ApiOperation({ summary: 'Cancel registration of current student' })
  unregister(@Param('id') eventId: string, @CurrentUser('id') userId: string) {
    return this.eventsService.unregister(eventId, userId);
  }

  @Get(':id/registrations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.LECTURER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiParam({ name: 'id', description: 'Event id' })
  @ApiOperation({ summary: 'Get registrations of an event for owner/admin' })
  getRegistrations(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.eventsService.listRegistrations(eventId, userId, role);
  }
}

