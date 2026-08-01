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

- `users` (có `email_verified_at`)
- `registration_challenges` (pending registration)
- `refresh_tokens`
- `password_reset_otps`
- `user_device_push_tokens`

Không có user chưa xác minh trong `users`. `POST /auth/register` chỉ ghi một pending row vào `registration_challenges`; `POST /auth/register/verify` mới tạo user thật.

`users.email_verified_at`:

- account mới: đặt `now()` trong transaction verify OTP,
- account tồn tại trước direct cutover: normalize `lower(btrim(email))`, sau đó backfill bằng `COALESCE(email_verified_at, updated_at, created_at, CURRENT_TIMESTAMP)` để giữ nguyên login, refresh token và access hiện hữu,
- seed/admin-created account được tin cậy phải gán `email_verified_at` rõ ràng; migration backfill chạy trước seed trên database reset nên không thể tự đánh dấu các row được seed về sau,
- không dùng `is_active` thay cho verification; `is_active` tiếp tục mang nghĩa khóa/mở tài khoản quản trị.

`registration_challenges` lưu:

- `id`, email đã trim/lowercase, `student_id`, `password_hash`, `first_name`, `last_name`,
- `otp_hash`, `expires_at`, `resend_available_at`, `failed_attempts`, `last_attempt_at`, `last_sent_at`, `consumed_at`,
- `created_at`, `updated_at`.

Ràng buộc dữ liệu:

- unique index trên `email` bảo đảm mỗi email normalized chỉ có một challenge; non-unique indexes hỗ trợ tra cứu theo `(student_id, consumed_at, expires_at)` và cleanup theo `expires_at`,
- chỉ nhận domain chính xác `gm.uit.edu.vn` hoặc `uit.edu.vn`,
- password và OTP chỉ lưu dạng hash; không ghi plaintext vào DB/log,
- verify phải chạy transaction để claim challenge, kiểm tra lại unique với `users`, tạo user + refresh token rồi xóa challenge chứa hash nhạy cảm,
- resend phải rotate OTP atomically; code cũ hết hiệu lực ngay,
- registration cleanup chỉ xóa challenge hết hạn/đã consume, không quét/xóa `users` theo `email_verified_at`.

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

### Direct cutover cho OTP đăng ký

Đây là breaking change của `POST /auth/register`: response đổi từ access/refresh token sang OTP challenge. Không duy trì song song contract cũ trên cùng endpoint.

Thứ tự bắt buộc trong maintenance window:

1. Backup PostgreSQL và dừng registration writes từ API cũ.
2. Chạy preflight; xử lý duplicate email sau normalize và inventory email ngoài domain trước khi migrate.
3. Thêm `users.email_verified_at` nullable, backfill toàn bộ user hiện hữu, rồi tạo `registration_challenges` cùng các index tra cứu/cleanup.
4. Deploy API mới; chỉ API mới được mở registration writes.
5. Phát hành/ép minimum version mobile hỗ trợ challenge → verify/resend trước khi mở lại đăng ký.
6. Smoke test account cũ login/refresh, đăng ký mới, verify, resend và quên mật khẩu trên cả hai domain.

Preflight SQL chạy ở chế độ read-only trên bản sao gần production hoặc trực tiếp trong maintenance window:

```sql
BEGIN READ ONLY;

-- Case/whitespace variants sẽ xung đột sau normalize.
SELECT lower(btrim(email)) AS normalized_email, count(*)
FROM users
GROUP BY lower(btrim(email))
HAVING count(*) > 1;

-- Inventory các row sẽ được migration normalize; kết quả này không được
-- phát hiện bởi truy vấn duplicate ở trên nếu mỗi email chỉ có một row.
SELECT id, email, lower(btrim(email)) AS normalized_email
FROM users
WHERE email <> lower(btrim(email));

-- Account ngoài policy vẫn được login nhưng không thể bắt đầu quên mật khẩu.
SELECT id, email, role, is_active
FROM users
WHERE split_part(lower(btrim(email)), '@', 2)
      NOT IN ('gm.uit.edu.vn', 'uit.edu.vn');

-- Student data cần xử lý trước khi dùng lại unique MSSV ở pending table.
SELECT id, email, student_id
FROM users
WHERE role = 'student'
  AND (student_id IS NULL OR student_id !~ '^[0-9]{8}$');

SELECT role, is_active, count(*)
FROM users
GROUP BY role, is_active
ORDER BY role, is_active;

COMMIT;
```

Migration/backfill phải kiểm chứng ngay sau deploy:

```sql
SELECT count(*) AS legacy_users_not_backfilled
FROM users
WHERE email_verified_at IS NULL;

SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('users', 'registration_challenges')
ORDER BY tablename, indexname;
```

### Risk và rollback

- Rủi ro lớn nhất là old mobile vẫn kỳ vọng token từ `/auth/register`; direct cutover phải đi cùng force-update/minimum-version gate.
- SMTP outage làm cả đăng ký mới và quên mật khẩu không hoàn tất. Production không được fallback `previewCode`.
- `registration_challenges.email` có DB unique constraint, nhưng `student_id` không unique ở pending table. Hai email khác nhau vẫn có thể race cùng MSSV; unique `users.student_id` và transaction chỉ cho một account hoàn tất, account còn lại nhận `409`.
- OTP chỉ chứng minh quyền truy cập mailbox UIT. Theo policy hiện tại không đối chiếu local-part email với MSSV, vì vậy nó không tự chứng minh mailbox và MSSV thuộc cùng một sinh viên.
- Edge proxy phải rate-limit endpoint gửi/verify OTP; cooldown email/MSSV và tối đa năm lần sai không thay thế giới hạn theo nguồn truy cập.
- Không siết domain ở login/refresh. Account cũ đã backfill vẫn truy cập bình thường; account ngoài hai domain chỉ mất khả năng bắt đầu password reset theo policy mới.
- Rollback ưu tiên app-first: dừng registration, rollback API/mobile, nhưng giữ nguyên cột/table additive để không mất audit/pending data. Backfill `email_verified_at` không cần đảo ngược.
- Chỉ drop `registration_challenges`/`email_verified_at` sau khi export dữ liệu, xác nhận không cần resume challenge và có backup. Repo dùng forward Prisma migration, không có down migration tự động.

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
