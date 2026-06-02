import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { USER_ROLES } from '@smart-campus/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AvatarUploadFile } from '../storage/avatar-storage.service';
import { MAX_STUDY_MATERIAL_UPLOAD_SIZE_BYTES } from '../storage/avatar-upload.constants';

import {
  CreateStudyMaterialDto,
  ListStudyMaterialsQueryDto,
  UpdateStudyMaterialDto,
} from './dto/study-materials.dto';
import { StudyMaterialsService } from './study-materials.service';

const studyMaterialFilePattern =
  /^(image\/jpeg|image\/jpg|image\/png|image\/webp|application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/;

const requiredStudyMaterialUploadPipe = new ParseFilePipeBuilder()
  .addFileTypeValidator({
    fileType: studyMaterialFilePattern,
  })
  .addMaxSizeValidator({
    maxSize: MAX_STUDY_MATERIAL_UPLOAD_SIZE_BYTES,
  })
  .build({
    fileIsRequired: true,
    errorHttpStatusCode: HttpStatus.BAD_REQUEST,
  });

const optionalStudyMaterialUploadPipe = new ParseFilePipeBuilder()
  .addFileTypeValidator({
    fileType: studyMaterialFilePattern,
  })
  .addMaxSizeValidator({
    maxSize: MAX_STUDY_MATERIAL_UPLOAD_SIZE_BYTES,
  })
  .build({
    fileIsRequired: false,
    errorHttpStatusCode: HttpStatus.BAD_REQUEST,
  });

@ApiTags('Study Materials')
@Controller('study-materials')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StudyMaterialsController {
  constructor(private readonly studyMaterialsService: StudyMaterialsService) {}

  @Get()
  @Roles(USER_ROLES.STUDENT, USER_ROLES.LECTURER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'List study materials' })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  list(
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') actorRole: Role,
    @Query() query: ListStudyMaterialsQueryDto,
  ) {
    return this.studyMaterialsService.list(actorId, actorRole, query);
  }

  @Post()
  @Roles(USER_ROLES.STUDENT, USER_ROLES.LECTURER)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_STUDY_MATERIAL_UPLOAD_SIZE_BYTES } }),
  )
  @ApiOperation({ summary: 'Upload a study material' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['category', 'title', 'file'],
      properties: {
        category: { type: 'string', enum: ['exam', 'textbook', 'other'] },
        title: { type: 'string' },
        description: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  create(
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') actorRole: Role,
    @Body() dto: CreateStudyMaterialDto,
    @UploadedFile(requiredStudyMaterialUploadPipe) file: AvatarUploadFile,
  ) {
    return this.studyMaterialsService.create(actorId, actorRole, dto, file);
  }

  @Patch(':id')
  @Roles(USER_ROLES.STUDENT, USER_ROLES.LECTURER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_STUDY_MATERIAL_UPLOAD_SIZE_BYTES } }),
  )
  @ApiOperation({ summary: 'Update a study material by owner or admin' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['exam', 'textbook', 'other'] },
        title: { type: 'string' },
        description: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  update(
    @Param('id') materialId: string,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') actorRole: Role,
    @Body() dto: UpdateStudyMaterialDto,
    @UploadedFile(optionalStudyMaterialUploadPipe) file?: AvatarUploadFile,
  ) {
    return this.studyMaterialsService.update(materialId, actorId, actorRole, dto, file);
  }

  @Delete(':id')
  @Roles(USER_ROLES.STUDENT, USER_ROLES.LECTURER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a study material by owner or admin' })
  remove(
    @Param('id') materialId: string,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') actorRole: Role,
  ) {
    return this.studyMaterialsService.remove(materialId, actorId, actorRole);
  }
}
