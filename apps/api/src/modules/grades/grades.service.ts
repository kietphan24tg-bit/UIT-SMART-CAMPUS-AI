import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

type LoadedGrade = {
  id: string;
  userId: string;
  courseId: string;
  semesterId: string;
  midterm: number | null;
  finalExam: number | null;
  assignment: number | null;
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
  }>;
};

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

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

  private groupSemesterGrades(grades: LoadedGrade[]): SemesterGradesGroup[] {
    const semestersMap = new Map<
      string,
      {
        semester: LoadedGrade['semester'];
        grades: LoadedGrade[];
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
      });
    }

    return [...semestersMap.values()]
      .map((entry) => ({
        id: entry.semester.id,
        name: entry.semester.name,
        academicYear: entry.semester.academicYear,
        term: entry.semester.term,
        startDate: entry.semester.startDate,
        endDate: entry.semester.endDate,
        isCurrent: entry.semester.isCurrent,
        summary: this.buildSummary(entry.grades),
        grades: [...entry.grades]
          .sort((left, right) => left.course.code.localeCompare(right.course.code))
          .map((grade) => ({
            id: grade.id,
            midterm: grade.midterm,
            finalExam: grade.finalExam,
            assignment: grade.assignment,
            totalScore: grade.totalScore,
            letterGrade: grade.letterGrade,
            gradePoint: grade.gradePoint,
            isExempt: grade.isExempt,
            earnedCredits: grade.earnedCredits,
            course: grade.course,
          })),
      }))
      .sort((left, right) => right.startDate.getTime() - left.startDate.getTime());
  }

  async getAllSemesterGrades(userId: string) {
    const grades = await this.loadGrades(userId);
    return this.groupSemesterGrades(grades);
  }

  async getGradesSummary(userId: string) {
    const grades = await this.loadGrades(userId);

    if (grades.length === 0) {
      return this.emptySummary(0);
    }

    const groupedSemesters = this.groupSemesterGrades(grades);

    return {
      ...this.buildSummary(grades),
      totalSemesters: groupedSemesters.length,
    };
  }

  async getCurrentSemesterGrades(userId: string) {
    const grades = await this.loadGrades(userId);
    const semesters = this.groupSemesterGrades(grades);

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
    const grades = await this.loadGrades(userId);
    const semesters = this.groupSemesterGrades(grades);
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
}
