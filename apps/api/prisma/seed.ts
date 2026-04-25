import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

import {
  EnrollmentStatus,
  EventCategory,
  EventStatus,
  PrismaClient,
  Role,
  RoomBookingStatus,
  RoomStatus,
  RoomType,
  ScheduleSessionType,
  SubscriptionStatus,
} from '@prisma/client';
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

interface RoomSeed {
  roomCode: string;
  displayName: string | null;
  buildingCode: string;
  floorNumber: number;
  capacity: number;
  type: RoomType;
}

interface RoomSnapshotFile {
  rooms: Array<{
    roomCode: string;
    displayName: string | null;
    buildingCode: string;
    floorNumber: number;
    capacity: number;
    type: keyof typeof RoomType;
  }>;
  bookings: RoomBookingSeed[];
}

function loadRoomSnapshot(): RoomSnapshotFile | null {
  const snapshotPath = resolve(process.cwd(), 'prisma', 'fixtures', 'uit-room-schedule.snapshot.json');

  if (!existsSync(snapshotPath)) {
    return null;
  }

  return JSON.parse(readFileSync(snapshotPath, 'utf8')) as RoomSnapshotFile;
}

const buildingSeeds = [
  { id: 'building-a', code: 'A', name: 'Tòa A' },
  { id: 'building-b', code: 'B', name: 'Tòa B' },
  { id: 'building-c', code: 'C', name: 'Tòa C' },
  { id: 'building-e', code: 'E', name: 'Tòa E' },
  { id: 'building-venue', code: 'VENUE', name: 'Hội trường và không gian chung' },
  { id: 'building-sport', code: 'SPORT', name: 'Sân tập và thể thao' },
] as const;

const timeSlotSeeds = [
  { slotNumber: 1, label: 'Tiết 1', startTime: '07:30', endTime: '08:15' },
  { slotNumber: 2, label: 'Tiết 2', startTime: '08:15', endTime: '09:00' },
  { slotNumber: 3, label: 'Tiết 3', startTime: '09:00', endTime: '09:45' },
  { slotNumber: 4, label: 'Tiết 4', startTime: '10:00', endTime: '10:45' },
  { slotNumber: 5, label: 'Tiết 5', startTime: '10:45', endTime: '11:30' },
  { slotNumber: 6, label: 'Tiết 6', startTime: '13:00', endTime: '13:45' },
  { slotNumber: 7, label: 'Tiết 7', startTime: '13:45', endTime: '14:30' },
  { slotNumber: 8, label: 'Tiết 8', startTime: '14:30', endTime: '15:15' },
  { slotNumber: 9, label: 'Tiết 9', startTime: '15:30', endTime: '16:15' },
  { slotNumber: 10, label: 'Tiết 10', startTime: '16:15', endTime: '17:00' },
  { slotNumber: 11, label: '11h-13h', startTime: '11:00', endTime: '13:00' },
  { slotNumber: 12, label: 'Sau 17h', startTime: '17:00', endTime: '21:00' },
] as const;

