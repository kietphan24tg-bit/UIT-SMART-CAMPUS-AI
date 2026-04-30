# Database Schema (Smart Campus Demo)

## Tổng quan

- DB: PostgreSQL
- ORM: Prisma
- Nguồn sự thật schema: `apps/api/prisma/schema.prisma`
- Migrations: `apps/api/prisma/migrations/*`
- Seed dữ liệu demo thật: `apps/api/prisma/seed.ts`

Mục tiêu demo hiện tại: đa số luồng chính dùng dữ liệu thật từ DB qua API. Tuy vậy, mobile schedule hiện vẫn còn preview fallback nếu request backend lỗi.

## Lệnh nhanh cho môi trường demo

Từ root project:

```bash
pnpm db:reset:demo
```

Lệnh này sẽ:

1. `prisma migrate reset --force --skip-generate`
2. chạy seed để tạo dữ liệu demo chuẩn role-based.

## Nhóm bảng chính theo nghiệp vụ

### 1) Auth + User

- `users`
- `refresh_tokens`
- `password_reset_otps`
- `user_device_push_tokens`

`users.role` dùng enum:

- `student`
- `lecturer`
- `canteen_admin`
- `admin`
- `super_admin`

### 2) Academic Core

- `semesters`
- `courses`
- `class_sections` (có `lecturer_id`, `capacity`, `registration_open`)
- `class_meetings` (lịch lớp thật theo thứ/giờ/phòng)
- `class_enrollments` (đăng ký học phần theo student)
- `schedule_items` (TKB cá nhân, đồng bộ theo enrollment)
- `grades`

### 3) QR Attendance

- `attendance_sessions`
- `attendance_records`

Ràng buộc nghiệp vụ:

- Lecturer chỉ mở session cho `class_sections` mình phụ trách.
- Student chỉ check-in khi có `class_enrollments.status = active` của lớp đó.

### 4) Room Booking

- `buildings`
- `floors`
- `rooms`
- `time_slots`
- `room_bookings`
- `room_schedule_overrides`

`room_bookings.status`:

- `pending`
- `approved`
- `booked`
- `maintenance`
- `rejected`
- `cancelled`

Các trạng thái chiếm phòng khi render lịch: `approved`, `booked`, `maintenance`, cộng thêm các override admin.

### 5) Events & Community

- `events`
- `event_registrations`

`events.status`:

- `planned`
- `open`
- `closed`

### 6) Parking + IoT

- `vehicles`
- `parking_subscriptions`
- `payment_transactions`
- `parking_sessions`
- `parking_slots`
- `telemetry_snapshots`
- `fire_alerts`

### 7) Library + Canteen + SOS

- nhóm bảng thư viện cho sách / bản sao / mượn-trả / reservation
- nhóm bảng canteen cho category / product / order / thanh toán
- nhóm bảng SOS cho yêu cầu khẩn cấp

## Tài khoản seed demo

Mật khẩu chung: `Password123`

- `superadmin@uit.edu.vn`
- `admin@uit.edu.vn`
- `lecturer@uit.edu.vn`
- `student@gm.uit.edu.vn`

Seed hiện tạo dữ liệu liên kết giữa:

- catalog học phần/lớp/lịch học,
- enrollment student,
- schedule items theo enrollment active,
- events + registrations,
- room bookings + timeslots + buildings/rooms,
- dữ liệu grades / attendance / notifications / parking / library / canteen cho demo.

## Quy tắc migration

### Dev

```bash
cd apps/api
pnpm db:migrate
```

### Production/CI

```bash
cd apps/api
pnpm db:migrate:prod
```

### Seed

```bash
cd apps/api
pnpm db:seed
```

## Ghi chú RBAC ở mức dữ liệu/API

- `registrations/*`: chỉ `student`.
- `attendance/session/start|stop|history|records|lecturer/class-sections`: `lecturer`, `admin`, `super_admin`.
- `attendance/checkin|me/history`: chỉ `student`.
- `catalog/*`: `admin`, `super_admin`.
- `room-bookings` queue duyệt và override: `admin`, `super_admin`.
- `grades` lecturer entry flow: `lecturer`, `admin`, `super_admin`.
- `notifications` broadcast: `lecturer`, `admin`, `super_admin`.

## Kiểm tra nhanh sau reset seed

1. Student đăng nhập:
   - xem TKB từ backend,
   - đăng ký/hủy học phần,
   - quét QR lớp đã enroll.
2. Lecturer đăng nhập:
   - thấy lớp được gán,
   - mở/đóng session QR,
   - xem records/history,
   - nhập điểm theo class section.
3. Admin/Super Admin:
   - quản trị catalog,
   - duyệt room booking pending,
   - thao tác override lịch phòng nếu cần.
