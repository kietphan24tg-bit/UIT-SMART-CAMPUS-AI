import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { CreateSosRequestDto, SosRouteQueryDto } from './dto/sos.dto';
import { SosService } from './sos.service';

@ApiTags('SOS')
@Controller('sos')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SosController {
  constructor(private readonly sosService: SosService) {}

  @Post()
  @ApiOperation({ summary: 'Create SOS request (snapshot location only)' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateSosRequestDto) {
    return this.sosService.createRequest(userId, dto);
  }

  @Get('active')
  @ApiOperation({ summary: 'List active SOS requests' })
  listActive() {
    return this.sosService.listActiveRequests();
  }

  @Get('me')
  @ApiOperation({ summary: 'List current user SOS history' })
  listMine(@CurrentUser('id') userId: string) {
    return this.sosService.listMyRequests(userId);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel my active SOS request' })
  cancel(@CurrentUser('id') userId: string, @Param('id') requestId: string) {
    return this.sosService.cancelRequest(userId, requestId);
  }

  @Patch(':id/resolve')
  @ApiOperation({ summary: 'Resolve SOS request by requester/admin' })
  resolve(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Param('id') requestId: string,
  ) {
    return this.sosService.resolveRequest(userId, role, requestId);
  }

  @Get(':id/route')
  @ApiOperation({ summary: 'Get route from viewer location to SOS location' })
  @ApiQuery({ name: 'fromLat', required: true, type: Number })
  @ApiQuery({ name: 'fromLng', required: true, type: Number })
  route(@Param('id') requestId: string, @Query() query: SosRouteQueryDto) {
    return this.sosService.getRoute(requestId, query.fromLat, query.fromLng);
  }
}