const fallbackRoomSeeds: RoomSeed[] = [
  { roomCode: 'A112', displayName: 'Phòng Họp', buildingCode: 'A', floorNumber: 1, capacity: 15, type: RoomType.meeting },
  { roomCode: 'A114', displayName: 'Phòng Họp', buildingCode: 'A', floorNumber: 1, capacity: 15, type: RoomType.meeting },
  { roomCode: 'A116', displayName: 'Phòng Họp', buildingCode: 'A', floorNumber: 1, capacity: 30, type: RoomType.meeting },
  { roomCode: 'A215', displayName: null, buildingCode: 'A', floorNumber: 2, capacity: 50, type: RoomType.classroom },
  { roomCode: 'A301', displayName: 'TTNN', buildingCode: 'A', floorNumber: 3, capacity: 30, type: RoomType.classroom },
  { roomCode: 'A305', displayName: 'TTNN', buildingCode: 'A', floorNumber: 3, capacity: 30, type: RoomType.classroom },
  { roomCode: 'A307', displayName: 'TTNN', buildingCode: 'A', floorNumber: 3, capacity: 30, type: RoomType.classroom },
  { roomCode: 'A309', displayName: 'TTNN', buildingCode: 'A', floorNumber: 3, capacity: 30, type: RoomType.classroom },
  { roomCode: 'A315', displayName: null, buildingCode: 'A', floorNumber: 3, capacity: 50, type: RoomType.classroom },
  { roomCode: 'A323', displayName: 'TTNN', buildingCode: 'A', floorNumber: 3, capacity: 30, type: RoomType.classroom },
  { roomCode: 'A325', displayName: null, buildingCode: 'A', floorNumber: 3, capacity: 48, type: RoomType.classroom },
  { roomCode: 'B1.02', displayName: null, buildingCode: 'B', floorNumber: 1, capacity: 60, type: RoomType.classroom },
  { roomCode: 'B1.04', displayName: null, buildingCode: 'B', floorNumber: 1, capacity: 60, type: RoomType.classroom },
  { roomCode: 'B1.06', displayName: null, buildingCode: 'B', floorNumber: 1, capacity: 60, type: RoomType.classroom },
  { roomCode: 'B1.08', displayName: null, buildingCode: 'B', floorNumber: 1, capacity: 60, type: RoomType.classroom },
  { roomCode: 'B1.10', displayName: null, buildingCode: 'B', floorNumber: 1, capacity: 70, type: RoomType.classroom },
  { roomCode: 'B1.12', displayName: null, buildingCode: 'B', floorNumber: 1, capacity: 70, type: RoomType.classroom },
  { roomCode: 'B1.14', displayName: null, buildingCode: 'B', floorNumber: 1, capacity: 160, type: RoomType.classroom },
  { roomCode: 'B1.16', displayName: null, buildingCode: 'B', floorNumber: 1, capacity: 90, type: RoomType.classroom },
  { roomCode: 'B1.18', displayName: null, buildingCode: 'B', floorNumber: 1, capacity: 90, type: RoomType.classroom },
  { roomCode: 'B1.20', displayName: null, buildingCode: 'B', floorNumber: 1, capacity: 100, type: RoomType.classroom },
  { roomCode: 'B1.22', displayName: null, buildingCode: 'B', floorNumber: 1, capacity: 100, type: RoomType.classroom },
  { roomCode: 'B2.02', displayName: 'PM', buildingCode: 'B', floorNumber: 2, capacity: 40, type: RoomType.lab },
  { roomCode: 'B2.06', displayName: 'PM', buildingCode: 'B', floorNumber: 2, capacity: 40, type: RoomType.lab },
  { roomCode: 'B2.08', displayName: 'PM', buildingCode: 'B', floorNumber: 2, capacity: 40, type: RoomType.lab },
  { roomCode: 'B2.10', displayName: 'PM', buildingCode: 'B', floorNumber: 2, capacity: 40, type: RoomType.lab },
  { roomCode: 'B2.12', displayName: 'PM', buildingCode: 'B', floorNumber: 2, capacity: 40, type: RoomType.lab },
  { roomCode: 'B2.14', displayName: 'PM', buildingCode: 'B', floorNumber: 2, capacity: 120, type: RoomType.lab },
  { roomCode: 'B2.16', displayName: 'PM', buildingCode: 'B', floorNumber: 2, capacity: 50, type: RoomType.lab },
  { roomCode: 'B2.18', displayName: 'PM', buildingCode: 'B', floorNumber: 2, capacity: 50, type: RoomType.lab },
  { roomCode: 'B2.20', displayName: 'PM', buildingCode: 'B', floorNumber: 2, capacity: 60, type: RoomType.lab },
  { roomCode: 'B2.22', displayName: 'PM', buildingCode: 'B', floorNumber: 2, capacity: 60, type: RoomType.lab },
  { roomCode: 'B3.02', displayName: 'PM', buildingCode: 'B', floorNumber: 3, capacity: 40, type: RoomType.lab },
  { roomCode: 'B3.04', displayName: 'PM', buildingCode: 'B', floorNumber: 3, capacity: 40, type: RoomType.lab },
  { roomCode: 'B3.06', displayName: 'PM', buildingCode: 'B', floorNumber: 3, capacity: 40, type: RoomType.lab },
  { roomCode: 'B3.08', displayName: 'PM', buildingCode: 'B', floorNumber: 3, capacity: 40, type: RoomType.lab },
  { roomCode: 'B3.10', displayName: null, buildingCode: 'B', floorNumber: 3, capacity: 80, type: RoomType.classroom },
  { roomCode: 'B3.12', displayName: null, buildingCode: 'B', floorNumber: 3, capacity: 80, type: RoomType.classroom },
  { roomCode: 'B3.14', displayName: null, buildingCode: 'B', floorNumber: 3, capacity: 140, type: RoomType.classroom },
  { roomCode: 'B3.16', displayName: null, buildingCode: 'B', floorNumber: 3, capacity: 90, type: RoomType.classroom },
  { roomCode: 'B3.18', displayName: null, buildingCode: 'B', floorNumber: 3, capacity: 90, type: RoomType.classroom },
  { roomCode: 'B3.20', displayName: null, buildingCode: 'B', floorNumber: 3, capacity: 100, type: RoomType.classroom },
  { roomCode: 'B3.22', displayName: null, buildingCode: 'B', floorNumber: 3, capacity: 100, type: RoomType.classroom },
  { roomCode: 'B4.02', displayName: 'PM', buildingCode: 'B', floorNumber: 4, capacity: 40, type: RoomType.lab },
  { roomCode: 'B4.04', displayName: 'PM', buildingCode: 'B', floorNumber: 4, capacity: 40, type: RoomType.lab },
  { roomCode: 'B4.06', displayName: 'PM', buildingCode: 'B', floorNumber: 4, capacity: 40, type: RoomType.lab },
  { roomCode: 'B4.08', displayName: 'PM', buildingCode: 'B', floorNumber: 4, capacity: 40, type: RoomType.lab },
  { roomCode: 'B4.10', displayName: null, buildingCode: 'B', floorNumber: 4, capacity: 72, type: RoomType.classroom },
  { roomCode: 'B4.12', displayName: null, buildingCode: 'B', floorNumber: 4, capacity: 72, type: RoomType.classroom },
  { roomCode: 'B4.14', displayName: null, buildingCode: 'B', floorNumber: 4, capacity: 160, type: RoomType.classroom },
  { roomCode: 'B4.16', displayName: null, buildingCode: 'B', floorNumber: 4, capacity: 90, type: RoomType.classroom },
  { roomCode: 'B4.18', displayName: null, buildingCode: 'B', floorNumber: 4, capacity: 90, type: RoomType.classroom },
  { roomCode: 'B4.20', displayName: null, buildingCode: 'B', floorNumber: 4, capacity: 100, type: RoomType.classroom },
  { roomCode: 'B4.22', displayName: null, buildingCode: 'B', floorNumber: 4, capacity: 100, type: RoomType.classroom },
  { roomCode: 'B5.02', displayName: 'PM', buildingCode: 'B', floorNumber: 5, capacity: 64, type: RoomType.lab },
  { roomCode: 'B5.04', displayName: 'PM', buildingCode: 'B', floorNumber: 5, capacity: 50, type: RoomType.lab },
  { roomCode: 'B5.06', displayName: 'PM', buildingCode: 'B', floorNumber: 5, capacity: 50, type: RoomType.lab },
  { roomCode: 'B5.08', displayName: 'Phòng Thực hành Thiết kế vi mạch số', buildingCode: 'B', floorNumber: 5, capacity: 60, type: RoomType.lab },
  { roomCode: 'B5.10', displayName: null, buildingCode: 'B', floorNumber: 5, capacity: 90, type: RoomType.classroom },
  { roomCode: 'B5.12', displayName: null, buildingCode: 'B', floorNumber: 5, capacity: 90, type: RoomType.classroom },
  { roomCode: 'B5.14', displayName: null, buildingCode: 'B', floorNumber: 5, capacity: 180, type: RoomType.classroom },
  { roomCode: 'B6.02', displayName: null, buildingCode: 'B', floorNumber: 6, capacity: 80, type: RoomType.classroom },
  { roomCode: 'B6.04', displayName: null, buildingCode: 'B', floorNumber: 6, capacity: 80, type: RoomType.classroom },
  { roomCode: 'B6.06', displayName: null, buildingCode: 'B', floorNumber: 6, capacity: 160, type: RoomType.classroom },
  { roomCode: 'B6.08', displayName: null, buildingCode: 'B', floorNumber: 6, capacity: 90, type: RoomType.classroom },
  { roomCode: 'B6.10', displayName: null, buildingCode: 'B', floorNumber: 6, capacity: 90, type: RoomType.classroom },
  { roomCode: 'B6.12', displayName: null, buildingCode: 'B', floorNumber: 6, capacity: 180, type: RoomType.classroom },
  { roomCode: 'B7.02', displayName: null, buildingCode: 'B', floorNumber: 7, capacity: 160, type: RoomType.classroom },
  { roomCode: 'B7.04', displayName: null, buildingCode: 'B', floorNumber: 7, capacity: 90, type: RoomType.classroom },
  { roomCode: 'B7.06', displayName: null, buildingCode: 'B', floorNumber: 7, capacity: 90, type: RoomType.classroom },
  { roomCode: 'B7.08', displayName: null, buildingCode: 'B', floorNumber: 7, capacity: 220, type: RoomType.classroom },
  { roomCode: 'B9.02', displayName: null, buildingCode: 'B', floorNumber: 9, capacity: 120, type: RoomType.classroom },
  { roomCode: 'C101', displayName: null, buildingCode: 'C', floorNumber: 1, capacity: 50, type: RoomType.classroom },
  { roomCode: 'C102', displayName: null, buildingCode: 'C', floorNumber: 1, capacity: 80, type: RoomType.classroom },
  { roomCode: 'C104', displayName: null, buildingCode: 'C', floorNumber: 1, capacity: 170, type: RoomType.classroom },
  { roomCode: 'C109', displayName: 'PM', buildingCode: 'C', floorNumber: 1, capacity: 50, type: RoomType.lab },
  { roomCode: 'C110', displayName: 'Phòng Họp', buildingCode: 'C', floorNumber: 1, capacity: 48, type: RoomType.meeting },
  { roomCode: 'C111', displayName: 'PM', buildingCode: 'C', floorNumber: 1, capacity: 50, type: RoomType.lab },
  { roomCode: 'C201', displayName: null, buildingCode: 'C', floorNumber: 2, capacity: 50, type: RoomType.classroom },
  { roomCode: 'C202', displayName: null, buildingCode: 'C', floorNumber: 2, capacity: 72, type: RoomType.classroom },
  { roomCode: 'C206', displayName: null, buildingCode: 'C', floorNumber: 2, capacity: 50, type: RoomType.classroom },
  { roomCode: 'C208', displayName: null, buildingCode: 'C', floorNumber: 2, capacity: 50, type: RoomType.classroom },
  { roomCode: 'C210', displayName: null, buildingCode: 'C', floorNumber: 2, capacity: 50, type: RoomType.classroom },
  { roomCode: 'C212', displayName: null, buildingCode: 'C', floorNumber: 2, capacity: 50, type: RoomType.classroom },
  { roomCode: 'C213', displayName: null, buildingCode: 'C', floorNumber: 2, capacity: 120, type: RoomType.classroom },
  { roomCode: 'C214', displayName: null, buildingCode: 'C', floorNumber: 2, capacity: 100, type: RoomType.classroom },
  { roomCode: 'C216', displayName: null, buildingCode: 'C', floorNumber: 2, capacity: 50, type: RoomType.classroom },
  { roomCode: 'C218', displayName: null, buildingCode: 'C', floorNumber: 2, capacity: 50, type: RoomType.classroom },
  { roomCode: 'C301', displayName: null, buildingCode: 'C', floorNumber: 3, capacity: 50, type: RoomType.classroom },
  { roomCode: 'C302', displayName: null, buildingCode: 'C', floorNumber: 3, capacity: 72, type: RoomType.classroom },
  { roomCode: 'C305', displayName: null, buildingCode: 'C', floorNumber: 3, capacity: 50, type: RoomType.classroom },
  { roomCode: 'C306', displayName: null, buildingCode: 'C', floorNumber: 3, capacity: 50, type: RoomType.classroom },
  { roomCode: 'C307', displayName: null, buildingCode: 'C', floorNumber: 3, capacity: 50, type: RoomType.classroom },
  { roomCode: 'C308', displayName: null, buildingCode: 'C', floorNumber: 3, capacity: 50, type: RoomType.classroom },
  { roomCode: 'C309', displayName: null, buildingCode: 'C', floorNumber: 3, capacity: 80, type: RoomType.classroom },
  { roomCode: 'C310', displayName: null, buildingCode: 'C', floorNumber: 3, capacity: 50, type: RoomType.classroom },
  { roomCode: 'C311', displayName: null, buildingCode: 'C', floorNumber: 3, capacity: 80, type: RoomType.classroom },
  { roomCode: 'C312', displayName: null, buildingCode: 'C', floorNumber: 3, capacity: 50, type: RoomType.classroom },
  { roomCode: 'C313', displayName: null, buildingCode: 'C', floorNumber: 3, capacity: 50, type: RoomType.classroom },
  { roomCode: 'C314', displayName: null, buildingCode: 'C', floorNumber: 3, capacity: 80, type: RoomType.classroom },
  { roomCode: 'C315', displayName: null, buildingCode: 'C', floorNumber: 3, capacity: 50, type: RoomType.classroom },
  { roomCode: 'C316', displayName: null, buildingCode: 'C', floorNumber: 3, capacity: 50, type: RoomType.classroom },
  { roomCode: 'C318', displayName: null, buildingCode: 'C', floorNumber: 3, capacity: 50, type: RoomType.classroom },
  { roomCode: 'E02.3', displayName: null, buildingCode: 'E', floorNumber: 2, capacity: 30, type: RoomType.classroom },
  { roomCode: 'E02.4', displayName: null, buildingCode: 'E', floorNumber: 2, capacity: 48, type: RoomType.classroom },
  { roomCode: 'E03.2', displayName: null, buildingCode: 'E', floorNumber: 3, capacity: 48, type: RoomType.classroom },
  { roomCode: 'E03.3', displayName: null, buildingCode: 'E', floorNumber: 3, capacity: 30, type: RoomType.classroom },
  { roomCode: 'E03.4', displayName: null, buildingCode: 'E', floorNumber: 3, capacity: 48, type: RoomType.classroom },
  { roomCode: 'E04.1', displayName: null, buildingCode: 'E', floorNumber: 4, capacity: 66, type: RoomType.classroom },
  { roomCode: 'E04.2', displayName: null, buildingCode: 'E', floorNumber: 4, capacity: 48, type: RoomType.classroom },
  { roomCode: 'E04.3', displayName: null, buildingCode: 'E', floorNumber: 4, capacity: 30, type: RoomType.classroom },
  { roomCode: 'E04.4', displayName: null, buildingCode: 'E', floorNumber: 4, capacity: 48, type: RoomType.classroom },
  { roomCode: 'E11.2', displayName: null, buildingCode: 'E', floorNumber: 11, capacity: 32, type: RoomType.classroom },
  { roomCode: 'E11.4', displayName: null, buildingCode: 'E', floorNumber: 11, capacity: 32, type: RoomType.classroom },
  { roomCode: 'E11.6', displayName: null, buildingCode: 'E', floorNumber: 11, capacity: 32, type: RoomType.classroom },
  { roomCode: 'E11.8', displayName: null, buildingCode: 'E', floorNumber: 11, capacity: 30, type: RoomType.classroom },
  { roomCode: 'Hội Trường A', displayName: null, buildingCode: 'VENUE', floorNumber: 0, capacity: 600, type: RoomType.meeting },
  { roomCode: 'HTE', displayName: 'Hội trường E12', buildingCode: 'VENUE', floorNumber: 0, capacity: 200, type: RoomType.meeting },
  { roomCode: 'Sảnh C', displayName: null, buildingCode: 'VENUE', floorNumber: 0, capacity: 100, type: RoomType.meeting },
  { roomCode: 'Phòng Bóng Bàn', displayName: null, buildingCode: 'SPORT', floorNumber: 0, capacity: 50, type: RoomType.meeting },
  { roomCode: 'Sân Bóng Chuyền', displayName: null, buildingCode: 'SPORT', floorNumber: 0, capacity: 60, type: RoomType.meeting },
  { roomCode: 'Sân Bóng Rổ', displayName: null, buildingCode: 'SPORT', floorNumber: 0, capacity: 60, type: RoomType.meeting },
  { roomCode: 'Sân Bóng Đá', displayName: null, buildingCode: 'SPORT', floorNumber: 0, capacity: 60, type: RoomType.meeting },
  { roomCode: 'Sân Cầu Lông', displayName: 'USSH', buildingCode: 'SPORT', floorNumber: 0, capacity: 70, type: RoomType.meeting },
  { roomCode: 'Sân Pickleball 01', displayName: 'sân cũ', buildingCode: 'SPORT', floorNumber: 0, capacity: 10, type: RoomType.meeting },
  { roomCode: 'Sân Pickleball 02', displayName: 'sân mới', buildingCode: 'SPORT', floorNumber: 0, capacity: 10, type: RoomType.meeting },
  { roomCode: 'Sân Pickleball 03', displayName: 'sân mới', buildingCode: 'SPORT', floorNumber: 0, capacity: 10, type: RoomType.meeting },
  { roomCode: 'Sân Võ Thuật', displayName: null, buildingCode: 'SPORT', floorNumber: 0, capacity: 60, type: RoomType.meeting },
] as const;

