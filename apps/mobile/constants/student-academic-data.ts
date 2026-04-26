import type { GPASummary, SemesterGradesRecord, SemesterScheduleRecord } from '@/types/app-data';

export const STUDENT_GRADES_SUMMARY: GPASummary = {
  gpa: 7.77,
  totalCredits: 100,
  totalEarnedCredits: 104,
  totalCourses: 32,
  totalSemesters: 8,
};

export const STUDENT_SEMESTER_SCHEDULES: SemesterScheduleRecord[] = [
  {
    id: 'sem-2025-2026-2',
    name: 'HK2 2025-2026',
    academicYear: '2025-2026',
    term: 2,
    startDate: '2026-01-05T00:00:00.000Z',
    endDate: '2026-05-31T23:59:59.000Z',
    isCurrent: true,
    sessions: [
      { id: '6a816c6d-8ba3-46b6-aa42-78daf9e2ed29', classCode: 'SE104.Q21', sectionCode: 'Q21', note: null, instructor: 'Nguyễn Hoàng Phúc', room: 'B1.02', dayOfWeek: 1, startTime: '07:30', endTime: '09:45', startPeriod: 1, endPeriod: 3, sessionType: 'daytime', course: { code: 'SE104', name: 'Nhập môn Công nghệ phần mềm', credits: 4 } },
      { id: 'c83c10f6-6b5f-43d1-a7b0-b60cddc3fbf8', classCode: 'CS312.Q21', sectionCode: 'Q21', note: null, instructor: 'Pham Thu Ha', room: 'B1.04', dayOfWeek: 1, startTime: '13:00', endTime: '13:45', startPeriod: 6, endPeriod: 6, sessionType: 'daytime', course: { code: 'CS312', name: 'Trí tuệ nhân tạo - VN', credits: 3 } },
      { id: 'e60b18c5-3b97-4be5-baf3-c48928b14881', classCode: 'SE347.Q21', sectionCode: 'Q21', note: null, instructor: 'Nguyễn Hoàng Phúc', room: 'E03.2', dayOfWeek: 2, startTime: '07:30', endTime: '09:00', startPeriod: 1, endPeriod: 2, sessionType: 'daytime', course: { code: 'SE347', name: 'Công nghệ web và ứng dụng', credits: 4 } },
      { id: 'e2eb044a-4767-4461-8328-f20270de7e1b', classCode: 'SE214.Q21', sectionCode: 'Q21', note: null, instructor: 'Nguyễn Hoàng Phúc', room: 'E02.3', dayOfWeek: 2, startTime: '10:00', endTime: '11:30', startPeriod: 4, endPeriod: 5, sessionType: 'daytime', course: { code: 'SE214', name: 'Công nghệ phần mềm chuyên sâu', credits: 4 } },
      { id: '3fa11d1e-4f33-43de-9854-6bfa51248a1e', classCode: 'DS302.Q21', sectionCode: 'Q21', note: null, instructor: 'Vo Ngoc Hung', room: 'B1.06', dayOfWeek: 2, startTime: '15:30', endTime: '16:15', startPeriod: 9, endPeriod: 9, sessionType: 'daytime', course: { code: 'DS302', name: 'Trực quan hóa dữ liệu - VN', credits: 3 } },
      { id: '9c68c690-28b6-4603-9503-0a8950994875', classCode: 'SE346.Q21', sectionCode: 'Q21', note: null, instructor: 'Nguyễn Hoàng Phúc', room: 'B1.04', dayOfWeek: 3, startTime: '07:30', endTime: '09:45', startPeriod: 1, endPeriod: 3, sessionType: 'daytime', course: { code: 'SE346', name: 'Lập trình trên thiết bị di động', credits: 4 } },
      { id: 'a54c1062-6b7e-4b71-b5bb-c8d027dc13f1', classCode: 'IS401.Q21', sectionCode: 'Q21', note: null, instructor: 'Nguyen Bao Chau', room: 'B1.02', dayOfWeek: 3, startTime: '13:00', endTime: '14:30', startPeriod: 6, endPeriod: 7, sessionType: 'daytime', course: { code: 'IS401', name: 'Quản trị dự án hệ thống thông tin', credits: 3 } },
      { id: 'a4f323a9-cf8b-437f-a0da-8c8d1c7d59b8', classCode: 'LAW200.Q21', sectionCode: 'Q21', note: null, instructor: 'Do Thi Nha', room: 'B1.02', dayOfWeek: 4, startTime: '08:15', endTime: '09:00', startPeriod: 2, endPeriod: 2, sessionType: 'daytime', course: { code: 'LAW200', name: 'Pháp luật đại cương - VN', credits: 2 } },
      { id: 'f35456f8-4946-4908-8945-149dc64d2cb7', classCode: 'SE301.Q21', sectionCode: 'Q21', note: null, instructor: 'Nguyễn Hoàng Phúc', room: 'E03.2', dayOfWeek: 4, startTime: '10:00', endTime: '11:30', startPeriod: 4, endPeriod: 5, sessionType: 'daytime', course: { code: 'SE301', name: 'Phát triển phần mềm mã nguồn mở', credits: 3 } },
      { id: 'cf0f88dd-bf84-4dbe-829b-8870dd572bd1', classCode: 'SE310.Q21', sectionCode: 'Q21', note: null, instructor: 'Nguyễn Hoàng Phúc', room: 'E02.3', dayOfWeek: 4, startTime: '13:00', endTime: '15:15', startPeriod: 6, endPeriod: 8, sessionType: 'daytime', course: { code: 'SE310', name: 'Công nghệ .NET', credits: 4 } },
      { id: 'a9909f2b-9f77-4fa5-961d-7594c8a9d391', classCode: 'SE114.Q21', sectionCode: 'Q21', note: null, instructor: 'Nguyễn Hoàng Phúc', room: 'B1.04', dayOfWeek: 5, startTime: '07:30', endTime: '09:00', startPeriod: 1, endPeriod: 2, sessionType: 'daytime', course: { code: 'SE114', name: 'Nhập môn ứng dụng di động', credits: 3 } },
      { id: 'c36f17c0-569a-4eee-9f18-f56f1d7d90b4', classCode: 'NT208.Q21', sectionCode: 'Q21', note: null, instructor: 'Tran Quoc Bao', room: 'B1.02', dayOfWeek: 5, startTime: '13:00', endTime: '15:15', startPeriod: 6, endPeriod: 8, sessionType: 'daytime', course: { code: 'NT208', name: 'Lập trình mạng căn bản - VN', credits: 4 } },
      { id: 'b50cb62c-852f-47ec-b77b-921ba859cc1d', classCode: 'SE121.Q21', sectionCode: 'Q21', note: null, instructor: 'Nguyễn Hoàng Phúc', room: 'E03.2', dayOfWeek: 6, startTime: '07:30', endTime: '09:00', startPeriod: 1, endPeriod: 2, sessionType: 'daytime', course: { code: 'SE121', name: 'Đồ án 1', credits: 2 } },
      { id: 'b1fd8382-8241-4115-b5c4-f305951fd8ea', classCode: 'MA005.Q21', sectionCode: 'Q21', note: null, instructor: 'Huynh Quoc Thai', room: 'E02.3', dayOfWeek: 6, startTime: '13:00', endTime: '13:45', startPeriod: 6, endPeriod: 6, sessionType: 'daytime', course: { code: 'MA005', name: 'Xác suất thống kê', credits: 3 } },
    ],
  },
  {
    id: 'sem-2025-2026-1',
    name: 'HK1 2025-2026',
    academicYear: '2025-2026',
    term: 1,
    startDate: '2025-09-08T00:00:00.000Z',
    endDate: '2026-01-03T23:59:59.000Z',
    isCurrent: false,
    sessions: [
      { id: 'fc2589a2-eb75-493b-a926-6c23992dc3a0', classCode: 'IT008.Q09', sectionCode: 'Q09', note: null, instructor: 'Le Thanh Son', room: 'PM2.202', dayOfWeek: 1, startTime: '09:00', endTime: '11:30', startPeriod: 3, endPeriod: 5, sessionType: 'daytime', course: { code: 'IT008', name: 'Lập trình trực quan', credits: 4 } },
      { id: '45ad7711-a7ad-487c-81d2-416b732e0d3d', classCode: 'SS009.Q05', sectionCode: 'Q05', note: null, instructor: 'Nguyen Thi Hanh', room: 'A2.105', dayOfWeek: 2, startTime: '07:30', endTime: '10:00', startPeriod: 1, endPeriod: 4, sessionType: 'daytime', course: { code: 'SS009', name: 'Chủ nghĩa xã hội khoa học', credits: 2 } },
      { id: '9ced5651-1371-48e7-9de5-eed57ff06b95', classCode: 'IT008.Q09.1', sectionCode: 'Q09.1', note: 'Thực hành desktop app', instructor: 'Le Thanh Son', room: 'LAB.UI-01', dayOfWeek: 2, startTime: '17:45', endTime: '20:45', startPeriod: null, endPeriod: null, sessionType: 'evening', course: { code: 'IT008', name: 'Lập trình trực quan', credits: 4 } },
      { id: '47d709af-5762-4684-9bd7-ff07e8c7e9ae', classCode: 'IS401.Q31', sectionCode: 'Q31', note: null, instructor: 'Nguyen Bao Chau', room: 'E2.201', dayOfWeek: 3, startTime: '13:00', endTime: '15:15', startPeriod: 6, endPeriod: 8, sessionType: 'daytime', course: { code: 'IS401', name: 'Quản trị dự án hệ thống thông tin', credits: 3 } },
      { id: '1d20468e-093d-4aef-8b75-25bd031e096a', classCode: 'LAW200.Q16', sectionCode: 'Q16', note: null, instructor: 'Do Thi Nha', room: 'A3.101', dayOfWeek: 5, startTime: '09:00', endTime: '10:30', startPeriod: 3, endPeriod: 4, sessionType: 'daytime', course: { code: 'LAW200', name: 'Pháp luật đại cương - VN', credits: 2 } },
    ],
  },
  {
    id: 'sem-2024-2025-2',
    name: 'HK2 2024-2025',
    academicYear: '2024-2025',
    term: 2,
    startDate: '2025-01-06T00:00:00.000Z',
    endDate: '2025-05-31T23:59:59.000Z',
    isCurrent: false,
    sessions: [
      { id: '37b3ddf7-e474-4948-8c79-6973571241b7', classCode: 'SE346.Q22', sectionCode: 'Q22', note: null, instructor: 'Le Minh Quan', room: 'E4.1', dayOfWeek: 1, startTime: '09:00', endTime: '11:30', startPeriod: 3, endPeriod: 5, sessionType: 'daytime', course: { code: 'SE346', name: 'Internet of Things', credits: 4 } },
      { id: '14c292df-eac3-4965-89a4-1d3a2bdeb313', classCode: 'SE347.Q11', sectionCode: 'Q11', note: null, instructor: 'Nguyen Hoang Phuc', room: 'A2.305', dayOfWeek: 2, startTime: '07:30', endTime: '10:00', startPeriod: 1, endPeriod: 4, sessionType: 'daytime', course: { code: 'SE347', name: 'Kiểm thử phần mềm - VN', credits: 4 } },
      { id: '918b0265-5da3-4ba3-8d34-5fbfa6be2862', classCode: 'SE347.Q11.1', sectionCode: 'Q11.1', note: 'Lab tăng cường', instructor: 'Le Minh Quan', room: 'LAB.GCS-02', dayOfWeek: 2, startTime: '17:45', endTime: '20:45', startPeriod: null, endPeriod: null, sessionType: 'evening', course: { code: 'SE347', name: 'Kiểm thử phần mềm - VN', credits: 4 } },
      { id: 'e6bef8e1-1e2d-4a93-af9c-3bf1cc2e6284', classCode: 'NT208.Q13', sectionCode: 'Q13', note: null, instructor: 'Tran Quoc Bao', room: 'PM1.102', dayOfWeek: 3, startTime: '13:00', endTime: '15:15', startPeriod: 6, endPeriod: 8, sessionType: 'daytime', course: { code: 'NT208', name: 'Lập trình mạng căn bản - VN', credits: 4 } },
      { id: '1080dbc1-e933-4bf5-980c-178c977669b5', classCode: 'IS252.Q15', sectionCode: 'Q15', note: null, instructor: 'Vo Ngoc Hung', room: 'C1.107', dayOfWeek: 4, startTime: '07:30', endTime: '10:00', startPeriod: 1, endPeriod: 4, sessionType: 'daytime', course: { code: 'IS252', name: 'Khai phá dữ liệu - VN', credits: 3 } },
      { id: '4aeb47a2-654c-48d5-be0b-d42fb439b18c', classCode: 'NT208.Q13.1', sectionCode: 'Q13.1', note: 'Thực hành mạng', instructor: 'Tran Quoc Bao', room: 'LAB.NET-01', dayOfWeek: 4, startTime: '17:45', endTime: '20:45', startPeriod: null, endPeriod: null, sessionType: 'evening', course: { code: 'NT208', name: 'Lập trình mạng căn bản - VN', credits: 4 } },
    ],
  },
  {
    id: 'sem-2024-2025-1',
    name: 'HK1 2024-2025',
    academicYear: '2024-2025',
    term: 1,
    startDate: '2024-09-09T00:00:00.000Z',
    endDate: '2024-12-28T23:59:59.000Z',
    isCurrent: false,
    sessions: [
      { id: '9bdbe9b7-d72d-4b23-afac-bbb2d48c33fb', classCode: 'CS221.P12', sectionCode: 'P12', note: null, instructor: 'Pham Duc Long', room: 'B1.203', dayOfWeek: 2, startTime: '07:30', endTime: '10:00', startPeriod: 1, endPeriod: 4, sessionType: 'daytime', course: { code: 'CS221', name: 'Cấu trúc dữ liệu và giải thuật', credits: 4 } },
      { id: 'bb04862b-0221-4aad-9fe7-5f701c6c5910', classCode: 'IT007.P16', sectionCode: 'P16', note: null, instructor: 'Nguyen Van Binh', room: 'B2.12', dayOfWeek: 4, startTime: '07:30', endTime: '10:00', startPeriod: 1, endPeriod: 4, sessionType: 'daytime', course: { code: 'IT007', name: 'Hệ điều hành', credits: 4 } },
      { id: '3a3abc08-63c7-433d-b396-91298042c721', classCode: 'SS008.P04', sectionCode: 'P04', note: null, instructor: 'Le Trung Kien', room: 'A2.104', dayOfWeek: 5, startTime: '09:00', endTime: '11:30', startPeriod: 3, endPeriod: 5, sessionType: 'daytime', course: { code: 'SS008', name: 'Kinh tế chính trị Mác - Lênin', credits: 2 } },
      { id: '8dc08e9f-a11a-47c4-98db-973603915529', classCode: 'CS221.P12.1', sectionCode: 'P12.1', note: 'Lab cấu trúc dữ liệu', instructor: 'Pham Duc Long', room: 'LAB.CS-02', dayOfWeek: 5, startTime: '17:45', endTime: '20:45', startPeriod: null, endPeriod: null, sessionType: 'evening', course: { code: 'CS221', name: 'Cấu trúc dữ liệu và giải thuật', credits: 4 } },
      { id: '49f3e96e-d13d-4c57-b7bb-4df616fac710', classCode: 'PE232.P03', sectionCode: 'P03', note: null, instructor: 'Tran Cong Hau', room: 'San TDTT 2', dayOfWeek: 6, startTime: '13:00', endTime: '15:15', startPeriod: 6, endPeriod: 8, sessionType: 'daytime', course: { code: 'PE232', name: 'Giáo dục thể chất 2 - VN', credits: 1 } },
    ],
  },
  {
    id: 'sem-2023-2024-2',
    name: 'HK2 2023-2024',
    academicYear: '2023-2024',
    term: 2,
    startDate: '2024-01-08T00:00:00.000Z',
    endDate: '2024-05-25T23:59:59.000Z',
    isCurrent: false,
    sessions: [
      { id: '44263360-70f2-4a0a-9378-7edef949fa86', classCode: 'MA005.P11', sectionCode: 'P11', note: null, instructor: 'Huynh Quoc Thai', room: 'C1.109', dayOfWeek: 1, startTime: '09:00', endTime: '11:30', startPeriod: 3, endPeriod: 5, sessionType: 'daytime', course: { code: 'MA005', name: 'Xác suất thống kê', credits: 3 } },
      { id: '0533d73e-3209-4de0-a236-37f9036b5b5a', classCode: 'SE104.P21.1', sectionCode: 'P21.1', note: 'Workshop phân tích yêu cầu', instructor: 'Do Thanh Phuong', room: 'LAB.SE-01', dayOfWeek: 2, startTime: '17:45', endTime: '20:45', startPeriod: null, endPeriod: null, sessionType: 'evening', course: { code: 'SE104', name: 'Phân tích yêu cầu phần mềm - VN', credits: 4 } },
      { id: '216f46af-70cd-43f8-890b-077660ddcc48', classCode: 'NT213.P11', sectionCode: 'P11', note: null, instructor: 'Tran Quoc Bao', room: 'PM1.102', dayOfWeek: 3, startTime: '13:00', endTime: '15:15', startPeriod: 6, endPeriod: 8, sessionType: 'daytime', course: { code: 'NT213', name: 'Mạng máy tính cơ bản - VN', credits: 4 } },
      { id: '3eb12636-9431-4999-a305-d84213dff44a', classCode: 'SS004.P18', sectionCode: 'P18', note: null, instructor: 'Vo Minh Tam', room: 'A2.101', dayOfWeek: 4, startTime: '09:00', endTime: '11:30', startPeriod: 3, endPeriod: 5, sessionType: 'daytime', course: { code: 'SS004', name: 'Tư tưởng Hồ Chí Minh - VN', credits: 2 } },
      { id: '3459da7c-0de3-4ad4-9592-2895eeb436b8', classCode: 'SE104.P21', sectionCode: 'P21', note: null, instructor: 'Do Thanh Phuong', room: 'E1.204', dayOfWeek: 5, startTime: '07:30', endTime: '10:00', startPeriod: 1, endPeriod: 4, sessionType: 'daytime', course: { code: 'SE104', name: 'Phân tích yêu cầu phần mềm - VN', credits: 4 } },
    ],
  },
  {
    id: 'sem-2023-2024-1',
    name: 'HK1 2023-2024',
    academicYear: '2023-2024',
    term: 1,
    startDate: '2023-09-11T00:00:00.000Z',
    endDate: '2024-01-06T23:59:59.000Z',
    isCurrent: false,
    sessions: [
      { id: '4e70f375-02f6-48d0-9ed5-f961cc515c7a', classCode: 'MA006.P17', sectionCode: 'P17', note: null, instructor: 'Nguyen Minh Tri', room: 'B4.320', dayOfWeek: 2, startTime: '07:30', endTime: '10:00', startPeriod: 1, endPeriod: 4, sessionType: 'daytime', course: { code: 'MA006', name: 'Giải tích - VN', credits: 4 } },
      { id: 'ae316771-be66-46b4-bb82-d7b0092a8fd4', classCode: 'IT003.P12', sectionCode: 'P12', note: null, instructor: 'Pham Duc Long', room: 'B1.203', dayOfWeek: 3, startTime: '13:00', endTime: '15:15', startPeriod: 6, endPeriod: 8, sessionType: 'daytime', course: { code: 'IT003', name: 'Cấu trúc dữ liệu và giải thuật', credits: 4 } },
      { id: '1cd6937a-593d-4802-bd98-256f67515c06', classCode: 'SS007.P07', sectionCode: 'P07', note: null, instructor: 'Le Trung Kien', room: 'A2.103', dayOfWeek: 4, startTime: '09:00', endTime: '11:30', startPeriod: 3, endPeriod: 5, sessionType: 'daytime', course: { code: 'SS007', name: 'Triết học Mác - Lênin', credits: 3 } },
      { id: '07349e5d-cb08-4771-b01c-9ca0fdfdafe8', classCode: 'IT003.P12.1', sectionCode: 'P12.1', note: 'Lab thuật toán cơ bản', instructor: 'Pham Duc Long', room: 'LAB.CS-02', dayOfWeek: 5, startTime: '17:45', endTime: '20:45', startPeriod: null, endPeriod: null, sessionType: 'evening', course: { code: 'IT003', name: 'Cấu trúc dữ liệu và giải thuật', credits: 4 } },
      { id: '4061ec95-3276-46de-98a0-1358eb1e1c05', classCode: 'PE201.P02', sectionCode: 'P02', note: null, instructor: 'Tran Cong Hau', room: 'San TDTT 1', dayOfWeek: 6, startTime: '13:00', endTime: '15:15', startPeriod: 6, endPeriod: 8, sessionType: 'daytime', course: { code: 'PE201', name: 'Giáo dục thể chất 1 - VN', credits: 1 } },
    ],
  },
  {
    id: 'sem-2022-2023-2',
    name: 'HK2 2022-2023',
    academicYear: '2022-2023',
    term: 2,
    startDate: '2023-01-09T00:00:00.000Z',
    endDate: '2023-05-27T23:59:59.000Z',
    isCurrent: false,
    sessions: [
      { id: 'fae717d2-49a3-491a-926a-16ec9456bbf9', classCode: 'ENG02.P08', sectionCode: 'P08', note: null, instructor: 'Tat Duong Khanh Linh', room: 'A3.15', dayOfWeek: 2, startTime: '13:00', endTime: '15:15', startPeriod: 6, endPeriod: 8, sessionType: 'daytime', course: { code: 'ENG02', name: 'Anh văn 2', credits: 4 } },
      { id: '85ca2de2-acae-4506-b9b3-bf38f1d55bb9', classCode: 'IT012.P09', sectionCode: 'P09', note: null, instructor: 'Tran Thi Diem', room: 'B6.08', dayOfWeek: 3, startTime: '07:30', endTime: '09:45', startPeriod: 1, endPeriod: 3, sessionType: 'daytime', course: { code: 'IT012', name: 'Tổ chức và cấu trúc máy tính 2 - VN', credits: 4 } },
      { id: 'ed0929a4-d635-4707-a56b-833843733330', classCode: 'IT002.P21', sectionCode: 'P21', note: null, instructor: 'Nguyen Huu Khang', room: 'B3.11', dayOfWeek: 4, startTime: '13:00', endTime: '15:15', startPeriod: 6, endPeriod: 8, sessionType: 'daytime', course: { code: 'IT002', name: 'Lập trình hướng đối tượng', credits: 4 } },
      { id: 'dc46f2ee-c2c7-4947-b97d-ec0565560230', classCode: 'MA004.P15', sectionCode: 'P15', note: null, instructor: 'Pham Thi Lan', room: 'C1.106', dayOfWeek: 5, startTime: '07:30', endTime: '10:00', startPeriod: 1, endPeriod: 4, sessionType: 'daytime', course: { code: 'MA004', name: 'Cấu trúc rời rạc', credits: 4 } },
      { id: '71b7a33d-0134-454d-b503-8e1576440e46', classCode: 'IT012.P09.1', sectionCode: 'P09.1', note: 'Buổi thực hành phần cứng', instructor: 'Tran Thi Diem', room: 'LAB.CS-01', dayOfWeek: 5, startTime: '17:45', endTime: '20:45', startPeriod: null, endPeriod: null, sessionType: 'evening', course: { code: 'IT012', name: 'Tổ chức và cấu trúc máy tính 2 - VN', credits: 4 } },
      { id: 'bb22119a-22f6-4979-92e3-f3fed5898f12', classCode: 'SS006.P03', sectionCode: 'P03', note: null, instructor: 'Vo Minh Tam', room: 'A2.101', dayOfWeek: 6, startTime: '09:00', endTime: '11:30', startPeriod: 3, endPeriod: 5, sessionType: 'daytime', course: { code: 'SS006', name: 'Pháp luật đại cương', credits: 2 } },
    ],
  },
  {
    id: 'sem-2022-2023-1',
    name: 'HK1 2022-2023',
    academicYear: '2022-2023',
    term: 1,
    startDate: '2022-09-05T00:00:00.000Z',
    endDate: '2022-12-31T23:59:59.000Z',
    isCurrent: false,
    sessions: [
      { id: 'c707e3d3-cb24-4ffe-85ff-e387d362a0ed', classCode: 'IT001.P11', sectionCode: 'P11', note: null, instructor: 'Tran Anh Dung', room: 'B4.420', dayOfWeek: 2, startTime: '07:30', endTime: '10:00', startPeriod: 1, endPeriod: 4, sessionType: 'daytime', course: { code: 'IT001', name: 'Nhập môn lập trình - VN', credits: 4 } },
      { id: '086e4bac-04ab-4978-b24b-b14205bd3985', classCode: 'MA003.P14', sectionCode: 'P14', note: null, instructor: 'Dang Le Thuy', room: 'B4.18', dayOfWeek: 3, startTime: '13:00', endTime: '15:15', startPeriod: 6, endPeriod: 8, sessionType: 'daytime', course: { code: 'MA003', name: 'Đại số tuyến tính - VN', credits: 3 } },
      { id: '20a173c8-7251-400f-96dc-3cbe19440993', classCode: 'IT001.P11.1', sectionCode: 'P11.1', note: 'Thực hành phòng máy, cách 2 tuần', instructor: 'Le Tan Trong Khiem', room: 'B2.16', dayOfWeek: 5, startTime: '13:00', endTime: '15:15', startPeriod: 6, endPeriod: 8, sessionType: 'daytime', course: { code: 'IT001', name: 'Nhập môn lập trình - VN', credits: 4 } },
      { id: 'ef275b56-d172-471f-9ed0-c984e0f2ec01', classCode: 'SE005.P01', sectionCode: 'P01', note: null, instructor: 'Dang Viet Dung', room: 'B4.14', dayOfWeek: 6, startTime: '09:00', endTime: '10:30', startPeriod: 3, endPeriod: 4, sessionType: 'daytime', course: { code: 'SE005', name: 'Giới thiệu ngành Kỹ thuật phần mềm - VN', credits: 1 } },
    ],
  },
];

