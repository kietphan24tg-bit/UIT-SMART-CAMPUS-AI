import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GradeCourseDto {
  @ApiProperty({ example: 'SE346' })
  code!: string;

  @ApiProperty({ example: 'Internet of Things' })
  name!: string;

  @ApiProperty({ example: 4 })
  credits!: number;
}

export class GradesSummaryDto {
  @ApiProperty({ example: 8.4 })
  gpa!: number;

  @ApiProperty({ example: 7 })
  totalCredits!: number;

  @ApiProperty({ example: 11 })
  totalEarnedCredits!: number;

  @ApiProperty({ example: 3 })
  totalCourses!: number;

  @ApiProperty({ example: 2 })
  totalSemesters!: number;
}

export class GradeRecordDto {
  @ApiProperty({ example: 'grade-1' })
  id!: string;

  @ApiPropertyOptional({ example: 8, nullable: true })
  midterm!: number | null;

  @ApiPropertyOptional({ example: 7, nullable: true })
  finalExam!: number | null;

  @ApiPropertyOptional({ example: 9, nullable: true })
  assignment!: number | null;

  @ApiPropertyOptional({ example: 7.8, nullable: true })
  totalScore!: number | null;

  @ApiPropertyOptional({ example: 'B+', nullable: true })
  letterGrade!: string | null;

  @ApiPropertyOptional({ example: 7.8, nullable: true })
  gradePoint!: number | null;

  @ApiPropertyOptional({ example: false })
  isExempt?: boolean;

  @ApiPropertyOptional({ example: 4, nullable: true })
  earnedCredits?: number | null;

  @ApiProperty({ type: () => GradeCourseDto })
  course!: GradeCourseDto;
}

export class SemesterGradesDto {
  @ApiProperty({ example: 'sem-2025-2026-2' })
  id!: string;

  @ApiProperty({ example: 'HK2 2025-2026' })
  name!: string;

  @ApiProperty({ example: '2025-2026' })
  academicYear!: string;

  @ApiProperty({ example: 2 })
  term!: number;

  @ApiProperty({ example: '2026-01-05T00:00:00.000Z' })
  startDate!: string;

  @ApiProperty({ example: '2026-05-31T23:59:59.000Z' })
  endDate!: string;

  @ApiProperty({ example: true })
  isCurrent!: boolean;

  @ApiProperty({ type: () => GradesSummaryDto })
  summary!: GradesSummaryDto;

  @ApiProperty({ type: () => [GradeRecordDto] })
  grades!: GradeRecordDto[];
}
