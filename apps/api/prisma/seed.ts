import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { PrismaClient, Role, ScheduleSessionType, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import {
  DEFAULT_PARKING_GATE_ID,
  getActiveParkingSlotNumbers,
} from '../src/modules/parking/parking-slot-layout';

dotenv.config({
  path: existsSync(resolve(process.cwd(), '.env.local')) ? '.env.local' : '.env',
});

const prisma = new PrismaClient();

const semesterSeeds = [
  {
    id: 'sem-2022-2023-1',
    name: 'HK1 2022-2023',
    academicYear: '2022-2023',
    term: 1,
    startDate: new Date('2022-09-05T00:00:00.000Z'),
    endDate: new Date('2022-12-31T23:59:59.000Z'),
    isCurrent: false,
  },
  {
    id: 'sem-2022-2023-2',
    name: 'HK2 2022-2023',
    academicYear: '2022-2023',
    term: 2,
    startDate: new Date('2023-01-09T00:00:00.000Z'),
    endDate: new Date('2023-05-27T23:59:59.000Z'),
    isCurrent: false,
  },
  {
    id: 'sem-2023-2024-1',
    name: 'HK1 2023-2024',
    academicYear: '2023-2024',
    term: 1,
    startDate: new Date('2023-09-11T00:00:00.000Z'),
    endDate: new Date('2024-01-06T23:59:59.000Z'),
    isCurrent: false,
  },
  {
    id: 'sem-2023-2024-2',
    name: 'HK2 2023-2024',
    academicYear: '2023-2024',
    term: 2,
    startDate: new Date('2024-01-08T00:00:00.000Z'),
    endDate: new Date('2024-05-25T23:59:59.000Z'),
    isCurrent: false,
  },
  {
    id: 'sem-2024-2025-1',
    name: 'HK1 2024-2025',
    academicYear: '2024-2025',
    term: 1,
    startDate: new Date('2024-09-09T00:00:00.000Z'),
    endDate: new Date('2024-12-28T23:59:59.000Z'),
    isCurrent: false,
  },
  {
    id: 'sem-2024-2025-2',
    name: 'HK2 2024-2025',
    academicYear: '2024-2025',
    term: 2,
    startDate: new Date('2025-01-06T00:00:00.000Z'),
    endDate: new Date('2025-05-31T23:59:59.000Z'),
    isCurrent: false,
  },
  {
    id: 'sem-2025-2026-1',
    name: 'HK1 2025-2026',
    academicYear: '2025-2026',
    term: 1,
    startDate: new Date('2025-09-08T00:00:00.000Z'),
    endDate: new Date('2026-01-03T23:59:59.000Z'),
    isCurrent: false,
  },
  {
    id: 'sem-2025-2026-2',
    name: 'HK2 2025-2026',
    academicYear: '2025-2026',
    term: 2,
    startDate: new Date('2026-01-05T00:00:00.000Z'),
    endDate: new Date('2026-05-31T23:59:59.000Z'),
    isCurrent: true,
  },
] as const;

const courseSeeds = [
  { code: 'ENG01', name: 'Anh văn 1', credits: 4, faculty: 'Trung tâm Ngoại ngữ' },
  { code: 'ENG02', name: 'Anh văn 2', credits: 4, faculty: 'Trung tâm Ngoại ngữ' },
  { code: 'IT001', name: 'Nhập môn lập trình - VN', credits: 4, faculty: 'Khoa Công nghệ phần mềm' },
  { code: 'IT002', name: 'Lập trình hướng đối tượng', credits: 4, faculty: 'Khoa Công nghệ phần mềm' },
  { code: 'IT003', name: 'Cấu trúc dữ liệu và giải thuật', credits: 4, faculty: 'Khoa Khoa học máy tính' },
  { code: 'IT007', name: 'Hệ điều hành', credits: 4, faculty: 'Khoa Khoa học máy tính' },
  { code: 'IT008', name: 'Lập trình trực quan', credits: 4, faculty: 'Khoa Công nghệ phần mềm' },
  { code: 'MA003', name: 'Đại số tuyến tính - VN', credits: 3, faculty: 'Khoa Toán ứng dụng' },
  { code: 'MA004', name: 'Cấu trúc rời rạc', credits: 4, faculty: 'Khoa Toán ứng dụng' },
  { code: 'MA005', name: 'Xác suất thống kê', credits: 3, faculty: 'Khoa Toán ứng dụng' },
  { code: 'MA006', name: 'Giải tích - VN', credits: 4, faculty: 'Khoa Toán ứng dụng' },
  { code: 'IT012', name: 'Tổ chức và cấu trúc máy tính 2 - VN', credits: 4, faculty: 'Khoa Khoa học máy tính' },
  { code: 'SE005', name: 'Giới thiệu ngành Kỹ thuật phần mềm - VN', credits: 1, faculty: 'Khoa Công nghệ phần mềm' },
  { code: 'SS006', name: 'Pháp luật đại cương', credits: 2, faculty: 'Khoa Lý luận chính trị' },
  { code: 'SS007', name: 'Triết học Mác - Lênin', credits: 3, faculty: 'Khoa Lý luận chính trị' },
  { code: 'SS008', name: 'Kinh tế chính trị Mác - Lênin', credits: 2, faculty: 'Khoa Lý luận chính trị' },
  { code: 'SS009', name: 'Chủ nghĩa xã hội khoa học', credits: 2, faculty: 'Khoa Lý luận chính trị' },
  { code: 'SE104', name: 'Phân tích yêu cầu phần mềm - VN', credits: 4, faculty: 'Khoa Công nghệ phần mềm' },
  { code: 'CS221', name: 'Cấu trúc dữ liệu và giải thuật', credits: 4, faculty: 'Khoa Khoa học máy tính' },
  { code: 'NT213', name: 'Mạng máy tính cơ bản - VN', credits: 4, faculty: 'Khoa Mạng máy tính và truyền thông' },
  { code: 'SS004', name: 'Tư tưởng Hồ Chí Minh - VN', credits: 2, faculty: 'Khoa Lý luận chính trị' },
  { code: 'PE201', name: 'Giáo dục thể chất 1 - VN', credits: 1, faculty: 'Bộ môn Giáo dục thể chất' },
  { code: 'SE346', name: 'Internet of Things', credits: 4, faculty: 'Khoa Công nghệ phần mềm' },
  { code: 'SE347', name: 'Kiểm thử phần mềm - VN', credits: 4, faculty: 'Khoa Công nghệ phần mềm' },
  { code: 'IS252', name: 'Khai phá dữ liệu - VN', credits: 3, faculty: 'Khoa Hệ thống thông tin' },
  { code: 'NT208', name: 'Lập trình mạng căn bản - VN', credits: 4, faculty: 'Khoa Mạng máy tính và truyền thông' },
  { code: 'PE232', name: 'Giáo dục thể chất 2 - VN', credits: 1, faculty: 'Bộ môn Giáo dục thể chất' },
  { code: 'CS312', name: 'Trí tuệ nhân tạo - VN', credits: 3, faculty: 'Khoa Khoa học máy tính' },
  { code: 'IS401', name: 'Quản trị dự án hệ thống thông tin', credits: 3, faculty: 'Khoa Hệ thống thông tin' },
  { code: 'SE334', name: 'Phân tích và thiết kế hệ thống thông tin - VN', credits: 4, faculty: 'Khoa Công nghệ phần mềm' },
  { code: 'AI301', name: 'Machine Learning cơ bản - VN', credits: 3, faculty: 'Khoa Khoa học máy tính' },
  { code: 'LAW200', name: 'Pháp luật đại cương - VN', credits: 2, faculty: 'Khoa Lý luận chính trị' },
  { code: 'DS302', name: 'Trực quan hóa dữ liệu - VN', credits: 3, faculty: 'Khoa Hệ thống thông tin' },
] as const;

interface ScheduleSeed {
  classCode: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startPeriod: number | null;
  endPeriod: number | null;
  sessionType: ScheduleSessionType;
  note?: string;
  room?: string;
  instructor?: string;
}

const scheduleSeedsBySemester: Array<{
  semesterId: (typeof semesterSeeds)[number]['id'];
  items: ScheduleSeed[];
}> = [
  {
    semesterId: 'sem-2022-2023-1',
    items: [
      {
        classCode: 'IT001.P11',
        dayOfWeek: 2,
        startTime: '07:30',
        endTime: '10:00',
        startPeriod: 1,
        endPeriod: 4,
        sessionType: ScheduleSessionType.daytime,
        room: 'B4.420',
        instructor: 'Tran Anh Dung',
      },
      {
        classCode: 'MA003.P14',
        dayOfWeek: 3,
        startTime: '13:00',
        endTime: '15:15',
        startPeriod: 6,
        endPeriod: 8,
        sessionType: ScheduleSessionType.daytime,
        room: 'B4.18',
        instructor: 'Dang Le Thuy',
      },
      {
        classCode: 'SE005.P01',
        dayOfWeek: 6,
        startTime: '09:00',
        endTime: '10:30',
        startPeriod: 3,
        endPeriod: 4,
        sessionType: ScheduleSessionType.daytime,
        room: 'B4.14',
        instructor: 'Dang Viet Dung',
      },
      {
        classCode: 'IT001.P11.1',
        dayOfWeek: 5,
        startTime: '13:00',
        endTime: '15:15',
        startPeriod: 6,
        endPeriod: 8,
        sessionType: ScheduleSessionType.daytime,
        room: 'B2.16',
        instructor: 'Le Tan Trong Khiem',
        note: 'Thực hành phòng máy, cách 2 tuần',
      },
    ],
  },
  {
    semesterId: 'sem-2022-2023-2',
    items: [
      {
        classCode: 'ENG02.P08',
        dayOfWeek: 2,
        startTime: '13:00',
        endTime: '15:15',
        startPeriod: 6,
        endPeriod: 8,
        sessionType: ScheduleSessionType.daytime,
        room: 'A3.15',
        instructor: 'Tat Duong Khanh Linh',
      },
      {
        classCode: 'IT012.P09',
        dayOfWeek: 3,
        startTime: '07:30',
        endTime: '09:45',
        startPeriod: 1,
        endPeriod: 3,
        sessionType: ScheduleSessionType.daytime,
        room: 'B6.08',
        instructor: 'Tran Thi Diem',
      },
      {
        classCode: 'IT002.P21',
        dayOfWeek: 4,
        startTime: '13:00',
        endTime: '15:15',
        startPeriod: 6,
        endPeriod: 8,
        sessionType: ScheduleSessionType.daytime,
        room: 'B3.11',
        instructor: 'Nguyen Huu Khang',
      },
      {
        classCode: 'MA004.P15',
        dayOfWeek: 5,
        startTime: '07:30',
        endTime: '10:00',
        startPeriod: 1,
        endPeriod: 4,
        sessionType: ScheduleSessionType.daytime,
        room: 'C1.106',
        instructor: 'Pham Thi Lan',
      },
      {
        classCode: 'SS006.P03',
        dayOfWeek: 6,
        startTime: '09:00',
        endTime: '11:30',
        startPeriod: 3,
        endPeriod: 5,
        sessionType: ScheduleSessionType.daytime,
        room: 'A2.101',
        instructor: 'Vo Minh Tam',
      },
      {
        classCode: 'IT012.P09.1',
        dayOfWeek: 5,
        startTime: '17:45',
        endTime: '20:45',
        startPeriod: null,
        endPeriod: null,
        sessionType: ScheduleSessionType.evening,
        room: 'LAB.CS-01',
        instructor: 'Tran Thi Diem',
        note: 'Buổi thực hành phần cứng',
      },
    ],
  },
  {
    semesterId: 'sem-2023-2024-1',
    items: [
      {
        classCode: 'MA006.P17',
        dayOfWeek: 2,
        startTime: '07:30',
        endTime: '10:00',
        startPeriod: 1,
        endPeriod: 4,
        sessionType: ScheduleSessionType.daytime,
        room: 'B4.320',
        instructor: 'Nguyen Minh Tri',
      },
      {
        classCode: 'IT003.P12',
        dayOfWeek: 3,
        startTime: '13:00',
        endTime: '15:15',
        startPeriod: 6,
        endPeriod: 8,
        sessionType: ScheduleSessionType.daytime,
        room: 'B1.203',
        instructor: 'Pham Duc Long',
      },
      {
        classCode: 'SS007.P07',
        dayOfWeek: 4,
        startTime: '09:00',
        endTime: '11:30',
        startPeriod: 3,
        endPeriod: 5,
        sessionType: ScheduleSessionType.daytime,
        room: 'A2.103',
        instructor: 'Le Trung Kien',
      },
      {
        classCode: 'PE201.P02',
        dayOfWeek: 6,
        startTime: '13:00',
        endTime: '15:15',
        startPeriod: 6,
        endPeriod: 8,
        sessionType: ScheduleSessionType.daytime,
        room: 'San TDTT 1',
        instructor: 'Tran Cong Hau',
      },
      {
        classCode: 'IT003.P12.1',
        dayOfWeek: 5,
        startTime: '17:45',
        endTime: '20:45',
        startPeriod: null,
        endPeriod: null,
        sessionType: ScheduleSessionType.evening,
        room: 'LAB.CS-02',
        instructor: 'Pham Duc Long',
        note: 'Lab thuật toán cơ bản',
      },
    ],
  },
  {
    semesterId: 'sem-2023-2024-2',
    items: [
      {
        classCode: 'MA005.P11',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '11:30',
        startPeriod: 3,
        endPeriod: 5,
        sessionType: ScheduleSessionType.daytime,
        room: 'C1.109',
        instructor: 'Huynh Quoc Thai',
      },
      {
        classCode: 'NT213.P11',
        dayOfWeek: 3,
        startTime: '13:00',
        endTime: '15:15',
        startPeriod: 6,
        endPeriod: 8,
        sessionType: ScheduleSessionType.daytime,
        room: 'PM1.102',
        instructor: 'Tran Quoc Bao',
      },
      {
        classCode: 'SS004.P18',
        dayOfWeek: 4,
        startTime: '09:00',
        endTime: '11:30',
        startPeriod: 3,
        endPeriod: 5,
        sessionType: ScheduleSessionType.daytime,
        room: 'A2.101',
        instructor: 'Vo Minh Tam',
      },
      {
        classCode: 'SE104.P21',
        dayOfWeek: 5,
        startTime: '07:30',
        endTime: '10:00',
        startPeriod: 1,
        endPeriod: 4,
        sessionType: ScheduleSessionType.daytime,
        room: 'E1.204',
        instructor: 'Do Thanh Phuong',
      },
      {
        classCode: 'SE104.P21.1',
        dayOfWeek: 2,
        startTime: '17:45',
        endTime: '20:45',
        startPeriod: null,
        endPeriod: null,
        sessionType: ScheduleSessionType.evening,
        room: 'LAB.SE-01',
        instructor: 'Do Thanh Phuong',
        note: 'Workshop phân tích yêu cầu',
      },
    ],
  },
  {
    semesterId: 'sem-2024-2025-1',
    items: [
      {
        classCode: 'CS221.P12',
        dayOfWeek: 2,
        startTime: '07:30',
        endTime: '10:00',
        startPeriod: 1,
        endPeriod: 4,
        sessionType: ScheduleSessionType.daytime,
        room: 'B1.203',
        instructor: 'Pham Duc Long',
      },
      {
        classCode: 'IT007.P16',
        dayOfWeek: 4,
        startTime: '07:30',
        endTime: '10:00',
        startPeriod: 1,
        endPeriod: 4,
        sessionType: ScheduleSessionType.daytime,
        room: 'B2.12',
        instructor: 'Nguyen Van Binh',
      },
      {
        classCode: 'SS008.P04',
        dayOfWeek: 5,
        startTime: '09:00',
        endTime: '11:30',
        startPeriod: 3,
        endPeriod: 5,
        sessionType: ScheduleSessionType.daytime,
        room: 'A2.104',
        instructor: 'Le Trung Kien',
      },
      {
        classCode: 'PE232.P03',
        dayOfWeek: 6,
        startTime: '13:00',
        endTime: '15:15',
        startPeriod: 6,
        endPeriod: 8,
        sessionType: ScheduleSessionType.daytime,
        room: 'San TDTT 2',
        instructor: 'Tran Cong Hau',
      },
      {
        classCode: 'CS221.P12.1',
        dayOfWeek: 5,
        startTime: '17:45',
        endTime: '20:45',
        startPeriod: null,
        endPeriod: null,
        sessionType: ScheduleSessionType.evening,
        room: 'LAB.CS-02',
        instructor: 'Pham Duc Long',
        note: 'Lab cấu trúc dữ liệu',
      },
    ],
  },
  {
    semesterId: 'sem-2024-2025-2',
    items: [
      {
        classCode: 'SE346.Q22',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '11:30',
        startPeriod: 3,
        endPeriod: 5,
        sessionType: ScheduleSessionType.daytime,
        room: 'E4.1',
        instructor: 'Le Minh Quan',
      },
      {
        classCode: 'SE347.Q11',
        dayOfWeek: 2,
        startTime: '07:30',
        endTime: '10:00',
        startPeriod: 1,
        endPeriod: 4,
        sessionType: ScheduleSessionType.daytime,
        room: 'A2.305',
        instructor: 'Nguyen Hoang Phuc',
      },
      {
        classCode: 'IS252.Q15',
        dayOfWeek: 4,
        startTime: '07:30',
        endTime: '10:00',
        startPeriod: 1,
        endPeriod: 4,
        sessionType: ScheduleSessionType.daytime,
        room: 'C1.107',
        instructor: 'Vo Ngoc Hung',
      },
      {
        classCode: 'NT208.Q13',
        dayOfWeek: 3,
        startTime: '13:00',
        endTime: '15:15',
        startPeriod: 6,
        endPeriod: 8,
        sessionType: ScheduleSessionType.daytime,
        room: 'PM1.102',
        instructor: 'Tran Quoc Bao',
      },
      {
        classCode: 'SE347.Q11.1',
        dayOfWeek: 2,
        startTime: '17:45',
        endTime: '20:45',
        startPeriod: null,
        endPeriod: null,
        sessionType: ScheduleSessionType.evening,
        room: 'LAB.GCS-02',
        instructor: 'Le Minh Quan',
        note: 'Lab tăng cường',
      },
      {
        classCode: 'NT208.Q13.1',
        dayOfWeek: 4,
        startTime: '17:45',
        endTime: '20:45',
        startPeriod: null,
        endPeriod: null,
        sessionType: ScheduleSessionType.evening,
        room: 'LAB.NET-01',
        instructor: 'Tran Quoc Bao',
        note: 'Thực hành mạng',
      },
    ],
  },
  {
    semesterId: 'sem-2025-2026-1',
    items: [
      {
        classCode: 'IT008.Q09',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '11:30',
        startPeriod: 3,
        endPeriod: 5,
        sessionType: ScheduleSessionType.daytime,
        room: 'PM2.202',
        instructor: 'Le Thanh Son',
      },
      {
        classCode: 'SS009.Q05',
        dayOfWeek: 2,
        startTime: '07:30',
        endTime: '10:00',
        startPeriod: 1,
        endPeriod: 4,
        sessionType: ScheduleSessionType.daytime,
        room: 'A2.105',
        instructor: 'Nguyen Thi Hanh',
      },
      {
        classCode: 'IS401.Q31',
        dayOfWeek: 3,
        startTime: '13:00',
        endTime: '15:15',
        startPeriod: 6,
        endPeriod: 8,
        sessionType: ScheduleSessionType.daytime,
        room: 'E2.201',
        instructor: 'Nguyen Bao Chau',
      },
      {
        classCode: 'LAW200.Q16',
        dayOfWeek: 5,
        startTime: '09:00',
        endTime: '10:30',
        startPeriod: 3,
        endPeriod: 4,
        sessionType: ScheduleSessionType.daytime,
        room: 'A3.101',
        instructor: 'Do Thi Nha',
      },
      {
        classCode: 'IT008.Q09.1',
        dayOfWeek: 2,
        startTime: '17:45',
        endTime: '20:45',
        startPeriod: null,
        endPeriod: null,
        sessionType: ScheduleSessionType.evening,
        room: 'LAB.UI-01',
        instructor: 'Le Thanh Son',
        note: 'Thực hành desktop app',
      },
    ],
  },
  {
    semesterId: 'sem-2025-2026-2',
    items: [
      {
        classCode: 'CS312.Q14',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '11:30',
        startPeriod: 3,
        endPeriod: 5,
        sessionType: ScheduleSessionType.daytime,
        room: 'B1.203',
        instructor: 'Pham Thu Ha',
      },
      {
        classCode: 'SE334.Q12',
        dayOfWeek: 2,
        startTime: '07:30',
        endTime: '10:00',
        startPeriod: 1,
        endPeriod: 4,
        sessionType: ScheduleSessionType.daytime,
        room: 'A2.305',
        instructor: 'Nguyen Hoang Phuc',
      },
      {
        classCode: 'AI301.Q11',
        dayOfWeek: 3,
        startTime: '13:00',
        endTime: '15:15',
        startPeriod: 6,
        endPeriod: 8,
        sessionType: ScheduleSessionType.daytime,
        room: 'PM2.201',
        instructor: 'Le Thanh Son',
      },
      {
        classCode: 'DS302.Q21',
        dayOfWeek: 4,
        startTime: '09:00',
        endTime: '11:30',
        startPeriod: 3,
        endPeriod: 5,
        sessionType: ScheduleSessionType.daytime,
        room: 'E3.3',
        instructor: 'Vo Ngoc Hung',
      },
      {
        classCode: 'CS312.Q14.1',
        dayOfWeek: 5,
        startTime: '17:45',
        endTime: '20:45',
        startPeriod: null,
        endPeriod: null,
        sessionType: ScheduleSessionType.evening,
        room: 'LAB.AI-01',
        instructor: 'Pham Thu Ha',
        note: 'Lab thuật toán thông minh',
      },
      {
        classCode: 'AI301.Q11.1',
        dayOfWeek: 6,
        startTime: '17:45',
        endTime: '20:45',
        startPeriod: null,
        endPeriod: null,
        sessionType: ScheduleSessionType.evening,
        room: 'LAB.DATA-02',
        instructor: 'Le Thanh Son',
        note: 'Chuyên đề mô hình dự đoán',
      },
    ],
  },
] as const;

interface GradeSeed {
  courseCode: string;
  assignment?: number | null;
  midterm?: number | null;
  finalExam?: number | null;
  totalScore?: number | null;
  isExempt?: boolean;
  earnedCredits?: number;
}

const gradeSeedsBySemester: Array<{
  semesterId: (typeof semesterSeeds)[number]['id'];
  items: GradeSeed[];
}> = [
  {
    semesterId: 'sem-2022-2023-1',
    items: [
      {
        courseCode: 'ENG02',
        isExempt: true,
        earnedCredits: 4,
      },
      {
        courseCode: 'IT002',
        assignment: 8.1,
        midterm: 7.4,
        finalExam: 7.9,
        totalScore: 7.8,
        earnedCredits: 4,
      },
      {
        courseCode: 'MA004',
        assignment: 7.2,
        midterm: 6.8,
        finalExam: 6.7,
        totalScore: 6.9,
        earnedCredits: 4,
      },
      {
        courseCode: 'PE201',
        midterm: 8.7,
        finalExam: 9,
        totalScore: 8.8,
        earnedCredits: 1,
      },
    ],
  },
  {
    semesterId: 'sem-2022-2023-2',
    items: [
      {
        courseCode: 'MA003',
        midterm: 7.1,
        totalScore: 7.1,
        earnedCredits: 3,
      },
      {
        courseCode: 'IT003',
        assignment: 7.8,
        midterm: 7.5,
        finalExam: 7.2,
        totalScore: 7.5,
        earnedCredits: 4,
      },
      {
        courseCode: 'MA006',
        assignment: 8.4,
        midterm: 8,
        finalExam: 7.7,
        totalScore: 8,
        earnedCredits: 4,
      },
      {
        courseCode: 'SS007',
        assignment: 8.9,
        midterm: 7.8,
        finalExam: 8.2,
        totalScore: 8.3,
        earnedCredits: 3,
      },
      {
        courseCode: 'SS008',
        assignment: 6.8,
        finalExam: 6.1,
        totalScore: 6.4,
        earnedCredits: 2,
      },
    ],
  },
  {
    semesterId: 'sem-2023-2024-1',
    items: [
      {
        courseCode: 'IT012',
        assignment: 7.6,
        midterm: 8,
        finalExam: 8.3,
        totalScore: 8,
        earnedCredits: 4,
      },
      {
        courseCode: 'SE104',
        assignment: 7.2,
        midterm: 7.9,
        finalExam: 6.8,
        totalScore: 7.2,
        earnedCredits: 4,
      },
      {
        courseCode: 'PE232',
        assignment: 8.5,
        finalExam: 8.2,
        totalScore: 8.3,
        earnedCredits: 1,
      },
      {
        courseCode: 'SS004',
        midterm: 7.4,
        finalExam: 7.8,
        totalScore: 7.6,
        earnedCredits: 2,
      },
    ],
  },
  {
    semesterId: 'sem-2023-2024-2',
    items: [
      {
        courseCode: 'IT007',
        assignment: 8.1,
        midterm: 7.3,
        finalExam: 7.6,
        totalScore: 7.7,
        earnedCredits: 4,
      },
      {
        courseCode: 'CS221',
        assignment: 6.9,
        midterm: 7.5,
        finalExam: 7.2,
        totalScore: 7.2,
        earnedCredits: 4,
      },
      {
        courseCode: 'SS006',
        assignment: 7.8,
        midterm: 7,
        finalExam: 7.4,
        totalScore: 7.4,
        earnedCredits: 2,
      },
      {
        courseCode: 'IT008',
        assignment: 8.4,
        midterm: 7.9,
        finalExam: 8.2,
        totalScore: 8.2,
        earnedCredits: 4,
      },
    ],
  },
  {
    semesterId: 'sem-2024-2025-1',
    items: [
      {
        courseCode: 'CS221',
        assignment: 7.8,
        midterm: 7.4,
        finalExam: 7.6,
        totalScore: 7.6,
        earnedCredits: 4,
      },
      {
        courseCode: 'IT007',
        assignment: 7.5,
        midterm: 7.1,
        finalExam: 7.3,
        totalScore: 7.3,
        earnedCredits: 4,
      },
      {
        courseCode: 'SS008',
        assignment: 8.2,
        finalExam: 7.9,
        totalScore: 8,
        earnedCredits: 2,
      },
      {
        courseCode: 'PE232',
        midterm: 8.9,
        finalExam: 9.1,
        totalScore: 9,
        earnedCredits: 1,
      },
    ],
  },
  {
    semesterId: 'sem-2024-2025-2',
    items: [
      {
        courseCode: 'SE346',
        assignment: 8.1,
        midterm: 7.8,
        finalExam: 8,
        totalScore: 8,
        earnedCredits: 4,
      },
      {
        courseCode: 'SE347',
        assignment: 7.7,
        midterm: 7.4,
        finalExam: 7.5,
        totalScore: 7.5,
        earnedCredits: 4,
      },
      {
        courseCode: 'IS252',
        assignment: 8,
        midterm: 7.2,
        finalExam: 7.8,
        totalScore: 7.7,
        earnedCredits: 3,
      },
      {
        courseCode: 'NT208',
        assignment: 8.3,
        midterm: 7.9,
        finalExam: 8,
        totalScore: 8,
        earnedCredits: 4,
      },
    ],
  },
  {
    semesterId: 'sem-2025-2026-1',
    items: [
      {
        courseCode: 'IT008',
        assignment: 8.4,
        midterm: 8,
        finalExam: 8.1,
        totalScore: 8.1,
        earnedCredits: 4,
      },
      {
        courseCode: 'SS009',
        assignment: 7.6,
        finalExam: 7.8,
        totalScore: 7.7,
        earnedCredits: 2,
      },
      {
        courseCode: 'IS401',
        assignment: 8.5,
        midterm: 8.1,
        finalExam: 8.3,
        totalScore: 8.3,
        earnedCredits: 3,
      },
      {
        courseCode: 'LAW200',
        assignment: 8.7,
        finalExam: 8.4,
        totalScore: 8.5,
        earnedCredits: 2,
      },
    ],
  },
  {
    semesterId: 'sem-2025-2026-2',
    items: [
      {
        courseCode: 'CS312',
        assignment: 8.3,
        midterm: 7.8,
        finalExam: 8,
        totalScore: 8,
        earnedCredits: 3,
      },
      {
        courseCode: 'SE334',
        assignment: 8.1,
        midterm: 7.7,
        finalExam: 7.9,
        totalScore: 7.9,
        earnedCredits: 4,
      },
      {
        courseCode: 'AI301',
        assignment: 8.6,
        midterm: 8.2,
        finalExam: 8.1,
        totalScore: 8.2,
        earnedCredits: 3,
      },
      {
        courseCode: 'DS302',
        assignment: 8.8,
        midterm: 8.1,
        finalExam: 8.4,
        totalScore: 8.4,
        earnedCredits: 3,
      },
    ],
  },
] as const;

function parseClassCode(classCode: string) {
  const [courseCode, ...sectionParts] = classCode.split('.');

  if (!courseCode) {
    throw new Error(`Invalid class code: ${classCode}`);
  }

  return {
    courseCode,
    sectionCode: sectionParts.join('.'),
  };
}

async function main() {
  const passwordHash = await bcrypt.hash('Password123', 10);

  const [superAdmin, admin, lecturer, student] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'superadmin@uit.edu.vn' },
      update: {
        passwordHash,
        isActive: true,
      },
      create: {
        email: 'superadmin@uit.edu.vn',
        passwordHash,
        firstName: 'Super',
        lastName: 'Admin',
        role: Role.super_admin,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'admin@uit.edu.vn' },
      update: {
        passwordHash,
        isActive: true,
      },
      create: {
        email: 'admin@uit.edu.vn',
        passwordHash,
        firstName: 'Admin',
        lastName: 'System',
        role: Role.admin,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'lecturer@uit.edu.vn' },
      update: {
        passwordHash,
        isActive: true,
      },
      create: {
        email: 'lecturer@uit.edu.vn',
        passwordHash,
        firstName: 'Giảng',
        lastName: 'Viên',
        role: Role.lecturer,
        faculty: 'Khoa Công nghệ thông tin',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'student@gm.uit.edu.vn' },
      update: {
        passwordHash,
        studentId: '22520001',
        firstName: 'Nguyen',
        lastName: 'Van A',
        role: Role.student,
        faculty: 'Khoa Công nghệ Phần mềm',
        major: 'Công nghệ phần mềm',
        yearOfAdmission: 2022,
        isActive: true,
      },
      create: {
        email: 'student@gm.uit.edu.vn',
        passwordHash,
        studentId: '22520001',
        firstName: 'Nguyen',
        lastName: 'Van A',
        role: Role.student,
        faculty: 'Khoa Công nghệ Phần mềm',
        major: 'Công nghệ phần mềm',
        yearOfAdmission: 2022,
        isActive: true,
      },
    }),
  ]);

  await prisma.semester.updateMany({
    data: { isCurrent: false },
  });

  const semesters = new Map<string, Awaited<ReturnType<typeof prisma.semester.upsert>>>();

  for (const semesterSeed of semesterSeeds) {
    const semester = await prisma.semester.upsert({
      where: { id: semesterSeed.id },
      update: {
        name: semesterSeed.name,
        academicYear: semesterSeed.academicYear,
        term: semesterSeed.term,
        startDate: semesterSeed.startDate,
        endDate: semesterSeed.endDate,
        isCurrent: semesterSeed.isCurrent,
      },
      create: semesterSeed,
    });

    semesters.set(semester.id, semester);
  }

  const courses = new Map<string, Awaited<ReturnType<typeof prisma.course.upsert>>>();

  for (const courseSeed of courseSeeds) {
    const course = await prisma.course.upsert({
      where: { code: courseSeed.code },
      update: {
        name: courseSeed.name,
        credits: courseSeed.credits,
        faculty: courseSeed.faculty,
      },
      create: {
        code: courseSeed.code,
        name: courseSeed.name,
        credits: courseSeed.credits,
        faculty: courseSeed.faculty,
      },
    });

    courses.set(course.code, course);
  }

  const classSections = new Map<string, Awaited<ReturnType<typeof prisma.classSection.upsert>>>();
  const allScheduleSeeds = scheduleSeedsBySemester.flatMap((entry) =>
    entry.items.map((item) => ({ ...item, semesterId: entry.semesterId })),
  );

  for (const item of allScheduleSeeds) {
    const { courseCode, sectionCode } = parseClassCode(item.classCode);
    const course = courses.get(courseCode);
    const semester = semesters.get(item.semesterId);

    if (!course) {
      throw new Error(`Course ${courseCode} was not seeded`);
    }

    if (!semester) {
      throw new Error(`Semester ${item.semesterId} was not seeded`);
    }

    const classSection = await prisma.classSection.upsert({
      where: { classCode: item.classCode },
      update: {
        semesterId: semester.id,
        courseId: course.id,
        sectionCode,
        note: item.note ?? null,
      },
      create: {
        semesterId: semester.id,
        courseId: course.id,
        classCode: item.classCode,
        sectionCode,
        note: item.note ?? null,
      },
    });

    classSections.set(item.classCode, classSection);
  }

  await prisma.scheduleItem.deleteMany({
    where: {
      userId: student.id,
    },
  });

  await prisma.scheduleItem.createMany({
    data: allScheduleSeeds.map((item) => {
      const classSection = classSections.get(item.classCode);

      if (!classSection) {
        throw new Error(`Class section ${item.classCode} was not seeded`);
      }

      return {
        userId: student.id,
        classSectionId: classSection.id,
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        startPeriod: item.startPeriod,
        endPeriod: item.endPeriod,
        sessionType: item.sessionType,
        room: item.room ?? null,
        instructor: item.instructor ?? null,
      };
    }),
  });

  await prisma.grade.deleteMany({
    where: {
      userId: student.id,
    },
  });

  for (const entry of gradeSeedsBySemester) {
    const semester = semesters.get(entry.semesterId);

    if (!semester) {
      throw new Error(`Semester ${entry.semesterId} was not seeded for grades`);
    }

    for (const item of entry.items) {
      const course = courses.get(item.courseCode);

      if (!course) {
        throw new Error(`Course ${item.courseCode} was not seeded for grades`);
      }

      await prisma.grade.upsert({
        where: {
          userId_courseId_semesterId: {
            userId: student.id,
            courseId: course.id,
            semesterId: semester.id,
          },
        },
        update: {
          assignment: item.assignment ?? null,
          midterm: item.midterm ?? null,
          finalExam: item.finalExam ?? null,
          totalScore: item.totalScore ?? null,
          letterGrade: null,
          gradePoint: item.totalScore ?? null,
          isExempt: item.isExempt ?? false,
          earnedCredits:
            item.earnedCredits ??
            (item.totalScore !== null && item.totalScore !== undefined && item.totalScore >= 5 ? course.credits : 0),
        },
        create: {
          userId: student.id,
          courseId: course.id,
          semesterId: semester.id,
          assignment: item.assignment ?? null,
          midterm: item.midterm ?? null,
          finalExam: item.finalExam ?? null,
          totalScore: item.totalScore ?? null,
          letterGrade: null,
          gradePoint: item.totalScore ?? null,
          isExempt: item.isExempt ?? false,
          earnedCredits:
            item.earnedCredits ??
            (item.totalScore !== null && item.totalScore !== undefined && item.totalScore >= 5 ? course.credits : 0),
        },
      });
    }
  }

  const vehicle = await prisma.vehicle.upsert({
    where: { plateNumber: '51F44614' },
    update: {},
    create: {
      userId: student.id,
      plateNumber: '51F44614',
      rfidTag: 'DEMO-RFID-0001',
      label: 'Xe máy demo',
      isActive: true,
    },
  });

  await prisma.parkingSubscription.upsert({
    where: { vehicleId: vehicle.id },
    update: {},
    create: {
      vehicleId: vehicle.id,
      monthlyFee: 40000,
      status: SubscriptionStatus.active,
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      endDate: new Date('2026-05-01T00:00:00.000Z'),
      lastPaymentAt: new Date('2026-04-01T00:00:00.000Z'),
    },
  });

  const activeParkingSlots = getActiveParkingSlotNumbers(DEFAULT_PARKING_GATE_ID);

  await prisma.parkingSlot.deleteMany({
    where: {
      gateId: DEFAULT_PARKING_GATE_ID,
      slotNumber: {
        notIn: activeParkingSlots,
      },
    },
  });

  for (const slotNumber of activeParkingSlots) {
    await prisma.parkingSlot.upsert({
      where: {
        gateId_slotNumber: {
          gateId: DEFAULT_PARKING_GATE_ID,
          slotNumber,
        },
      },
      update: {},
      create: {
        gateId: DEFAULT_PARKING_GATE_ID,
        zone: 'Main',
        slotNumber,
        isOccupied: false,
      },
    });
  }

  console.warn('Seed completed:', {
    superAdmin: superAdmin.email,
    admin: admin.email,
    lecturer: lecturer.email,
    student: student.email,
    semesters: semesterSeeds.length,
    currentSemester: semesterSeeds.find((item) => item.isCurrent)?.name ?? null,
    sections: classSections.size,
    scheduleItems: allScheduleSeeds.length,
    grades: gradeSeedsBySemester.reduce((total, semester) => total + semester.items.length, 0),
    vehicle: vehicle.plateNumber,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

