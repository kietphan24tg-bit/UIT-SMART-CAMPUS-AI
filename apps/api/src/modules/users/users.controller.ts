import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { USER_ROLES } from '@smart-campus/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserActiveDto } from './dto/update-user-active.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Get()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'List users for administrators' })
  getUsers() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get a user by id for administrators' })
  getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id/role')
  @Roles(USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a user role' })
  updateRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.usersService.updateRole(id, dto.role);
  }

  @Patch(':id/active')
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Enable or disable a user' })
  updateActive(@Param('id') id: string, @Body() dto: UpdateUserActiveDto) {
    return this.usersService.updateActive(id, dto.isActive);
  }
}
