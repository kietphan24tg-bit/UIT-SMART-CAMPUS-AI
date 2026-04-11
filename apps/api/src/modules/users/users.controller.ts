import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { USER_ROLES } from '@smart-campus/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AvatarUploadFile } from '../storage/avatar-storage.service';
import { MAX_AVATAR_UPLOAD_SIZE_BYTES } from '../storage/avatar-upload.constants';

import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserActiveDto } from './dto/update-user-active.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UsersService } from './users.service';

const avatarUploadPipe = new ParseFilePipeBuilder()
  .addFileTypeValidator({
    fileType: /^(image\/jpeg|image\/jpg|image\/png|image\/webp)$/,
  })
  .addMaxSizeValidator({
    maxSize: MAX_AVATAR_UPLOAD_SIZE_BYTES,
  })
  .build({
    fileIsRequired: true,
    errorHttpStatusCode: HttpStatus.BAD_REQUEST,
  });

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

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar', { limits: { fileSize: MAX_AVATAR_UPLOAD_SIZE_BYTES } }))
  @ApiOperation({ summary: 'Upload current user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['avatar'],
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile(avatarUploadPipe) file: AvatarUploadFile,
  ) {
    return this.usersService.updateAvatar(userId, file);
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
