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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { USER_ROLES } from '@smart-campus/shared';

import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CatalogService } from './catalog.service';
import { CreateClassSectionDto } from './dto/create-class-section.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { ReplaceClassMeetingsDto } from './dto/replace-class-meetings.dto';
import { UpdateClassSectionDto } from './dto/update-class-section.dto';

@ApiTags('Catalog')
@Controller('catalog')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
@ApiBearerAuth()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('semesters')
  @ApiOperation({ summary: 'List semesters for catalog management' })
  listSemesters() {
    return this.catalogService.listSemesters();
  }

  @Get('courses')
  @ApiOperation({ summary: 'List courses for catalog management' })
  listCourses() {
    return this.catalogService.listCourses();
  }

  @Get('lecturers')
  @ApiOperation({ summary: 'List active lecturers' })
  listLecturers() {
    return this.catalogService.listLecturers();
  }

  @Get('class-sections')
  @ApiOperation({ summary: 'List class sections' })
  @ApiQuery({ name: 'semesterId', required: false, type: String })
  listClassSections(@Query('semesterId') semesterId?: string) {
    return this.catalogService.listClassSections(semesterId);
  }

  @Post('courses')
  @ApiOperation({ summary: 'Create or update a course' })
  createCourse(@Body() dto: CreateCourseDto) {
    return this.catalogService.createCourse(dto);
  }

  @Post('class-sections')
  @ApiOperation({ summary: 'Create a class section' })
  createClassSection(@Body() dto: CreateClassSectionDto) {
    return this.catalogService.createClassSection(dto);
  }

  @Patch('class-sections/:id')
  @ApiOperation({ summary: 'Update class section metadata' })
  @ApiParam({ name: 'id', description: 'Class section id' })
  updateClassSection(@Param('id') sectionId: string, @Body() dto: UpdateClassSectionDto) {
    return this.catalogService.updateClassSection(sectionId, dto);
  }

  @Patch('class-sections/:id/meetings')
  @ApiOperation({ summary: 'Replace class section meetings' })
  @ApiParam({ name: 'id', description: 'Class section id' })
  replaceClassMeetings(@Param('id') sectionId: string, @Body() dto: ReplaceClassMeetingsDto) {
    return this.catalogService.replaceClassMeetings(sectionId, dto);
  }
}
