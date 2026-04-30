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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { USER_ROLES } from '@smart-campus/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { CreateSystemNotificationDto } from './dto/create-system-notification.dto';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { RemovePushTokenDto } from './dto/remove-push-token.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles(USER_ROLES.LECTURER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Broadcast a system notification' })
  createNotification(
    @Body() dto: CreateSystemNotificationDto,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') actorRole: Role,
  ) {
    return this.notificationsService.createSystemNotifications(
      dto.title,
      dto.body,
      dto.type,
      dto.data,
      dto.audience ?? dto.roles,
      { id: actorId, role: actorRole },
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get notifications' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getNotifications(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationsService.getNotifications(userId, page, limit);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  getUnreadCount(@CurrentUser('id') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification detail' })
  getNotification(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.notificationsService.getNotification(id, userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markAsRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Post('push-token')
  @ApiOperation({ summary: 'Register Expo push token for current user' })
  registerPushToken(@CurrentUser('id') userId: string, @Body() dto: RegisterPushTokenDto) {
    return this.notificationsService.registerPushToken(userId, dto);
  }

  @Delete('push-token')
  @ApiOperation({ summary: 'Remove Expo push token for current user (e.g. on logout)' })
  removePushToken(@CurrentUser('id') userId: string, @Body() dto: RemovePushTokenDto) {
    return this.notificationsService.removePushToken(userId, dto.expoPushToken);
  }
}
