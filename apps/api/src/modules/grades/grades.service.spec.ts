import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../database/prisma.service';

import { GradesService } from './grades.service';

describe('GradesService', () => {
  let service: GradesService;
  let prisma: jest.Mocked<PrismaService>;

  const mockGrades = [
    {
      id: 'g1',
      userId: 'user-1',
      courseId: 'c1',
      semesterId: 's1',
      midterm: 8,
      finalExam: 7,
      assignment: 9,
      totalScore: 7.8,
      letterGrade: null,
      gradePoint: 7.8,
      earnedCredits: 4,
      course: { code: 'SE346', name: 'IoT', credits: 4 },
      semester: {
        id: 's1',
        name: 'HK2 2024-2025',
        academicYear: '2024-2025',
        term: 2,
        startDate: new Date('2025-01-06T00:00:00.000Z'),
        endDate: new Date('2025-05-31T23:59:59.000Z'),
        isCurrent: false,
      },
    },
    {
      id: 'g2',
      userId: 'user-1',
      courseId: 'c2',
      semesterId: 's1',
      midterm: 9,
      finalExam: 9,
      assignment: 10,
      totalScore: 9.2,
      letterGrade: null,
      gradePoint: 9.2,
      earnedCredits: 3,
      course: { code: 'SE347', name: 'Mobile', credits: 3 },
      semester: {
        id: 's1',
        name: 'HK2 2024-2025',
        academicYear: '2024-2025',
        term: 2,
        startDate: new Date('2025-01-06T00:00:00.000Z'),
        endDate: new Date('2025-05-31T23:59:59.000Z'),
        isCurrent: false,
      },
    },
    {
      id: 'g3',
      userId: 'user-1',
      courseId: 'c3',
      semesterId: 's2',
      midterm: null,
      finalExam: null,
      assignment: null,
      totalScore: null,
      letterGrade: null,
      gradePoint: null,
      earnedCredits: 4,
      course: { code: 'ENG01', name: 'Anh van 1', credits: 4 },
      semester: {
        id: 's2',
        name: 'HK1 2024-2025',
        academicYear: '2024-2025',
        term: 1,
        startDate: new Date('2024-09-09T00:00:00.000Z'),
        endDate: new Date('2024-12-28T23:59:59.000Z'),
        isCurrent: false,
      },
    },
  ];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GradesService,
        {
          provide: PrismaService,
          useValue: {
            grade: { findMany: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get(GradesService);
    prisma = module.get(PrismaService);
  });

  describe('getAllSemesterGrades', () => {
    it('should return all semester grades of the current user', async () => {
      (prisma.grade.findMany as jest.Mock).mockResolvedValue(mockGrades);

      const result = await service.getAllSemesterGrades('user-1');

      expect(prisma.grade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 's1',
        name: 'HK2 2024-2025',
        summary: {
          gpa: 8.4,
          totalCredits: 7,
          totalEarnedCredits: 7,
          totalCourses: 2,
          totalSemesters: 1,
        },
      });
      expect(result[0]?.grades[0]?.course.code).toBe('SE346');
      expect(result[0]?.grades[1]?.course.code).toBe('SE347');
    });
  });

  describe('getGradesSummary', () => {
    it('should return cumulative summary across semesters', async () => {
      (prisma.grade.findMany as jest.Mock).mockResolvedValue(mockGrades);

      const result = await service.getGradesSummary('user-1');

      expect(result).toEqual({
        gpa: 8.4,
        totalCredits: 7,
        totalEarnedCredits: 11,
        totalCourses: 2,
        totalSemesters: 2,
      });
    });

    it('should return zero summary when no grades exist', async () => {
      (prisma.grade.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getGradesSummary('user-1');

      expect(result).toEqual({
        gpa: 0,
        totalCredits: 0,
        totalEarnedCredits: 0,
        totalCourses: 0,
        totalSemesters: 0,
      });
    });
  });

  describe('getCurrentSemesterGrades', () => {
    it('should return the semester marked as current', async () => {
      (prisma.grade.findMany as jest.Mock).mockResolvedValue([
        {
          ...mockGrades[0]!,
          semester: { ...mockGrades[0]!.semester, isCurrent: true },
        },
        {
          ...mockGrades[1]!,
          semester: { ...mockGrades[1]!.semester, isCurrent: true },
        },
        mockGrades[2]!,
      ]);

      const result = await service.getCurrentSemesterGrades('user-1');

      expect(result.id).toBe('s1');
      expect(result.isCurrent).toBe(true);
      expect(result.summary.totalSemesters).toBe(1);
    });

    it('should fallback to the newest semester when no semester is current', async () => {
      (prisma.grade.findMany as jest.Mock).mockResolvedValue(mockGrades);

      const result = await service.getCurrentSemesterGrades('user-1');

      expect(result.id).toBe('s1');
      expect(result.name).toBe('HK2 2024-2025');
    });

    it('should return an empty payload when the user has no grades', async () => {
      (prisma.grade.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getCurrentSemesterGrades('user-1');

      expect(result).toEqual({
        id: '',
        name: '',
        academicYear: '',
        term: 0,
        startDate: '',
        endDate: '',
        isCurrent: false,
        summary: {
          gpa: 0,
          totalCredits: 0,
          totalEarnedCredits: 0,
          totalCourses: 0,
          totalSemesters: 0,
        },
        grades: [],
      });
    });
  });

  describe('getSemesterGradesById', () => {
    it('should return a specific semester by id', async () => {
      (prisma.grade.findMany as jest.Mock).mockResolvedValue(mockGrades);

      const result = await service.getSemesterGradesById('user-1', 's1');

      expect(result).toMatchObject({
        id: 's1',
        name: 'HK2 2024-2025',
      });
      expect(result.summary.totalSemesters).toBe(1);
    });

    it('should throw NotFoundException when semester grades are not found', async () => {
      (prisma.grade.findMany as jest.Mock).mockResolvedValue(mockGrades);

      await expect(service.getSemesterGradesById('user-1', 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