interface RoomBookingSeed {
  roomCode: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  title: string;
  purpose: string;
  attendeeCount?: number;
  contactName?: string;
  departmentName?: string;
  notes?: string;
  createdBy: 'admin' | 'lecturer';
}

const fallbackRoomBookingSeeds: RoomBookingSeed[] = [
  {
    roomCode: 'A112',
    bookingDate: '2026-04-21',
    startTime: '09:00',
    endTime: '11:30',
    title: 'QTTB',
    purpose: 'Họp báo cáo tiến độ công việc',
    attendeeCount: 10,
    departmentName: 'QTTB',
    createdBy: 'admin',
  },
  {
    roomCode: 'A112',
    bookingDate: '2026-04-23',
    startTime: '13:00',
    endTime: '17:00',
    title: 'Phòng KHCN, ĐN&SĐH',
    purpose: 'Phỏng vấn chương trình 1+1 Jaist Kim Cương 1****2',
    departmentName: 'Phòng KHCN, ĐN&SĐH',
    createdBy: 'admin',
  },
  {
    roomCode: 'A114',
    bookingDate: '2026-04-20',
    startTime: '08:15',
    endTime: '11:30',
    title: 'KTTT',
    purpose: 'Họp nhóm nghiên cứu',
    attendeeCount: 15,
    departmentName: 'KTTT',
    createdBy: 'admin',
  },
  {
    roomCode: 'A114',
    bookingDate: '2026-04-21',
    startTime: '13:45',
    endTime: '16:15',
    title: 'Phòng KHCN, ĐN&SĐH',
    purpose: 'Họp triển khai xây dựng CTĐT trình độ tiến sĩ',
    attendeeCount: 8,
    departmentName: 'Phòng KHCN, ĐN&SĐH',
    createdBy: 'admin',
  },
  {
    roomCode: 'A114',
    bookingDate: '2026-04-22',
    startTime: '07:30',
    endTime: '11:30',
    title: 'Trung tâm CITD',
    purpose: 'Họp chia sẻ kiểm định CTĐT. Vũ Khánh.',
    departmentName: 'Trung tâm CITD',
    createdBy: 'admin',
  },
  {
    roomCode: 'A114',
    bookingDate: '2026-04-23',
    startTime: '07:30',
    endTime: '17:00',
    title: 'Họp Nhóm B2DL',
    purpose: 'Họp Nhóm B2DL',
    createdBy: 'admin',
  },
  {
    roomCode: 'A116',
    bookingDate: '2026-04-20',
    startTime: '13:00',
    endTime: '16:15',
    title: 'BGH',
    purpose: 'Họp Chiến Lược Khối Phòng - Ban',
    departmentName: 'BGH',
    createdBy: 'admin',
  },
  {
    roomCode: 'A116',
    bookingDate: '2026-04-21',
    startTime: '10:45',
    endTime: '11:30',
    title: 'VPĐU',
    purpose: 'Hội nghị BCH Đảng bộ',
    attendeeCount: 20,
    departmentName: 'VPĐU',
    createdBy: 'admin',
  },
  {
    roomCode: 'A116',
    bookingDate: '2026-04-23',
    startTime: '13:00',
    endTime: '17:00',
    title: 'Phòng Khoa học Công nghệ, Đối ngoại & Sau Đại Học',
    purpose: 'Phổ biến chỉ tiêu (KPIs) khoa học và công nghệ tại Chiến lược phát triển ĐHQG-HCM giai đoạn 2021-2030, tầm nhìn 2045.',
    departmentName: 'Phòng Khoa học Công nghệ, Đối ngoại & Sau Đại Học',
    createdBy: 'admin',
  },
  {
    roomCode: 'A215',
    bookingDate: '2026-04-20',
    startTime: '08:15',
    endTime: '11:30',
    title: 'SĐH',
    purpose: 'NCS học Biểu diễn tri thức và suy luận',
    attendeeCount: 18,
    departmentName: 'SĐH',
    createdBy: 'admin',
  },
  {
    roomCode: 'A301',
    bookingDate: '2026-04-21',
    startTime: '10:00',
    endTime: '11:30',
    title: 'ENG02.Q215',
    purpose: 'Giảng dạy',
    attendeeCount: 25,
    contactName: 'Tất Dương Khánh Linh',
    departmentName: 'TTNN',
    createdBy: 'lecturer',
  },
  {
    roomCode: 'A301',
    bookingDate: '2026-04-22',
    startTime: '15:30',
    endTime: '17:00',
    title: 'ENG02.Q211',
    purpose: 'Giảng dạy',
    attendeeCount: 28,
    contactName: 'Nguyễn Nữ Huyền Trang',
    departmentName: 'TTNN',
    createdBy: 'lecturer',
  },
  {
    roomCode: 'A301',
    bookingDate: '2026-04-23',
    startTime: '13:00',
    endTime: '15:15',
    title: 'ENG02.Q215',
    purpose: 'Giảng dạy',
    attendeeCount: 25,
    contactName: 'Tất Dương Khánh Linh',
    departmentName: 'TTNN',
    createdBy: 'lecturer',
  },
  {
    roomCode: 'A301',
    bookingDate: '2026-04-24',
    startTime: '13:00',
    endTime: '15:15',
    title: 'ENG02.Q211',
    purpose: 'Giảng dạy',
    attendeeCount: 28,
    contactName: 'Nguyễn Nữ Huyền Trang',
    departmentName: 'TTNN',
    createdBy: 'lecturer',
  },
  {
    roomCode: 'B1.02',
    bookingDate: '2026-04-20',
    startTime: '07:30',
    endTime: '09:45',
    title: 'NT132.Q23',
    purpose: 'Giảng dạy',
    attendeeCount: 60,
    contactName: 'Văn Thiên Luân',
    createdBy: 'lecturer',
  },
  {
    roomCode: 'B1.02',
    bookingDate: '2026-04-21',
    startTime: '07:30',
    endTime: '10:45',
    title: 'MATH3013.Q21.CTTT',
    purpose: 'Giảng dạy',
    attendeeCount: 54,
    contactName: 'Nguyễn Ngọc Ái Vân',
    createdBy: 'lecturer',
  },
  {
    roomCode: 'B1.02',
    bookingDate: '2026-04-21',
    startTime: '13:00',
    endTime: '17:00',
    title: 'Khoa HTTT',
    purpose: 'Báo cáo đồ án',
    attendeeCount: 50,
    departmentName: 'Khoa HTTT',
    createdBy: 'admin',
  },
  {
    roomCode: 'B1.02',
    bookingDate: '2026-04-22',
    startTime: '07:30',
    endTime: '10:45',
    title: 'IS336.Q21',
    purpose: 'Giảng dạy',
    attendeeCount: 42,
    contactName: 'Văn Đức Sơn Hà',
    createdBy: 'lecturer',
  },
  {
    roomCode: 'B1.02',
    bookingDate: '2026-04-23',
    startTime: '07:30',
    endTime: '08:15',
    title: 'IS336.Q22.1(HT2)',
    purpose: 'Giảng dạy',
    attendeeCount: 48,
    contactName: 'Huỳnh Đức Huy',
    createdBy: 'lecturer',
  },
  {
    roomCode: 'B1.02',
    bookingDate: '2026-04-23',
    startTime: '08:15',
    endTime: '11:30',
    title: 'IS336.Q22',
    purpose: 'Giảng dạy',
    attendeeCount: 48,
    contactName: 'Huỳnh Đức Huy',
    createdBy: 'lecturer',
  },
  {
    roomCode: 'B1.02',
    bookingDate: '2026-04-24',
    startTime: '07:30',
    endTime: '09:45',
    title: 'NT132.Q22',
    purpose: 'Giảng dạy',
    attendeeCount: 50,
    contactName: 'Bùi Thanh Bình',
    createdBy: 'lecturer',
  },
  {
    roomCode: 'C104',
    bookingDate: '2026-04-21',
    startTime: '07:30',
    endTime: '17:00',
    title: 'CLB Sách và Hành động',
    purpose: 'Tổ chức không gian đọc sách thuộc chương trình Hội sách 2026, chủ đề "Lặng"',
    attendeeCount: 50,
    departmentName: 'CLB Sách và Hành động',
    createdBy: 'admin',
  },
  {
    roomCode: 'C318',
    bookingDate: '2026-04-21',
    startTime: '07:30',
    endTime: '11:30',
    title: 'HTTT',
    purpose: 'Báo cáo đồ án',
    attendeeCount: 30,
    departmentName: 'Khoa HTTT',
    createdBy: 'admin',
  },
  {
    roomCode: 'C318',
    bookingDate: '2026-04-22',
    startTime: '13:00',
    endTime: '16:15',
    title: 'EC304.Q21',
    purpose: 'Giảng dạy',
    attendeeCount: 36,
    contactName: 'Văn Đức Sơn Hà',
    createdBy: 'lecturer',
  },
  {
    roomCode: 'E02.3',
    bookingDate: '2026-04-20',
    startTime: '13:00',
    endTime: '16:15',
    title: 'ENG05.Q21.CTTT',
    purpose: 'Giảng dạy',
    attendeeCount: 6,
    contactName: 'Tất Dương Khánh Linh',
    departmentName: 'CTTT',
    notes: 'Co-lecturer: Oronde Nkomo',
    createdBy: 'lecturer',
  },
  {
    roomCode: 'E02.3',
    bookingDate: '2026-04-21',
    startTime: '08:15',
    endTime: '11:30',
    title: 'CNBU108.Q21.KHBC',
    purpose: 'Giảng dạy',
    attendeeCount: 5,
    contactName: 'Trần Thị Dung',
    createdBy: 'lecturer',
  },
  {
    roomCode: 'E02.3',
    bookingDate: '2026-04-22',
    startTime: '07:30',
    endTime: '10:45',
    title: 'ENG05.Q21.CTTT',
    purpose: 'Giảng dạy',
    attendeeCount: 6,
    contactName: 'Tất Dương Khánh Linh',
    departmentName: 'CTTT',
    createdBy: 'lecturer',
  },
  {
    roomCode: 'E02.3',
    bookingDate: '2026-04-22',
    startTime: '13:00',
    endTime: '16:15',
    title: 'JAN06.Q25.CNVN.1',
    purpose: 'Giảng dạy',
    attendeeCount: 15,
    contactName: 'Dương Thị Thương',
    createdBy: 'lecturer',
  },
  {
    roomCode: 'E02.3',
    bookingDate: '2026-04-25',
    startTime: '13:00',
    endTime: '16:15',
    title: 'CNBU105.Q21.KHBC',
    purpose: 'Giảng dạy',
    attendeeCount: 6,
    contactName: 'Nguyễn Duy',
    createdBy: 'lecturer',
  },
  {
    roomCode: 'E03.2',
    bookingDate: '2026-04-20',
    startTime: '07:30',
    endTime: '10:45',
    title: 'STAT3013.Q21.CTTT',
    purpose: 'Giảng dạy',
    attendeeCount: 34,
    contactName: 'Trần Văn Hải Triều',
    departmentName: 'CTTT',
    createdBy: 'lecturer',
  },
  {
    roomCode: 'E03.2',
    bookingDate: '2026-04-21',
    startTime: '08:15',
    endTime: '11:30',
    title: 'PH002.Q21.VMTN',
    purpose: 'Giảng dạy',
    attendeeCount: 39,
    contactName: 'Vũ Đức Lung',
    departmentName: 'VMTN',
    createdBy: 'lecturer',
  },
  {
    roomCode: 'E03.2',
    bookingDate: '2026-04-22',
    startTime: '07:30',
    endTime: '10:45',
    title: 'MSIS4013.Q22.CTTT',
    purpose: 'Giảng dạy',
    attendeeCount: 40,
    contactName: 'Cao Thị Nhạn',
    departmentName: 'CTTT',
    createdBy: 'lecturer',
  },
  {
    roomCode: 'E03.2',
    bookingDate: '2026-04-23',
    startTime: '07:30',
    endTime: '10:45',
    title: 'CE124.Q21.VMTN',
    purpose: 'Giảng dạy',
    attendeeCount: 30,
    contactName: 'Trịnh Lê Huy',
    departmentName: 'VMTN',
    createdBy: 'lecturer',
  },
  {
    roomCode: 'E03.2',
    bookingDate: '2026-04-24',
    startTime: '07:30',
    endTime: '10:45',
    title: 'MSIS3033.Q22.CTTT',
    purpose: 'Giảng dạy',
    attendeeCount: 35,
    contactName: 'Trần Hưng Nghiệp',
    departmentName: 'CTTT',
    createdBy: 'lecturer',
  },
] as const;

