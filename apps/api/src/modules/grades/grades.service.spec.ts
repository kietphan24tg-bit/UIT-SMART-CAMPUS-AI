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
      letterGrade: 'B+',
      gradePoint: 3.5,
      course: { code: 'SE346', name: 'IoT', credits: 4 },
      semester: { name: 'HK2' },
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
      letterGrade: 'A',
      gradePoint: 4.0,
      course: { code: 'SE347', name: 'Mobile', credits: 3 },
      semester: { name: 'HK2' },
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

  describe('getGrades', () => {
    it('should return all grades for a user', async () => {
      (prisma.grade.findMany as jest.Mock).mockResolvedValue(mockGrades);

      const result = await service.getGrades('user-1');

      expect(result).toHaveLength(2);
      expect(prisma.grade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
    });

    it('should filter by semesterId when provided', async () => {
      (prisma.grade.findMany as jest.Mock).mockResolvedValue(mockGrades);

      await service.getGrades('user-1', 's1');

      expect(prisma.grade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', semesterId: 's1' },
        }),
      );
    });
  });

  describe('calculateGPA', () => {
    it('should calculate correct GPA from grades', async () => {
      (prisma.grade.findMany as jest.Mock).mockResolvedValue(mockGrades);

      const result = await service.calculateGPA('user-1');

      // (3.5*4 + 4.0*3) / (4+3) = (14+12)/7 = 26/7 = 3.714... => rounded to 3.71
      expect(result.gpa).toBe(3.71);
      expect(result.totalCredits).toBe(7);
      expect(result.totalCourses).toBe(2);
    });

    it('should return zero GPA when no grades exist', async () => {
      (prisma.grade.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.calculateGPA('user-1');

      expect(result).toEqual({ gpa: 0, totalCredits: 0, totalCourses: 0 });
    });

    it('should ignore grades with null gradePoint', async () => {
      (prisma.grade.findMany as jest.Mock).mockResolvedValue([
        {
          ...mockGrades[0],
          gradePoint: null,
        },
        mockGrades[1],
      ]);

      const result = await service.calculateGPA('user-1');

      expect(result.gpa).toBe(4.0);
      expect(result.totalCredits).toBe(3);
    });
  });
});
