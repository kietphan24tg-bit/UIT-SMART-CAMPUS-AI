import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentStatus, Role } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import type {
  UpdateGradeWeightsDto,
  UpsertGradeSheetDto,
  UpsertGradeSheetRowDto,
} from './dto/lecturer-grade-entry.dto';

type LoadedGrade = {
  id: string;
  userId: string;
  courseId: string;
  semesterId: string;
  midterm: number | null;
  finalExam: number | null;
  assignment: number | null;
  processScore?: number | null;
  practiceScore?: number | null;
  midtermScore?: number | null;
  finalScore?: number | null;
  totalScore: number | null;
  letterGrade: string | null;
  gradePoint: number | null;
  earnedCredits?: number | null;
  isExempt?: boolean;
  course: {
    code: string;
    name: string;
    credits: number;
  };
  semester: {
    id: string;
    name: string;
    academicYear: string;
    term: number;
    startDate: Date;
    endDate: Date;
    isCurrent: boolean;
  };
};

type LoadedEnrollment = {
  id: string;
  studentId: string;
  classSectionId: string;
  classSection: {
    id: string;
    classCode: string;
    sectionCode: string;
    courseId: string;
    semesterId: string;
    course: {
      code: string;
      name: string;
      credits: number;
    };
    semester: {
      id: string;
      name: string;
      academicYear: string;
      term: number;
      startDate: Date;
      endDate: Date;
      isCurrent: boolean;
    };
  };
};