function normalizePreviewInstructor(value?: string | null) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const LECTURER_PREVIEW_NAMES = new Set(['nguyen hoang phuc']);

export const LECTURER_SEMESTER_SCHEDULES: SemesterScheduleRecord[] = STUDENT_SEMESTER_SCHEDULES.map(
  (semester) => ({
    ...semester,
    sessions: semester.sessions.filter((session) =>
      LECTURER_PREVIEW_NAMES.has(normalizePreviewInstructor(session.instructor)),
    ),
  }),
).filter((semester) => semester.sessions.length > 0);

export function getLecturerSemesterScheduleById(semesterId: string) {
  return LECTURER_SEMESTER_SCHEDULES.find((semester) => semester.id === semesterId);
}

export const STUDENT_SEMESTER_GRADES: SemesterGradesRecord[] = [
  {
    id: 'sem-2025-2026-2',
    name: 'HK2 2025-2026',
    academicYear: '2025-2026',
    term: 2,
    startDate: '2026-01-05T00:00:00.000Z',
    endDate: '2026-05-31T23:59:59.000Z',
    isCurrent: true,
    summary: { gpa: 8.11, totalCredits: 13, totalEarnedCredits: 13, totalCourses: 4, totalSemesters: 1 },
    grades: [
      { id: '92cf799a-d662-4b64-b2fd-4cd2deb4ecfb', midterm: 8.2, finalExam: 8.1, assignment: 8.6, totalScore: 8.2, letterGrade: null, gradePoint: 8.2, isExempt: false, earnedCredits: 3, course: { code: 'AI301', name: 'Machine Learning cơ bản - VN', credits: 3 } },
      { id: '5dd3ad38-1e9b-4e67-9e58-cc1eb8f9c57c', midterm: 7.8, finalExam: 8, assignment: 8.3, totalScore: 8, letterGrade: null, gradePoint: 8, isExempt: false, earnedCredits: 3, course: { code: 'CS312', name: 'Trí tuệ nhân tạo - VN', credits: 3 } },
      { id: '9de9e505-11a5-4799-a387-48646b55b055', midterm: 8.1, finalExam: 8.4, assignment: 8.8, totalScore: 8.4, letterGrade: null, gradePoint: 8.4, isExempt: false, earnedCredits: 3, course: { code: 'DS302', name: 'Trực quan hóa dữ liệu - VN', credits: 3 } },
      { id: '4fd60eef-0f1f-4909-ac1c-8be4180a2dd3', midterm: 7.7, finalExam: 7.9, assignment: 8.1, totalScore: 7.9, letterGrade: null, gradePoint: 7.9, isExempt: false, earnedCredits: 4, course: { code: 'SE334', name: 'Phân tích và thiết kế hệ thống thông tin - VN', credits: 4 } },
    ],
  },
  {
    id: 'sem-2025-2026-1',
    name: 'HK1 2025-2026',
    academicYear: '2025-2026',
    term: 1,
    startDate: '2025-09-08T00:00:00.000Z',
    endDate: '2026-01-03T23:59:59.000Z',
    isCurrent: false,
    summary: { gpa: 8.15, totalCredits: 11, totalEarnedCredits: 11, totalCourses: 4, totalSemesters: 1 },
    grades: [
      { id: '56804048-6325-49d6-b47b-c17b51c4d6fe', midterm: 8.1, finalExam: 8.3, assignment: 8.5, totalScore: 8.3, letterGrade: null, gradePoint: 8.3, isExempt: false, earnedCredits: 3, course: { code: 'IS401', name: 'Quản trị dự án hệ thống thông tin', credits: 3 } },
      { id: 'e13f5c0c-1072-46e6-81e7-c7f364fbb238', midterm: 8, finalExam: 8.1, assignment: 8.4, totalScore: 8.1, letterGrade: null, gradePoint: 8.1, isExempt: false, earnedCredits: 4, course: { code: 'IT008', name: 'Lập trình trực quan', credits: 4 } },
      { id: 'c4ff4e54-2a64-48cc-aa7e-f213bd7fad64', midterm: null, finalExam: 8.4, assignment: 8.7, totalScore: 8.5, letterGrade: null, gradePoint: 8.5, isExempt: false, earnedCredits: 2, course: { code: 'LAW200', name: 'Pháp luật đại cương - VN', credits: 2 } },
      { id: 'b07f99de-db15-4cc7-b0c5-5ca23c31cfab', midterm: null, finalExam: 7.8, assignment: 7.6, totalScore: 7.7, letterGrade: null, gradePoint: 7.7, isExempt: false, earnedCredits: 2, course: { code: 'SS009', name: 'Chủ nghĩa xã hội khoa học', credits: 2 } },
    ],
  },
  {
    id: 'sem-2024-2025-2',
    name: 'HK2 2024-2025',
    academicYear: '2024-2025',
    term: 2,
    startDate: '2025-01-06T00:00:00.000Z',
    endDate: '2025-05-31T23:59:59.000Z',
    isCurrent: false,
    summary: { gpa: 7.81, totalCredits: 15, totalEarnedCredits: 15, totalCourses: 4, totalSemesters: 1 },
    grades: [
      { id: 'd4d74597-f36c-4cd8-bb44-74dcab560dbb', midterm: 7.2, finalExam: 7.8, assignment: 8, totalScore: 7.7, letterGrade: null, gradePoint: 7.7, isExempt: false, earnedCredits: 3, course: { code: 'IS252', name: 'Khai phá dữ liệu - VN', credits: 3 } },
      { id: '7f2ed1fd-684f-4838-9c8f-24dbe7113398', midterm: 7.9, finalExam: 8, assignment: 8.3, totalScore: 8, letterGrade: null, gradePoint: 8, isExempt: false, earnedCredits: 4, course: { code: 'NT208', name: 'Lập trình mạng căn bản - VN', credits: 4 } },
      { id: '09d4e383-c2c4-4199-81bc-d3bbf2a2a9e2', midterm: 7.8, finalExam: 8, assignment: 8.1, totalScore: 8, letterGrade: null, gradePoint: 8, isExempt: false, earnedCredits: 4, course: { code: 'SE346', name: 'Internet of Things', credits: 4 } },
      { id: 'f53d295e-0dbe-45d7-8055-c64561491162', midterm: 7.4, finalExam: 7.5, assignment: 7.7, totalScore: 7.5, letterGrade: null, gradePoint: 7.5, isExempt: false, earnedCredits: 4, course: { code: 'SE347', name: 'Kiểm thử phần mềm - VN', credits: 4 } },
    ],
  },
  {
    id: 'sem-2024-2025-1',
    name: 'HK1 2024-2025',
    academicYear: '2024-2025',
    term: 1,
    startDate: '2024-09-09T00:00:00.000Z',
    endDate: '2024-12-28T23:59:59.000Z',
    isCurrent: false,
    summary: { gpa: 7.69, totalCredits: 11, totalEarnedCredits: 11, totalCourses: 4, totalSemesters: 1 },
    grades: [
      { id: '48aa4b97-78ed-480e-b18e-f22afc335a84', midterm: 7.4, finalExam: 7.6, assignment: 7.8, totalScore: 7.6, letterGrade: null, gradePoint: 7.6, isExempt: false, earnedCredits: 4, course: { code: 'CS221', name: 'Cấu trúc dữ liệu và giải thuật', credits: 4 } },
      { id: '86089052-b9c5-4afd-a6b3-da36e9be6cf1', midterm: 7.1, finalExam: 7.3, assignment: 7.5, totalScore: 7.3, letterGrade: null, gradePoint: 7.3, isExempt: false, earnedCredits: 4, course: { code: 'IT007', name: 'Hệ điều hành', credits: 4 } },
      { id: 'ee24ca25-e4ae-4414-ac56-d1ac9bddcf90', midterm: 8.9, finalExam: 9.1, assignment: null, totalScore: 9, letterGrade: null, gradePoint: 9, isExempt: false, earnedCredits: 1, course: { code: 'PE232', name: 'Giáo dục thể chất 2 - VN', credits: 1 } },
      { id: '6c984023-db93-456a-9a27-2b01776ab1bf', midterm: null, finalExam: 7.9, assignment: 8.2, totalScore: 8, letterGrade: null, gradePoint: 8, isExempt: false, earnedCredits: 2, course: { code: 'SS008', name: 'Kinh tế chính trị Mác - Lênin', credits: 2 } },
    ],
  },
  {
    id: 'sem-2023-2024-2',
    name: 'HK2 2023-2024',
    academicYear: '2023-2024',
    term: 2,
    startDate: '2024-01-08T00:00:00.000Z',
    endDate: '2024-05-25T23:59:59.000Z',
    isCurrent: false,
    summary: { gpa: 7.66, totalCredits: 14, totalEarnedCredits: 14, totalCourses: 4, totalSemesters: 1 },
    grades: [
      { id: '253a78b5-da34-4542-a16f-9a643f21f85e', midterm: 7.5, finalExam: 7.2, assignment: 6.9, totalScore: 7.2, letterGrade: null, gradePoint: 7.2, isExempt: false, earnedCredits: 4, course: { code: 'CS221', name: 'Cấu trúc dữ liệu và giải thuật', credits: 4 } },
      { id: '6690e292-67ae-470c-a7a2-30339d1df643', midterm: 7.3, finalExam: 7.6, assignment: 8.1, totalScore: 7.7, letterGrade: null, gradePoint: 7.7, isExempt: false, earnedCredits: 4, course: { code: 'IT007', name: 'Hệ điều hành', credits: 4 } },
      { id: 'd629a9e6-5fc3-4f77-b615-bab1edbafedb', midterm: 7.9, finalExam: 8.2, assignment: 8.4, totalScore: 8.2, letterGrade: null, gradePoint: 8.2, isExempt: false, earnedCredits: 4, course: { code: 'IT008', name: 'Lập trình trực quan', credits: 4 } },
      { id: '18758638-ef5b-4149-8289-35595a13ce05', midterm: 7, finalExam: 7.4, assignment: 7.8, totalScore: 7.4, letterGrade: null, gradePoint: 7.4, isExempt: false, earnedCredits: 2, course: { code: 'SS006', name: 'Pháp luật đại cương', credits: 2 } },
    ],
  },
  {
    id: 'sem-2023-2024-1',
    name: 'HK1 2023-2024',
    academicYear: '2023-2024',
    term: 1,
    startDate: '2023-09-11T00:00:00.000Z',
    endDate: '2024-01-06T23:59:59.000Z',
    isCurrent: false,
    summary: { gpa: 7.66, totalCredits: 11, totalEarnedCredits: 11, totalCourses: 4, totalSemesters: 1 },
    grades: [
      { id: 'be762e01-90ac-4979-92f9-467db6f48329', midterm: 8, finalExam: 8.3, assignment: 7.6, totalScore: 8, letterGrade: null, gradePoint: 8, isExempt: false, earnedCredits: 4, course: { code: 'IT012', name: 'Tổ chức và cấu trúc máy tính 2 - VN', credits: 4 } },
      { id: 'fe1d656b-89ae-4dcb-a3c7-a3ea8d232333', midterm: null, finalExam: 8.2, assignment: 8.5, totalScore: 8.3, letterGrade: null, gradePoint: 8.3, isExempt: false, earnedCredits: 1, course: { code: 'PE232', name: 'Giáo dục thể chất 2 - VN', credits: 1 } },
      { id: 'e8dcdbce-3ef1-4b08-b8b9-c3fa6d99fea2', midterm: 7.9, finalExam: 6.8, assignment: 7.2, totalScore: 7.2, letterGrade: null, gradePoint: 7.2, isExempt: false, earnedCredits: 4, course: { code: 'SE104', name: 'Phân tích yêu cầu phần mềm - VN', credits: 4 } },
      { id: '206fd7c5-1f65-4aab-b89d-95dcd8b5b9c1', midterm: 7.4, finalExam: 7.8, assignment: null, totalScore: 7.6, letterGrade: null, gradePoint: 7.6, isExempt: false, earnedCredits: 2, course: { code: 'SS004', name: 'Tư tưởng Hồ Chí Minh - VN', credits: 2 } },
    ],
  },
  {
    id: 'sem-2022-2023-2',
    name: 'HK2 2022-2023',
    academicYear: '2022-2023',
    term: 2,
    startDate: '2023-01-09T00:00:00.000Z',
    endDate: '2023-05-27T23:59:59.000Z',
    isCurrent: false,
    summary: { gpa: 7.56, totalCredits: 16, totalEarnedCredits: 16, totalCourses: 5, totalSemesters: 1 },
    grades: [
      { id: 'c862cc52-d445-465e-8df4-b1ec945eecb1', midterm: 7.5, finalExam: 7.2, assignment: 7.8, totalScore: 7.5, letterGrade: null, gradePoint: 7.5, isExempt: false, earnedCredits: 4, course: { code: 'IT003', name: 'Cấu trúc dữ liệu và giải thuật', credits: 4 } },
      { id: 'bd195822-a28d-46c2-b936-19d67cc4695f', midterm: 7.1, finalExam: null, assignment: null, totalScore: 7.1, letterGrade: null, gradePoint: 7.1, isExempt: false, earnedCredits: 3, course: { code: 'MA003', name: 'Đại số tuyến tính - VN', credits: 3 } },
      { id: '0bf593a6-4b37-4098-9009-ef27ed8d845c', midterm: 8, finalExam: 7.7, assignment: 8.4, totalScore: 8, letterGrade: null, gradePoint: 8, isExempt: false, earnedCredits: 4, course: { code: 'MA006', name: 'Giải tích - VN', credits: 4 } },
      { id: '65e0dc1f-94b6-49a8-9123-a175c0a12a75', midterm: 7.8, finalExam: 8.2, assignment: 8.9, totalScore: 8.3, letterGrade: null, gradePoint: 8.3, isExempt: false, earnedCredits: 3, course: { code: 'SS007', name: 'Triết học Mác - Lênin', credits: 3 } },
      { id: '5129b5ff-30d6-4a25-ad8c-ee3ae826f283', midterm: null, finalExam: 6.1, assignment: 6.8, totalScore: 6.4, letterGrade: null, gradePoint: 6.4, isExempt: false, earnedCredits: 2, course: { code: 'SS008', name: 'Kinh tế chính trị Mác - Lênin', credits: 2 } },
    ],
  },
  {
    id: 'sem-2022-2023-1',
    name: 'HK1 2022-2023',
    academicYear: '2022-2023',
    term: 1,
    startDate: '2022-09-05T00:00:00.000Z',
    endDate: '2022-12-31T23:59:59.000Z',
    isCurrent: false,
    summary: { gpa: 7.51, totalCredits: 9, totalEarnedCredits: 13, totalCourses: 3, totalSemesters: 1 },
    grades: [
      { id: '75fd0bbd-71fd-4f7c-929f-042a304d03d3', midterm: null, finalExam: null, assignment: null, totalScore: null, letterGrade: null, gradePoint: null, isExempt: true, earnedCredits: 4, course: { code: 'ENG02', name: 'Anh văn 2', credits: 4 } },
      { id: 'e9ec20e6-bb51-40e9-97d6-c02c554b0db1', midterm: 7.4, finalExam: 7.9, assignment: 8.1, totalScore: 7.8, letterGrade: null, gradePoint: 7.8, isExempt: false, earnedCredits: 4, course: { code: 'IT002', name: 'Lập trình hướng đối tượng', credits: 4 } },
      { id: '18f6aecd-30a4-4829-99bf-2c64953f9c30', midterm: 6.8, finalExam: 6.7, assignment: 7.2, totalScore: 6.9, letterGrade: null, gradePoint: 6.9, isExempt: false, earnedCredits: 4, course: { code: 'MA004', name: 'Cấu trúc rời rạc', credits: 4 } },
      { id: '46ffc120-2e5a-4848-87c7-0aaed3f1eacb', midterm: 8.7, finalExam: 9, assignment: null, totalScore: 8.8, letterGrade: null, gradePoint: 8.8, isExempt: false, earnedCredits: 1, course: { code: 'PE201', name: 'Giáo dục thể chất 1 - VN', credits: 1 } },
    ],
  },
];

export function getStudentSemesterScheduleById(semesterId: string) {
  return STUDENT_SEMESTER_SCHEDULES.find((item) => item.id === semesterId);
}

export function getStudentSemesterGradesById(semesterId: string) {
  return STUDENT_SEMESTER_GRADES.find((item) => item.id === semesterId);
}
