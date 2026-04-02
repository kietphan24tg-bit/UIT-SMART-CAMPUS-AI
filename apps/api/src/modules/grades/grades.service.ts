import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  async getGrades(userId: string, semesterId?: string) {
    const where: { userId: string; semesterId?: string } = { userId };
    if (semesterId) {
      where.semesterId = semesterId;
    }

    return this.prisma.grade.findMany({
      where,
      include: {
        course: { select: { code: true, name: true, credits: true } },
        semester: { select: { name: true } },
      },
      orderBy: { semester: { startDate: 'desc' } },
    });
  }

  async calculateGPA(userId: string, semesterId?: string) {
    const grades = await this.getGrades(userId, semesterId);

    if (grades.length === 0) {
      return { gpa: 0, totalCredits: 0, totalCourses: 0 };
    }

    let totalPoints = 0;
    let totalCredits = 0;

    for (const grade of grades) {
      if (grade.gradePoint !== null && grade.course.credits) {
        totalPoints += grade.gradePoint * grade.course.credits;
        totalCredits += grade.course.credits;
      }
    }

    return {
      gpa: totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0,
      totalCredits,
      totalCourses: grades.length,
    };
  }
}