const roomSnapshot = loadRoomSnapshot();

const roomSeeds: RoomSeed[] =
  roomSnapshot?.rooms.map((room) => ({
    ...room,
    type: RoomType[room.type],
  })) ?? fallbackRoomSeeds;

const roomBookingSeeds: RoomBookingSeed[] = roomSnapshot?.bookings ?? fallbackRoomBookingSeeds;

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

interface EventSeed {
  slug: string;
  title: string;
  excerpt: string;
  location: string;
  contentHtml: string;
  coverImageUrl: string | null;
  status: EventStatus;
  category: EventCategory;
  startAt: string;
  endAt: string;
  maxAttendees?: number;
  createdBy: 'admin' | 'lecturer';
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

const eventSeeds: EventSeed[] = [
  {
    slug: 'hoi-thao-iot-cho-do-an-se346',
    title: 'Hội thảo IoT cho đồ án SE346',
    excerpt: 'Buổi chia sẻ định hướng triển khai thiết bị, gateway và pipeline dữ liệu cho nhóm đồ án.',
    location: 'Phòng E4.1',
    contentHtml:
      '<p>Hội thảo tập trung vào cách dựng luồng dữ liệu IoT từ cảm biến đến dashboard vận hành.</p><p>Sinh viên sẽ được hướng dẫn cách demo end-to-end bằng dữ liệu thật, tránh mock trong phần bảo vệ đồ án.</p>',
    coverImageUrl: 'https://www.uit.edu.vn/sites/vi/files/banner_uit_1.png',
    status: EventStatus.open,
    category: EventCategory.seminar,
    startAt: '2026-04-28T08:30:00.000Z',
    endAt: '2026-04-28T10:30:00.000Z',
    maxAttendees: 80,
    createdBy: 'lecturer',
  },
  {
    slug: 'ngay-hoi-clb-cong-nghe-uit',
    title: 'Ngày hội CLB Công nghệ UIT',
    excerpt: 'Không gian kết nối các CLB học thuật và cộng đồng công nghệ trong trường.',
    location: 'Sảnh C',
    contentHtml:
      '<p>Sự kiện quy tụ các CLB học thuật, nhóm nghiên cứu và đội thi để giới thiệu hoạt động học kỳ mới.</p><p>Sinh viên có thể đăng ký tham gia trực tiếp trên ứng dụng.</p>',
    coverImageUrl: 'https://www.uit.edu.vn/sites/vi/files/banner_uit_1.png',
    status: EventStatus.open,
    category: EventCategory.community,
    startAt: '2026-04-29T01:00:00.000Z',
    endAt: '2026-04-29T05:00:00.000Z',
    maxAttendees: 150,
    createdBy: 'admin',
  },
  {
    slug: 'workshop-kiem-thu-mobile-thuc-chien',
    title: 'Workshop kiểm thử mobile thực chiến',
    excerpt: 'Chia sẻ cách viết test UI và API đủ sâu để bảo vệ đồ án với dữ liệu thật.',
    location: 'Phòng B2.16',
    contentHtml:
      '<p>Workshop tập trung vào test React Native, API integration và các tình huống dễ vỡ khi demo.</p><p>Người tham dự sẽ nhận bộ checklist kiểm thử trước buổi bảo vệ.</p>',
    coverImageUrl: 'https://www.uit.edu.vn/sites/vi/files/banner_uit_1.png',
    status: EventStatus.planned,
    category: EventCategory.workshop,
    startAt: '2026-05-02T06:30:00.000Z',
    endAt: '2026-05-02T09:00:00.000Z',
    maxAttendees: 60,
    createdBy: 'lecturer',
  },
  {
    slug: 'dien-dan-cong-dong-open-source-uit',
    title: 'Diễn đàn cộng đồng Open Source UIT',
    excerpt: 'Buổi trao đổi về đóng góp mã nguồn mở và lộ trình phát triển kỹ năng kỹ thuật.',
    location: 'Hội Trường A',
    contentHtml:
      '<p>Diễn đàn quy tụ sinh viên, giảng viên và cựu sinh viên đang tham gia các dự án open source.</p><p>Nội dung bao gồm quy trình review code, đóng góp issue và xây dựng hồ sơ kỹ thuật.</p>',
    coverImageUrl: 'https://www.uit.edu.vn/sites/vi/files/banner_uit_1.png',
    status: EventStatus.open,
    category: EventCategory.club,
    startAt: '2026-05-05T00:30:00.000Z',
    endAt: '2026-05-05T03:30:00.000Z',
    maxAttendees: 200,
    createdBy: 'admin',
  },
];

const instructorNames = Array.from(
  new Set(
    scheduleSeedsBySemester.flatMap((entry) =>
      entry.items
        .map((item) => item.instructor?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ),
).sort();

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

function splitVietnameseName(fullName: string) {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const firstName = parts.pop() ?? fullName;
  const lastName = parts.join(' ') || firstName;

  return {
    firstName,
    lastName,
  };
}

function buildLecturerEmail(fullName: string) {
  return `${fullName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')}@uit.edu.vn`;
}

function timeRangesOverlap(startA: string, endA: string, startB: string, endB: string) {
  return startA < endB && startB < endA;
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
        firstName: 'Son',
        lastName: 'Le Thanh',
        isActive: true,
      },
      create: {
        email: 'lecturer@uit.edu.vn',
        passwordHash,
        firstName: 'Son',
        lastName: 'Le Thanh',
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

  const instructorUsers = new Map<string, Awaited<ReturnType<typeof prisma.user.upsert>>>();
  instructorUsers.set('Le Thanh Son', lecturer);

  for (const instructorName of instructorNames) {
    if (instructorUsers.has(instructorName)) {
      continue;
    }

    const { firstName, lastName } = splitVietnameseName(instructorName);
    const instructorUser = await prisma.user.upsert({
      where: { email: buildLecturerEmail(instructorName) },
      update: {
        passwordHash,
        firstName,
        lastName,
        role: Role.lecturer,
        faculty: 'Giảng viên UIT',
        isActive: true,
      },
      create: {
        email: buildLecturerEmail(instructorName),
        passwordHash,
        firstName,
        lastName,
        role: Role.lecturer,
        faculty: 'Giảng viên UIT',
        isActive: true,
      },
    });

    instructorUsers.set(instructorName, instructorUser);
  }

  await prisma.semester.updateMany({
    data: { isCurrent: false },
  });

  const seededBuildings = new Map<string, Awaited<ReturnType<typeof prisma.building.upsert>>>();

  for (const buildingSeed of buildingSeeds) {
    const building = await prisma.building.upsert({
      where: { code: buildingSeed.code },
      update: {
        name: buildingSeed.name,
      },
      create: buildingSeed,
    });

    seededBuildings.set(building.code, building);
  }

  const seededFloors = new Map<string, Awaited<ReturnType<typeof prisma.floor.upsert>>>();

  for (const roomSeed of roomSeeds) {
    const building = seededBuildings.get(roomSeed.buildingCode);

    if (!building) {
      throw new Error(`Building ${roomSeed.buildingCode} was not seeded`);
    }

    const floorKey = `${roomSeed.buildingCode}-${roomSeed.floorNumber}`;

    if (!seededFloors.has(floorKey)) {
      const floor = await prisma.floor.upsert({
        where: {
          buildingId_floorNumber: {
            buildingId: building.id,
            floorNumber: roomSeed.floorNumber,
          },
        },
        update: {
          name: `Tầng ${roomSeed.floorNumber}`,
        },
        create: {
          buildingId: building.id,
          floorNumber: roomSeed.floorNumber,
          name: `Tầng ${roomSeed.floorNumber}`,
        },
      });

      seededFloors.set(floorKey, floor);
    }
  }

  const seededTimeSlots = new Map<number, Awaited<ReturnType<typeof prisma.timeSlot.upsert>>>();

  for (const timeSlotSeed of timeSlotSeeds) {
    const timeSlot = await prisma.timeSlot.upsert({
      where: { slotNumber: timeSlotSeed.slotNumber },
      update: {
        label: timeSlotSeed.label,
        startTime: timeSlotSeed.startTime,
        endTime: timeSlotSeed.endTime,
      },
      create: timeSlotSeed,
    });

    seededTimeSlots.set(timeSlot.slotNumber, timeSlot);
  }

  const seededRooms = new Map<string, Awaited<ReturnType<typeof prisma.room.upsert>>>();

  for (const roomSeed of roomSeeds) {
    const floor = seededFloors.get(`${roomSeed.buildingCode}-${roomSeed.floorNumber}`);

    if (!floor) {
      throw new Error(`Floor ${roomSeed.buildingCode}-${roomSeed.floorNumber} was not seeded`);
    }

    const room = await prisma.room.upsert({
      where: { roomCode: roomSeed.roomCode },
      update: {
        floorId: floor.id,
        name: roomSeed.displayName,
        capacity: roomSeed.capacity,
        type: roomSeed.type,
        status: RoomStatus.active,
      },
      create: {
        floorId: floor.id,
        roomCode: roomSeed.roomCode,
        name: roomSeed.displayName,
        capacity: roomSeed.capacity,
        type: roomSeed.type,
        status: RoomStatus.active,
      },
    });

    seededRooms.set(room.roomCode, room);
  }

  await prisma.roomBooking.deleteMany();

  const bookingUsers = {
    admin,
    lecturer,
  } as const;

  for (const bookingSeed of roomBookingSeeds) {
    const room = seededRooms.get(bookingSeed.roomCode);

    if (!room) {
      throw new Error(`Room ${bookingSeed.roomCode} was not seeded`);
    }

    const createdBy = bookingUsers[bookingSeed.createdBy];
    const bookingDate = new Date(`${bookingSeed.bookingDate}T00:00:00.000Z`);
    const matchingTimeSlots = timeSlotSeeds
      .filter((timeSlotSeed) =>
        timeRangesOverlap(
          bookingSeed.startTime,
          bookingSeed.endTime,
          timeSlotSeed.startTime,
          timeSlotSeed.endTime,
        ),
      )
      .map((timeSlotSeed) => seededTimeSlots.get(timeSlotSeed.slotNumber))
      .filter((timeSlot): timeSlot is NonNullable<typeof timeSlot> => Boolean(timeSlot));

    if (matchingTimeSlots.length === 0) {
      await prisma.roomBooking.create({
        data: {
          roomId: room.id,
          userId: createdBy.id,
          bookingDate,
          startTime: bookingSeed.startTime,
          endTime: bookingSeed.endTime,
          title: bookingSeed.title,
          purpose: bookingSeed.purpose,
          attendeeCount: bookingSeed.attendeeCount ?? null,
          contactName: bookingSeed.contactName ?? null,
          contactPhone: null,
          departmentName: bookingSeed.departmentName ?? null,
          status: RoomBookingStatus.booked,
          approvedById: admin.id,
          approvedAt: bookingDate,
          notes:
            bookingSeed.notes ??
            'Nguồn seed: https://student.uit.edu.vn/lichphong tuần 20-04-2026 đến 26-04-2026',
        },
      });
      continue;
    }

    for (const timeSlot of matchingTimeSlots) {
      await prisma.roomBooking.create({
        data: {
          roomId: room.id,
          userId: createdBy.id,
          bookingDate,
          timeSlotId: timeSlot.id,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          title: bookingSeed.title,
          purpose: bookingSeed.purpose,
          attendeeCount: bookingSeed.attendeeCount ?? null,
          contactName: bookingSeed.contactName ?? null,
          contactPhone: null,
          departmentName: bookingSeed.departmentName ?? null,
          status: RoomBookingStatus.booked,
          approvedById: admin.id,
          approvedAt: bookingDate,
          notes:
            bookingSeed.notes ??
            'Nguồn seed: https://student.uit.edu.vn/lichphong tuần 20-04-2026 đến 26-04-2026',
        },
      });
    }
  }

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

  type AggregatedSectionSeed = {
    semesterId: string;
    classCode: string;
    courseCode: string;
    sectionCode: string;
    note: string | null;
    instructor: string | null;
    meetings: ScheduleSeed[];
  };

  const aggregatedSectionSeeds = new Map<string, AggregatedSectionSeed>();

  for (const item of allScheduleSeeds) {
    const { courseCode, sectionCode } = parseClassCode(item.classCode);
    const existing = aggregatedSectionSeeds.get(item.classCode);

    if (existing) {
      existing.meetings.push(item);
      if (!existing.note && item.note) {
        existing.note = item.note;
      }
      if (!existing.instructor && item.instructor) {
        existing.instructor = item.instructor;
      }
      continue;
    }

    aggregatedSectionSeeds.set(item.classCode, {
      semesterId: item.semesterId,
      classCode: item.classCode,
      courseCode,
      sectionCode,
      note: item.note ?? null,
      instructor: item.instructor ?? null,
      meetings: [item],
    });
  }

  for (const sectionSeed of aggregatedSectionSeeds.values()) {
    const course = courses.get(sectionSeed.courseCode);
    const semester = semesters.get(sectionSeed.semesterId);

    if (!course) {
      throw new Error(`Course ${sectionSeed.courseCode} was not seeded`);
    }

    if (!semester) {
      throw new Error(`Semester ${sectionSeed.semesterId} was not seeded`);
    }

    const lecturerUser = sectionSeed.instructor ? instructorUsers.get(sectionSeed.instructor) : null;

    const classSection = await prisma.classSection.upsert({
      where: { classCode: sectionSeed.classCode },
      update: {
        semesterId: semester.id,
        courseId: course.id,
        sectionCode: sectionSeed.sectionCode,
        note: sectionSeed.note,
        lecturerId: lecturerUser?.id ?? null,
        capacity: 60,
        registrationOpen: semester.isCurrent,
      },
      create: {
        semesterId: semester.id,
        courseId: course.id,
        classCode: sectionSeed.classCode,
        sectionCode: sectionSeed.sectionCode,
        note: sectionSeed.note,
        lecturerId: lecturerUser?.id ?? null,
        capacity: 60,
        registrationOpen: semester.isCurrent,
      },
    });

    classSections.set(sectionSeed.classCode, classSection);
  }

  await prisma.classMeeting.deleteMany();
  await prisma.classMeeting.createMany({
    data: allScheduleSeeds.map((item) => {
      const classSection = classSections.get(item.classCode);

      if (!classSection) {
        throw new Error(`Class section ${item.classCode} was not seeded`);
      }

      return {
        classSectionId: classSection.id,
        dayOfWeek: item.dayOfWeek,
        room: item.room ?? null,
        startTime: item.startTime,
        endTime: item.endTime,
        startPeriod: item.startPeriod,
        endPeriod: item.endPeriod,
        sessionType: item.sessionType,
        note: item.note ?? null,
      };
    }),
  });

  await prisma.classEnrollment.deleteMany({
    where: {
      studentId: student.id,
    },
  });

  const currentSemesterId = semesterSeeds.find((item) => item.isCurrent)?.id ?? semesterSeeds[0].id;
  const currentSemesterSectionCodes = Array.from(
    new Set(
      allScheduleSeeds
        .filter((item) => item.semesterId === currentSemesterId)
        .map((item) => item.classCode),
    ),
  );
  const activeSectionCodeSet = new Set(currentSemesterSectionCodes);

  for (const classCode of currentSemesterSectionCodes) {
    const classSection = classSections.get(classCode);

    if (!classSection) {
      throw new Error(`Class section ${classCode} was not seeded for enrollments`);
    }

    await prisma.classEnrollment.create({
      data: {
        studentId: student.id,
        classSectionId: classSection.id,
        status: EnrollmentStatus.active,
      },
    });
  }

  const droppedEnrollmentCode = allScheduleSeeds.find((item) => item.semesterId !== currentSemesterId)?.classCode;
  if (droppedEnrollmentCode) {
    const droppedClassSection = classSections.get(droppedEnrollmentCode);

    if (droppedClassSection) {
      await prisma.classEnrollment.create({
        data: {
          studentId: student.id,
          classSectionId: droppedClassSection.id,
          status: EnrollmentStatus.dropped,
          droppedAt: new Date('2025-03-01T00:00:00.000Z'),
        },
      });
    }
  }

  await prisma.scheduleItem.deleteMany({
    where: {
      userId: student.id,
    },
  });

  await prisma.scheduleItem.createMany({
    data: allScheduleSeeds
      .filter((item) => activeSectionCodeSet.has(item.classCode))
      .map((item) => {
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

  await prisma.eventRegistration.deleteMany();
  await prisma.event.deleteMany();

  const eventOwners = {
    admin,
    lecturer,
  } as const;

  const seededEvents = new Map<string, Awaited<ReturnType<typeof prisma.event.create>>>();

  for (const eventSeed of eventSeeds) {
    const owner = eventOwners[eventSeed.createdBy];
    const event = await prisma.event.create({
      data: {
        ownerId: owner.id,
        slug: eventSeed.slug,
        title: eventSeed.title,
        excerpt: eventSeed.excerpt,
        location: eventSeed.location,
        contentHtml: eventSeed.contentHtml,
        coverImageUrl: eventSeed.coverImageUrl,
        status: eventSeed.status,
        category: eventSeed.category,
        startAt: new Date(eventSeed.startAt),
        endAt: new Date(eventSeed.endAt),
        maxAttendees: eventSeed.maxAttendees ?? null,
      },
    });

    seededEvents.set(event.slug, event);
  }

  const openEvents = [...seededEvents.values()].filter((item) => item.status === EventStatus.open);

  if (openEvents[0]) {
    await prisma.eventRegistration.create({
      data: {
        eventId: openEvents[0].id,
        userId: student.id,
      },
    });
  }

  if (openEvents[1]) {
    await prisma.eventRegistration.create({
      data: {
        eventId: openEvents[1].id,
        userId: student.id,
        cancelledAt: new Date('2026-04-24T10:00:00.000Z'),
      },
    });
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

  const [
    seededRoomBookingCount,
    seededMeetingCount,
    seededEnrollmentCount,
    seededEventCount,
    seededEventRegistrationCount,
  ] = await Promise.all([
    prisma.roomBooking.count(),
    prisma.classMeeting.count(),
    prisma.classEnrollment.count(),
    prisma.event.count(),
    prisma.eventRegistration.count(),
  ]);

  console.warn('Seed completed:', {
    superAdmin: superAdmin.email,
    admin: admin.email,
    lecturer: lecturer.email,
    student: student.email,
    buildings: buildingSeeds.length,
    rooms: roomSeeds.length,
    roomBookings: seededRoomBookingCount,
    timeSlots: timeSlotSeeds.length,
    semesters: semesterSeeds.length,
    currentSemester: semesterSeeds.find((item) => item.isCurrent)?.name ?? null,
    sections: classSections.size,
    classMeetings: seededMeetingCount,
    classEnrollments: seededEnrollmentCount,
    scheduleItems: allScheduleSeeds.filter((item) => activeSectionCodeSet.has(item.classCode)).length,
    grades: gradeSeedsBySemester.reduce((total, semester) => total + semester.items.length, 0),
    events: seededEventCount,
    eventRegistrations: seededEventRegistrationCount,
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

