import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';

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
            $transaction: jest.fn((operations: unknown[]) => Promise.all(operations)),
            classSection: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            classEnrollment: { findMany: jest.fn() },
            grade: {
              count: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              upsert: jest.fn(),
            },
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

    it('should include current active enrollments even before grades are entered', async () => {
      (prisma.grade.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.classEnrollment.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'enrollment-1',
          studentId: 'user-1',
          classSectionId: 'section-1',
          classSection: {
            id: 'section-1',
            classCode: 'SE346.Q21',
            sectionCode: 'Q21',
            courseId: 'course-1',
            semesterId: 'semester-current',
            course: { code: 'SE346', name: 'Mobile', credits: 4 },
            semester: {
              id: 'semester-current',
              name: 'HK2 2025-2026',
              academicYear: '2025-2026',
              term: 2,
              startDate: new Date('2026-01-05T00:00:00.000Z'),
              endDate: new Date('2026-05-31T23:59:59.000Z'),
              isCurrent: true,
            },
          },
        },
      ]);

      const result = await service.getCurrentSemesterGrades('user-1');

      expect(result).toMatchObject({
        id: 'semester-current',
        isCurrent: true,
        summary: {
          gpa: 0,
          totalCredits: 0,
          totalEarnedCredits: 0,
          totalCourses: 0,
          totalSemesters: 1,
        },
        grades: [
          {
            id: 'enrollment-enrollment-1',
            totalScore: null,
            course: { code: 'SE346', name: 'Mobile', credits: 4 },
            classSection: {
              id: 'section-1',
              classCode: 'SE346.Q21',
              sectionCode: 'Q21',
            },
          },
        ],
      });
    });

    it('should hide current semester grade rows that do not match active enrollments', async () => {
      (prisma.grade.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'mock-grade',
          userId: 'user-1',
          courseId: 'mock-course',
          semesterId: 'semester-current',
          midterm: 9,
          finalExam: 9,
          assignment: 9,
          processScore: 9,
          practiceScore: null,
          midtermScore: 9,
          finalScore: 9,
          totalScore: 9,
          letterGrade: null,
          gradePoint: 9,
          earnedCredits: 3,
          course: { code: 'AI301', name: 'Mock AI', credits: 3 },
          semester: {
            id: 'semester-current',
            name: 'HK2 2025-2026',
            academicYear: '2025-2026',
            term: 2,
            startDate: new Date('2026-01-05T00:00:00.000Z'),
            endDate: new Date('2026-05-31T23:59:59.000Z'),
            isCurrent: true,
          },
        },
        {
          id: 'real-grade',
          userId: 'user-1',
          courseId: 'real-course',
          semesterId: 'semester-current',
          midterm: 8,
          finalExam: 8,
          assignment: 8,
          processScore: 8,
          practiceScore: null,
          midtermScore: 8,
          finalScore: 8,
          totalScore: 8,
          letterGrade: null,
          gradePoint: 8,
          earnedCredits: 4,
          course: { code: 'SE346', name: 'Mobile', credits: 4 },
          semester: {
            id: 'semester-current',
            name: 'HK2 2025-2026',
            academicYear: '2025-2026',
            term: 2,
            startDate: new Date('2026-01-05T00:00:00.000Z'),
            endDate: new Date('2026-05-31T23:59:59.000Z'),
            isCurrent: true,
          },
        },
      ]);
      (prisma.classEnrollment.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'enrollment-1',
          studentId: 'user-1',
          classSectionId: 'section-1',
          classSection: {
            id: 'section-1',
            classCode: 'SE346.Q21',
            sectionCode: 'Q21',
            courseId: 'real-course',
            semesterId: 'semester-current',
            course: { code: 'SE346', name: 'Mobile', credits: 4 },
            semester: {
              id: 'semester-current',
              name: 'HK2 2025-2026',
              academicYear: '2025-2026',
              term: 2,
              startDate: new Date('2026-01-05T00:00:00.000Z'),
              endDate: new Date('2026-05-31T23:59:59.000Z'),
              isCurrent: true,
            },
          },
        },
      ]);

      const result = await service.getCurrentSemesterGrades('user-1');

      expect(result.grades).toHaveLength(1);
      expect(result.grades[0]?.course.code).toBe('SE346');
      expect(result.summary).toMatchObject({
        gpa: 8,
        totalCredits: 4,
        totalEarnedCredits: 4,
        totalCourses: 1,
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

  describe('lecturer grade entry', () => {
    const classSection = {
      id: 'section-1',
      semesterId: 'semester-1',
      courseId: 'course-1',
      lecturerId: 'lecturer-1',
      classCode: 'SE346.Q21',
      sectionCode: 'Q21',
      note: null,
      capacity: 40,
      registrationOpen: true,
      processWeight: 20,
      practiceWeight: 20,
      midtermWeight: 20,
      finalWeight: 40,
      createdAt: new Date(),
      updatedAt: new Date(),
      course: { id: 'course-1', code: 'SE346', name: 'Mobile', credits: 4 },
      semester: {
        id: 'semester-1',
        name: 'HK2 2025-2026',
        academicYear: '2025-2026',
        term: 2,
        isCurrent: true,
      },
    };

    it('rejects a lecturer who is not assigned to the class section', async () => {
      (prisma.classSection.findUnique as jest.Mock).mockResolvedValue({
        ...classSection,
        lecturerId: 'other-lecturer',
      });

      await expect(
        service.getClassSectionGradeSheet('section-1', 'lecturer-1', Role.lecturer),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects grade weights that do not sum to 100', async () => {
      await expect(
        service.updateClassSectionGradeWeights('section-1', 'lecturer-1', Role.lecturer, {
          processWeight: 25,
          practiceWeight: 25,
          midtermWeight: 25,
          finalWeight: 20,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects grade sheet rows for students outside the class section', async () => {
      (prisma.classSection.findUnique as jest.Mock).mockResolvedValue(classSection);
      (prisma.classEnrollment.findMany as jest.Mock).mockResolvedValue([
        { studentId: 'student-1' },
      ]);

      await expect(
        service.upsertClassSectionGradeSheet('section-1', 'lecturer-1', Role.lecturer, {
          rows: [
            {
              studentId: 'student-2',
              processScore: 8,
              practiceScore: 8,
              midtermScore: 8,
              finalScore: 8,
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('bulk upserts grades and calculates weighted total score', async () => {
      (prisma.classSection.findUnique as jest.Mock)
        .mockResolvedValueOnce(classSection)
        .mockResolvedValueOnce(classSection);
      (prisma.classEnrollment.findMany as jest.Mock)
        .mockResolvedValueOnce([{ studentId: 'student-1' }])
        .mockResolvedValueOnce([
          {
            studentId: 'student-1',
            student: {
              id: 'student-1',
              email: 'student@uit.edu.vn',
              firstName: 'An',
              lastName: 'Nguyen',
              studentId: '21520001',
            },
          },
        ]);
      (prisma.grade.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'grade-1',
          userId: 'student-1',
          processScore: 8,
          practiceScore: 9,
          midtermScore: 7,
          finalScore: 8,
          assignment: 8,
          midterm: 7,
          finalExam: 8,
          totalScore: 8,
          letterGrade: null,
          gradePoint: 8,
          earnedCredits: 4,
        },
      ]);
      (prisma.grade.upsert as jest.Mock).mockResolvedValue({ id: 'grade-1' });

      await service.upsertClassSectionGradeSheet('section-1', 'lecturer-1', Role.lecturer, {
        rows: [
          {
            studentId: 'student-1',
            processScore: 8,
            practiceScore: 9,
            midtermScore: 7,
            finalScore: 8,
          },
        ],
      });

      expect(prisma.grade.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            processScore: 8,
            practiceScore: 9,
            midtermScore: 7,
            finalScore: 8,
            totalScore: 8,
            earnedCredits: 4,
          }),
        }),
      );
    });
  });
});