type SemesterGradesGroup = {
  id: string;
  name: string;
  academicYear: string;
  term: number;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  summary: ReturnType<GradesService['buildSummary']>;
  grades: Array<{
    id: string;
    midterm: number | null;
    finalExam: number | null;
    assignment: number | null;
    totalScore: number | null;
    letterGrade: string | null;
    gradePoint: number | null;
    isExempt?: boolean;
    earnedCredits?: number | null;
    course: {
      code: string;
      name: string;
      credits: number;
    };
    classSection?: {
      id: string;
      classCode: string;
      sectionCode: string;
    };
  }>;
};

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly defaultWeights = {
    processWeight: 20,
    practiceWeight: 20,
    midtermWeight: 20,
    finalWeight: 40,
  };

  private emptySummary(totalSemesters = 0) {
    return {
      gpa: 0,
      totalCredits: 0,
      totalEarnedCredits: 0,
      totalCourses: 0,
      totalSemesters,
    };
  }

  private buildSummary(grades: LoadedGrade[]) {
    const gradedCourses = grades.filter((grade) => grade.totalScore !== null);
    const totalCredits = gradedCourses.reduce((sum, grade) => sum + grade.course.credits, 0);
    const totalPoints = gradedCourses.reduce(
      (sum, grade) => sum + (grade.totalScore ?? 0) * grade.course.credits,
      0,
    );
    const totalEarnedCredits = grades.reduce(
      (sum, grade) =>
        sum +
        (grade.earnedCredits ??
          (grade.totalScore !== null && grade.totalScore >= 5 ? grade.course.credits : 0)),
      0,
    );

    return {
      gpa: totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0,
      totalCredits,
      totalEarnedCredits,
      totalCourses: gradedCourses.length,
      totalSemesters: 1,
    };
  }

  private buildGradeKey(courseId: string, semesterId: string) {
    return `${semesterId}:${courseId}`;
  }

  private normalizeGradeRecord(grade: LoadedGrade, enrollment?: LoadedEnrollment) {
    const processScore = grade.processScore ?? grade.assignment;
    const midtermScore = grade.midtermScore ?? grade.midterm;
    const finalScore = grade.finalScore ?? grade.finalExam;

    return {
      id: grade.id,
      midterm: midtermScore,
      finalExam: finalScore,
      assignment: processScore,
      processScore,
      practiceScore: grade.practiceScore ?? null,
      midtermScore,
      finalScore,
      totalScore: grade.totalScore,
      letterGrade: grade.letterGrade,
      gradePoint: grade.gradePoint,
      isExempt: grade.isExempt,
      earnedCredits: grade.earnedCredits,
      course: grade.course,
      ...(enrollment
        ? {
            classSection: {
              id: enrollment.classSection.id,
              classCode: enrollment.classSection.classCode,
              sectionCode: enrollment.classSection.sectionCode,
            },
          }
        : {}),
    };
  }

  private normalizeEnrollmentPlaceholder(enrollment: LoadedEnrollment) {
    return {
      id: `enrollment-${enrollment.id}`,
      midterm: null,
      finalExam: null,
      assignment: null,
      processScore: null,
      practiceScore: null,
      midtermScore: null,
      finalScore: null,
      totalScore: null,
      letterGrade: null,
      gradePoint: null,
      isExempt: false,
      earnedCredits: 0,
      course: enrollment.classSection.course,
      classSection: {
        id: enrollment.classSection.id,
        classCode: enrollment.classSection.classCode,
        sectionCode: enrollment.classSection.sectionCode,
      },
    };
  }

  private async loadGrades(userId: string): Promise<LoadedGrade[]> {
    return (this.prisma.grade.findMany as unknown as (args: unknown) => Promise<LoadedGrade[]>)({
      where: { userId },
      include: {
        course: { select: { code: true, name: true, credits: true } },
        semester: {
          select: {
            id: true,
            name: true,
            academicYear: true,
            term: true,
            startDate: true,
            endDate: true,
            isCurrent: true,
          },
        },
      },
      orderBy: [{ semester: { startDate: 'desc' } }, { course: { code: 'asc' } }],
    });
  }

  private async loadActiveEnrollments(userId: string): Promise<LoadedEnrollment[]> {
    const enrollments = await (
      this.prisma.classEnrollment.findMany as unknown as (
        args: unknown,
      ) => Promise<LoadedEnrollment[] | null | undefined>
    )({
      where: { studentId: userId, status: EnrollmentStatus.active },
      include: {
        classSection: {
          include: {
            course: { select: { code: true, name: true, credits: true } },
            semester: {
              select: {
                id: true,
                name: true,
                academicYear: true,
                term: true,
                startDate: true,
                endDate: true,
                isCurrent: true,
              },
            },
          },
        },
      },
      orderBy: [
        { classSection: { semester: { startDate: 'desc' } } },
        { classSection: { course: { code: 'asc' } } },
      ],
    });

    return enrollments ?? [];
  }

  private groupSemesterGrades(
    grades: LoadedGrade[],
    enrollments: LoadedEnrollment[] = [],
  ): SemesterGradesGroup[] {
    const semestersMap = new Map<
      string,
      {
        semester: LoadedGrade['semester'];
        grades: LoadedGrade[];
        enrollments: LoadedEnrollment[];
      }
    >();

    for (const grade of grades) {
      const existing = semestersMap.get(grade.semester.id);

      if (existing) {
        existing.grades.push(grade);
        continue;
      }

      semestersMap.set(grade.semester.id, {
        semester: grade.semester,
        grades: [grade],
        enrollments: [],
      });
    }

    for (const enrollment of enrollments) {
      const semester = enrollment.classSection.semester;
      const existing = semestersMap.get(semester.id);

      if (existing) {
        existing.enrollments.push(enrollment);
        continue;
      }

      semestersMap.set(semester.id, {
        semester,
        grades: [],
        enrollments: [enrollment],
      });
    }

    return [...semestersMap.values()]
      .map((entry) => {
        const enrollmentByGradeKey = new Map(
          entry.enrollments.map((enrollment) => [
            this.buildGradeKey(
              enrollment.classSection.courseId,
              enrollment.classSection.semesterId,
            ),
            enrollment,
          ]),
        );
        const effectiveGrades =
          entry.semester.isCurrent && enrollmentByGradeKey.size > 0
            ? entry.grades.filter((grade) =>
                enrollmentByGradeKey.has(this.buildGradeKey(grade.courseId, grade.semesterId)),
              )
            : entry.grades;
        const gradeKeys = new Set(
          effectiveGrades.map((grade) => this.buildGradeKey(grade.courseId, grade.semesterId)),
        );
        const enrollmentPlaceholders = entry.enrollments.filter(
          (enrollment) =>
            !gradeKeys.has(
              this.buildGradeKey(
                enrollment.classSection.courseId,
                enrollment.classSection.semesterId,
              ),
            ),
        );

        return {
          id: entry.semester.id,
          name: entry.semester.name,
          academicYear: entry.semester.academicYear,
          term: entry.semester.term,
          startDate: entry.semester.startDate,
          endDate: entry.semester.endDate,
          isCurrent: entry.semester.isCurrent,
          summary: this.buildSummary(effectiveGrades),
          grades: [
            ...effectiveGrades.map((grade) =>
              this.normalizeGradeRecord(
                grade,
                enrollmentByGradeKey.get(this.buildGradeKey(grade.courseId, grade.semesterId)),
              ),
            ),
            ...enrollmentPlaceholders.map((enrollment) =>
              this.normalizeEnrollmentPlaceholder(enrollment),
            ),
          ].sort((left, right) => left.course.code.localeCompare(right.course.code)),
        };
      })
      .sort((left, right) => right.startDate.getTime() - left.startDate.getTime());
  }

  private filterCurrentGradesByEnrollments(grades: LoadedGrade[], enrollments: LoadedEnrollment[]) {
    const currentEnrollmentKeys = new Set(
      enrollments
        .filter((enrollment) => enrollment.classSection.semester.isCurrent)
        .map((enrollment) =>
          this.buildGradeKey(enrollment.classSection.courseId, enrollment.classSection.semesterId),
        ),
    );

    if (currentEnrollmentKeys.size === 0) {
      return grades;
    }

    return grades.filter(
      (grade) =>
        !grade.semester.isCurrent ||
        currentEnrollmentKeys.has(this.buildGradeKey(grade.courseId, grade.semesterId)),
    );
  }

  private canManageAllGrades(role: Role) {
    return role === Role.admin || role === Role.super_admin;
  }

  private assertCanManageGrades(role: Role) {
    if (role !== Role.lecturer && !this.canManageAllGrades(role)) {
      throw new ForbiddenException('You are not allowed to manage grades');
    }
  }

  private assertWeightsValid(weights: UpdateGradeWeightsDto) {
    const total =
      weights.processWeight + weights.practiceWeight + weights.midtermWeight + weights.finalWeight;

    if (total !== 100) {
      throw new BadRequestException('Grade weights must sum to 100');
    }
  }

  private async loadClassSectionForGradeAccess(
    classSectionId: string,
    actorId: string,
    actorRole: Role,
  ) {
    this.assertCanManageGrades(actorRole);
    const classSection = await this.prisma.classSection.findUnique({
      where: { id: classSectionId },
      include: {
        course: { select: { id: true, code: true, name: true, credits: true } },
        semester: {
          select: {
            id: true,
            name: true,
            academicYear: true,
            term: true,
            isCurrent: true,
          },
        },
      },
    });

    if (!classSection) {
      throw new NotFoundException('Class section not found');
    }

    if (
      !this.canManageAllGrades(actorRole) &&
      (!classSection.lecturerId || classSection.lecturerId !== actorId)
    ) {
      throw new ForbiddenException('You are not assigned to this class section');
    }

    return classSection;
  }

  private calculateTotalScore(
    row: Pick<
      UpsertGradeSheetRowDto,
      'processScore' | 'practiceScore' | 'midtermScore' | 'finalScore'
    >,
    weights: UpdateGradeWeightsDto,
  ) {
    const weightedParts = [
      { score: row.processScore, weight: weights.processWeight },
      { score: row.practiceScore, weight: weights.practiceWeight },
      { score: row.midtermScore, weight: weights.midtermWeight },
      { score: row.finalScore, weight: weights.finalWeight },
    ];

    if (weightedParts.some((part) => part.weight > 0 && part.score == null)) {
      return null;
    }

    const total = weightedParts.reduce((sum, part) => sum + (part.score ?? 0) * part.weight, 0);

    return Math.round((total / 100) * 10) / 10;
  }

  async getAllSemesterGrades(userId: string) {
    const [grades, enrollments] = await Promise.all([
      this.loadGrades(userId),
      this.loadActiveEnrollments(userId),
    ]);
    return this.groupSemesterGrades(grades, enrollments);
  }

  async getGradesSummary(userId: string) {
    const [grades, enrollments] = await Promise.all([
      this.loadGrades(userId),
      this.loadActiveEnrollments(userId),
    ]);

    if (grades.length === 0 && enrollments.length === 0) {
      return this.emptySummary(0);
    }

    const groupedSemesters = this.groupSemesterGrades(grades, enrollments);
    const effectiveGrades = this.filterCurrentGradesByEnrollments(grades, enrollments);

    return {
      ...this.buildSummary(effectiveGrades),
      totalSemesters: groupedSemesters.length,
    };
  }

  async getCurrentSemesterGrades(userId: string) {
    const [grades, enrollments] = await Promise.all([
      this.loadGrades(userId),
      this.loadActiveEnrollments(userId),
    ]);
    const semesters = this.groupSemesterGrades(grades, enrollments);

    if (semesters.length === 0) {
      return {
        id: '',
        name: '',
        academicYear: '',
        term: 0,
        startDate: '',
        endDate: '',
        isCurrent: false,
        summary: this.emptySummary(0),
        grades: [],
      };
    }

    const currentSemester = semesters.find((semester) => semester.isCurrent) ?? semesters[0]!;

    return {
      ...currentSemester,
      summary: {
        ...currentSemester.summary,
        totalSemesters: 1,
      },
    };
  }

  async getSemesterGradesById(userId: string, semesterId: string) {
    const [grades, enrollments] = await Promise.all([
      this.loadGrades(userId),
      this.loadActiveEnrollments(userId),
    ]);
    const semesters = this.groupSemesterGrades(grades, enrollments);
    const semester = semesters.find((entry) => entry.id === semesterId);

    if (!semester) {
      throw new NotFoundException('Semester grades not found');
    }

    return {
      ...semester,
      summary: {
        ...semester.summary,
        totalSemesters: 1,
      },
    };
  }

  async getLecturerClassSections(actorId: string, actorRole: Role) {
    this.assertCanManageGrades(actorRole);
    const sections = await this.prisma.classSection.findMany({
      where: this.canManageAllGrades(actorRole) ? undefined : { lecturerId: actorId },
      include: {
        course: { select: { id: true, code: true, name: true, credits: true } },
        semester: {
          select: {
            id: true,
            name: true,
            academicYear: true,
            term: true,
            isCurrent: true,
          },
        },
        meetings: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
        _count: {
          select: {
            enrollments: {
              where: { status: EnrollmentStatus.active },
            },
          },
        },
      },
      orderBy: [{ semester: { startDate: 'desc' } }, { classCode: 'asc' }],
    });

    return Promise.all(
      sections.map(async (section) => {
        const activeEnrollments = await this.prisma.classEnrollment.findMany({
          where: { classSectionId: section.id, status: EnrollmentStatus.active },
          select: { studentId: true },
        });
        const studentIds = activeEnrollments.map((item) => item.studentId);
        const completedCount =
          studentIds.length === 0
            ? 0
            : await this.prisma.grade.count({
                where: {
                  userId: { in: studentIds },
                  courseId: section.courseId,
                  semesterId: section.semesterId,
                  totalScore: { not: null },
                },
              });

        return {
          id: section.id,
          classCode: section.classCode,
          sectionCode: section.sectionCode,
          note: section.note,
          capacity: section.capacity,
          enrolledCount: section._count.enrollments,
          gradedCount: completedCount,
          gradingStatus:
            section._count.enrollments > 0 && completedCount >= section._count.enrollments
              ? 'complete'
              : 'incomplete',
          weights: {
            processWeight: section.processWeight,
            practiceWeight: section.practiceWeight,
            midtermWeight: section.midtermWeight,
            finalWeight: section.finalWeight,
          },
          course: section.course,
          semester: section.semester,
          meetings: section.meetings,
        };
      }),
    );
  }

  async getClassSectionGradeSheet(classSectionId: string, actorId: string, actorRole: Role) {
    const classSection = await this.loadClassSectionForGradeAccess(
      classSectionId,
      actorId,
      actorRole,
    );

    const roster = await this.prisma.classEnrollment.findMany({
      where: { classSectionId, status: EnrollmentStatus.active },
      include: {
        student: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
      },
      orderBy: {
        student: {
          studentId: 'asc',
        },
      },
    });

    const studentIds = roster.map((item) => item.studentId);
    const grades =
      studentIds.length === 0
        ? []
        : await this.prisma.grade.findMany({
            where: {
              userId: { in: studentIds },
              courseId: classSection.courseId,
              semesterId: classSection.semesterId,
            },
          });
    const gradesByStudentId = new Map(grades.map((grade) => [grade.userId, grade]));

    return {
      classSection: {
        id: classSection.id,
        classCode: classSection.classCode,
        sectionCode: classSection.sectionCode,
        capacity: classSection.capacity,
        course: classSection.course,
        semester: classSection.semester,
      },
      weights: {
        processWeight: classSection.processWeight,
        practiceWeight: classSection.practiceWeight,
        midtermWeight: classSection.midtermWeight,
        finalWeight: classSection.finalWeight,
      },
      students: roster.map((enrollment) => {
        const grade = gradesByStudentId.get(enrollment.studentId);
        return {
          id: enrollment.student.id,
          email: enrollment.student.email,
          firstName: enrollment.student.firstName,
          lastName: enrollment.student.lastName,
          studentId: enrollment.student.studentId,
          grade: grade
            ? {
                id: grade.id,
                processScore: grade.processScore ?? grade.assignment,
                practiceScore: grade.practiceScore,
                midtermScore: grade.midtermScore ?? grade.midterm,
                finalScore: grade.finalScore ?? grade.finalExam,
                totalScore: grade.totalScore,
                letterGrade: grade.letterGrade,
                gradePoint: grade.gradePoint,
                earnedCredits: grade.earnedCredits,
              }
            : null,
        };
      }),
    };
  }

  async updateClassSectionGradeWeights(
    classSectionId: string,
    actorId: string,
    actorRole: Role,
    dto: UpdateGradeWeightsDto,
  ) {
    this.assertWeightsValid(dto);
    const classSection = await this.loadClassSectionForGradeAccess(
      classSectionId,
      actorId,
      actorRole,
    );

    await this.prisma.classSection.update({
      where: { id: classSectionId },
      data: {
        processWeight: dto.processWeight,
        practiceWeight: dto.practiceWeight,
        midtermWeight: dto.midtermWeight,
        finalWeight: dto.finalWeight,
      },
    });

    const roster = await this.prisma.classEnrollment.findMany({
      where: { classSectionId, status: EnrollmentStatus.active },
      select: { studentId: true },
    });
    const studentIds = roster.map((item) => item.studentId);
    const grades =
      studentIds.length === 0
        ? []
        : await this.prisma.grade.findMany({
            where: {
              userId: { in: studentIds },
              courseId: classSection.courseId,
              semesterId: classSection.semesterId,
            },
          });

    await this.prisma.$transaction(
      grades.map((grade) => {
        const totalScore = this.calculateTotalScore(
          {
            processScore: grade.processScore ?? grade.assignment,
            practiceScore: grade.practiceScore,
            midtermScore: grade.midtermScore ?? grade.midterm,
            finalScore: grade.finalScore ?? grade.finalExam,
          },
          dto,
        );
        const earnedCredits =
          totalScore !== null && totalScore >= 5 ? classSection.course.credits : 0;

        return this.prisma.grade.update({
          where: { id: grade.id },
          data: {
            totalScore,
            gradePoint: totalScore,
            earnedCredits,
          },
        });
      }),
    );

    return this.getClassSectionGradeSheet(classSectionId, actorId, actorRole);
  }

  async upsertClassSectionGradeSheet(
    classSectionId: string,
    actorId: string,
    actorRole: Role,
    dto: UpsertGradeSheetDto,
  ) {
    const classSection = await this.loadClassSectionForGradeAccess(
      classSectionId,
      actorId,
      actorRole,
    );
    const weights = {
      processWeight: classSection.processWeight ?? this.defaultWeights.processWeight,
      practiceWeight: classSection.practiceWeight ?? this.defaultWeights.practiceWeight,
      midtermWeight: classSection.midtermWeight ?? this.defaultWeights.midtermWeight,
      finalWeight: classSection.finalWeight ?? this.defaultWeights.finalWeight,
    };
    this.assertWeightsValid(weights);

    const enrolled = await this.prisma.classEnrollment.findMany({
      where: { classSectionId, status: EnrollmentStatus.active },
      select: { studentId: true },
    });
    const enrolledStudentIds = new Set(enrolled.map((item) => item.studentId));

    for (const row of dto.rows) {
      if (!enrolledStudentIds.has(row.studentId)) {
        throw new BadRequestException('Grade sheet contains a student outside this class section');
      }
    }

    await this.prisma.$transaction(
      dto.rows.map((row) => {
        const processScore = row.processScore ?? null;
        const practiceScore = row.practiceScore ?? null;
        const midtermScore = row.midtermScore ?? null;
        const finalScore = row.finalScore ?? null;
        const totalScore = this.calculateTotalScore(
          { processScore, practiceScore, midtermScore, finalScore },
          weights,
        );
        const earnedCredits =
          totalScore !== null && totalScore >= 5 ? classSection.course.credits : 0;

        return this.prisma.grade.upsert({
          where: {
            userId_courseId_semesterId: {
              userId: row.studentId,
              courseId: classSection.courseId,
              semesterId: classSection.semesterId,
            },
          },
          update: {
            processScore,
            practiceScore,
            midtermScore,
            finalScore,
            assignment: processScore,
            midterm: midtermScore,
            finalExam: finalScore,
            totalScore,
            gradePoint: totalScore,
            earnedCredits,
          },
          create: {
            userId: row.studentId,
            courseId: classSection.courseId,
            semesterId: classSection.semesterId,
            processScore,
            practiceScore,
            midtermScore,
            finalScore,
            assignment: processScore,
            midterm: midtermScore,
            finalExam: finalScore,
            totalScore,
            gradePoint: totalScore,
            earnedCredits,
          },
        });
      }),
    );

    return this.getClassSectionGradeSheet(classSectionId, actorId, actorRole);
  }
}
