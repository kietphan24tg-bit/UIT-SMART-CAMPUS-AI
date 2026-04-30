# Danh sách Tính năng & Roadmap

## Tổng quan dự án

Smart Campus gồm **8 nhóm tính năng**, chia thành **3 giai đoạn** phát triển. Tuy nhiên tại thời điểm hiện tại, nhiều module đã có backend hoặc mobile trước khi toàn bộ roadmap hoàn tất, nên tài liệu này vừa phản ánh roadmap vừa ghi chú trạng thái thực tế.

---

## Phân quyền (Role-Based Access Control)

Hệ thống có **5 vai trò chính thức** với quyền hạn khác nhau:
- `student`
- `lecturer`
- `canteen_admin`
- `admin`
- `super_admin`

### Cập nhật RBAC hiện tại (04/2026)

- `admin/super_admin` có toàn quyền trên các tính năng đã live.
- Các năng lực chưa hoàn chỉnh được đánh dấu `upcoming/unsupported`, không coi là đã live.
- `canteen_admin` là vai trò chuyên biệt cho canteen, không gộp vào `admin`.

| Nhóm tính năng live | student | lecturer | canteen_admin | admin | super_admin |
| --- | :---: | :---: | :---: | :---: | :---: |
| Attendance management (`/attendance/session/*`, `/attendance/history`, `/attendance/lecturer/class-sections`) | ❌ | ✅ (scope lớp được phân công) | ❌ | ✅ | ✅ |
| Attendance check-in QR (`/attendance/checkin`, mobile scan) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Canteen admin mutations (hoàn tất đơn, CRUD category/product) | ❌ | ❌ | ✅ | ✅ | ✅ |
| Canteen consumer flow (đặt món/thanh toán cá nhân) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Grades lecturer entry | ❌ | ✅ | ❌ | ✅ | ✅ |
| Room booking approval / overrides | ❌ | ❌ | ❌ | ✅ | ✅ |
| Notification broadcast | ❌ | ✅ | ❌ | ✅ | ✅ |

### Bảng phân quyền tổng quan (roadmap tham khảo)

| Tính năng / Hành động | Student | Lecturer | Admin | Super Admin |
|------------------------|:-------:|:--------:|:-----:|:-----------:|
| **Xác thực** | | | | |
| Đăng ký tài khoản | ✅ | ✅ | — | — |
| Đăng nhập / Đăng xuất | ✅ | ✅ | ✅ | ✅ |
| **Hồ sơ cá nhân** | | | | |
| Xem thông tin của mình | ✅ | ✅ | ✅ | ✅ |
| Cập nhật thông tin của mình | ✅ | ✅ | ✅ | ✅ |
| Xem thông tin người khác | — | — | ✅ | ✅ |
| Quản lý tất cả tài khoản | — | — | ✅ | ✅ |
| **Thời khoá biểu** | | | | |
| Xem TKB của mình | ✅ | ✅ | — | ✅ |
| Tạo / sửa buổi học | — | roadmap | ✅ | ✅ |
| Quản lý học kỳ | — | — | ✅ | ✅ |
| **Điểm & GPA** | | | | |
| Xem điểm của mình | ✅ | — | — | ✅ |
| Nhập / sửa điểm sinh viên | — | ✅ | ✅ | ✅ |
| Xem điểm tất cả SV | — | ✅ (lớp mình) | ✅ | ✅ |
| **Thông báo** | | | | |
| Nhận thông báo | ✅ | ✅ | ✅ | ✅ |
| Gửi thông báo cho SV | — | ✅ | ✅ | ✅ |
| Gửi thông báo toàn trường | — | — | ✅ | ✅ |
| **Đăng ký môn học** | | | | |
| Xem danh sách môn mở | ✅ | — | ✅ | ✅ |
| Đăng ký / huỷ môn | ✅ | — | — | ✅ |
| Quản lý danh sách môn | — | — | ✅ | ✅ |
| **Đăng ký phòng học / lab** | | | | |
| Xem phòng trống | ✅ | ✅ | ✅ | ✅ |
| Đặt phòng | ✅ (cần duyệt) | ✅ | ✅ | ✅ |
| Duyệt yêu cầu đặt phòng | — | — | ✅ | ✅ |
| **AI Chatbot** | | | | |
| Sử dụng chatbot | ✅ | ✅ | ✅ | ✅ |
| Quản lý knowledge base | — | — | ✅ | ✅ |
| **Điểm danh (Smart Attendance)** | | | | |
| Scan QR điểm danh | ✅ | — | — | — |
| Tạo QR buổi học | — | ✅ | ✅ | ✅ |
| Xem báo cáo điểm danh | — | ✅ | ✅ | ✅ |
| **Sự kiện & Cộng đồng** | | | | |
| Xem / đăng ký sự kiện | ✅ | ✅ | ✅ | ✅ |
| Tạo / quản lý sự kiện | — | roadmap | roadmap | roadmap |
| **Bản đồ trường** | | | | |
| Xem bản đồ, tìm đường | roadmap | roadmap | roadmap | roadmap |
| **Thư viện** | | | | |
| Tìm sách, xem tình trạng | ✅ | ✅ | ✅ | ✅ |
| Mượn / trả / renew | ✅ | ✅ | ✅ | ✅ |
| Quản lý kho sách | — | — | ✅ | ✅ |
| **Bãi xe** | | | | |
| Xem chỗ trống | ✅ | ✅ | ✅ | ✅ |
| Quản lý bãi xe | — | — | ✅ | ✅ |
| **Cảnh báo cháy / IoT** | | | | |
| Nhận cảnh báo | ✅ | ✅ | ✅ | ✅ |
| Xem lịch sử / telemetry | — | — | ✅ | ✅ |

### Chi tiết vai trò

#### 🎓 Student (Sinh viên)
- Vai trò mặc định khi đăng ký
- Xem dữ liệu cá nhân: TKB, điểm, thông báo
- Đăng ký môn học, đặt phòng
- Sử dụng chatbot, thư viện, SOS
- Điểm danh bằng QR

#### 👨‍🏫 Lecturer (Giảng viên)
- Quản lý lớp học: nhập điểm, xem attendance, gửi thông báo
- Tạo QR điểm danh, xem báo cáo điểm danh
- Xem lịch dạy theo class meetings

#### 🍽️ Canteen Admin
- Quản lý menu, category, product
- Hoàn tất đơn và thao tác vận hành canteen

#### 🏫 Admin (Quản trị viên)
- Quản lý users, catalog, room booking queue, library, parking
- Gửi thông báo toàn trường
- Duyệt / từ chối luồng vận hành

#### 🔑 Super Admin (Quản trị hệ thống)
- Toàn quyền hệ thống
- Quản lý role và cấu hình nâng cao

---

## Giai đoạn phát triển

### Phase 1 — Nền tảng & Cơ bản (Sprint 1–4, ~8 tuần)

> Mục tiêu: Hoàn thành các tính năng **cốt lõi** mà sinh viên dùng hàng ngày.

#### 1.1 Xác thực (Authentication)
- **Độ ưu tiên**: 🔴 Cao
- **Độ khó**: Dễ
- **Acceptance criteria**:
  - [x] API: POST /auth/register
  - [x] API: POST /auth/login
  - [x] API: POST /auth/refresh
  - [x] API: POST /auth/logout

#### 1.2 Hồ sơ sinh viên
- **Độ ưu tiên**: 🔴 Cao
- **Độ khó**: Dễ
- **Acceptance criteria**:
  - [x] API: GET /users/me
  - [x] API: PATCH /users/me
  - [x] API: POST /users/me/avatar
  - [x] API: GET /users (Admin only)
  - [x] API: PATCH /users/:id/role (Super Admin only)

#### 1.3 Xem thời khoá biểu
- **Độ ưu tiên**: 🔴 Cao
- **Độ khó**: Dễ
- **Acceptance criteria**:
  - [x] API: GET /schedules
  - [x] API: GET /schedules/current
  - [x] API: GET /schedules/semesters/:semesterId
  - [x] Mobile: lịch học / lịch dạy cơ bản
  - [ ] Ghi chú: mobile schedule vẫn còn preview fallback khi API lỗi

#### 1.4 Xem điểm và GPA
- **Độ ưu tiên**: 🔴 Cao
- **Độ khó**: Dễ
- **Acceptance criteria**:
  - [x] API: GET /grades
  - [x] API: GET /grades/summary
  - [x] API: GET /grades/current
  - [x] API: GET /grades/semesters/:semesterId
  - [x] API: GET /grades/lecturer/class-sections
  - [x] API: GET /grades/class-sections/:id/sheet
  - [x] API: PUT /grades/class-sections/:id/weights
  - [x] API: PUT /grades/class-sections/:id/sheet
  - [x] Mobile: nhập điểm theo lớp cho giảng viên

#### 1.5 Thông báo
- **Độ ưu tiên**: 🟡 Trung bình
- **Độ khó**: Trung bình
- **Acceptance criteria**:
  - [x] API: GET /notifications
  - [x] API: GET /notifications/unread-count
  - [x] API: GET /notifications/:id
  - [x] API: PATCH /notifications/:id/read
  - [x] API: PATCH /notifications/read-all
  - [x] API: POST /notifications (Lecturer/Admin)
  - [x] API: POST /notifications/push-token
  - [x] API: DELETE /notifications/push-token

---

### Phase 2 — Tính năng Chính (Sprint 5–8, ~8 tuần)

> Mục tiêu: Bổ sung các tính năng **tương tác** quan trọng của hệ thống.

#### 2.1 AI Chatbot sinh viên
- **Độ ưu tiên**: 🟡 Trung bình
- **Độ khó**: Trung bình
- **Acceptance criteria**:
  - [x] API: POST /chatbot/query
  - [x] API: GET /chatbot/sessions
  - [x] API: GET /chatbot/sessions/:id/messages
  - [x] API: POST /chatbot/knowledge
  - [x] Mobile: giao diện chat cơ bản hoạt động
  - [ ] Mở rộng trải nghiệm và quản trị knowledge đầy đủ theo roadmap

#### 2.2 Sự kiện & Cộng đồng
- **Độ ưu tiên**: 🟡 Trung bình
- **Độ khó**: Trung bình
- **Acceptance criteria**:
  - [x] API: GET /events
  - [x] API: GET /events/:slug
  - [x] Mobile: danh sách và chi tiết bài viết sự kiện
  - [ ] CRUD / đăng ký / check-in mở rộng

#### 2.3 Đăng ký môn học
- **Độ ưu tiên**: 🟡 Trung bình
- **Độ khó**: Trung bình
- **Acceptance criteria**:
  - [x] API: GET /registrations/available-class-sections
  - [x] API: POST /registrations
  - [x] API: PATCH /registrations/:id/drop

#### 2.4 Đăng ký phòng học / phòng lab
- **Độ ưu tiên**: 🟢 Thấp
- **Độ khó**: Trung bình
- **Acceptance criteria**:
  - [x] API: POST /room-bookings
  - [x] API: GET /room-bookings/rooms/:roomCode/schedule
  - [x] API: GET /room-bookings/buildings
  - [x] API: GET /room-bookings/buildings/:buildingCode/rooms
  - [x] API: admin approval / reject / override flows

#### 2.5 Điểm danh thông minh (Smart Attendance)
- **Độ ưu tiên**: 🟡 Trung bình
- **Độ khó**: Trung bình
- **Acceptance criteria**:
  - [x] API: POST /attendance/session/start
  - [x] API: POST /attendance/session/:id/stop
  - [x] API: GET /attendance/session/:id/qr-token
  - [x] API: POST /attendance/checkin
  - [x] API: GET /attendance/history
  - [x] API: export Excel

---

### Phase 3 — Nâng cao & IoT (Sprint 9–12, ~8 tuần)

> Mục tiêu: Các tính năng **thông minh**, tích hợp IoT và dữ liệu bên ngoài.

#### 3.1 Bản đồ trường (Campus Navigation)
- **Độ ưu tiên**: 🟢 Thấp
- **Độ khó**: Trung bình–Khó
- [x] Mobile: đã có màn hình bản đồ/tour campus tích hợp
- [ ] Bản đồ campus native + chỉ đường nội bộ đầy đủ theo roadmap vẫn chưa hoàn thiện

#### 3.2 Thư viện Thông minh (Smart Library)
- **Độ ưu tiên**: 🟢 Thấp
- **Độ khó**: Trung bình
- **Acceptance criteria**:
  - [x] API: GET /library/books
  - [x] API: reservation / renew / admin inventory flows
  - [x] Mobile: giao diện thư viện cơ bản hoạt động
  - [ ] Mobile flow hoàn chỉnh theo roadmap đầy đủ

#### 3.3 Bãi xe Thông minh (Smart Parking)
- **Độ ưu tiên**: 🟢 Thấp
- **Độ khó**: Khó (IoT)
- **Acceptance criteria**:
  - [x] API: GET /parking/status
  - [x] API: POST /iot/parking/scan
  - [x] API: POST /iot/telemetry
  - [x] API: payment onboarding cho parking subscription

#### 3.4 Phòng học Thông minh (Smart Classroom)
- **Độ ưu tiên**: 🟢 Thấp
- **Độ khó**: Khó (IoT)
- [x] API: parking telemetry / scan / fire alert đã có
- [x] Mobile: đã có một phần giao diện vận hành liên quan parking/SOS/room operations
- [ ] Điều khiển thiết bị IoT phòng học theo roadmap gốc vẫn chưa hoàn thiện

#### 3.5 Cảnh báo cháy & Thông báo khẩn
- **Độ ưu tiên**: 🟡 Trung bình
- **Độ khó**: Khó
- **Acceptance criteria**:
  - [x] API: POST /safety/fire-alerts
  - [x] API: GET /safety/fire-alerts
  - [x] Backend: lưu telemetry / fire alert
  - [ ] Mobile flow cảnh báo khẩn end-to-end hoàn chỉnh

---

## Tổng kết Roadmap

```
Phase 1 (Sprint 1–4)                Phase 2 (Sprint 5–8)              Phase 3 (Sprint 9–12)
─────────────────────               ─────────────────────              ─────────────────────
✅ Xác thực (Auth)                  ✅ AI Chatbot                     🟡 Bản đồ trường
✅ Hồ sơ sinh viên                  ✅ Sự kiện & Cộng đồng           ✅ Thư viện Thông minh
✅ Thời khoá biểu                   ✅ Đăng ký môn học               🟡 Bãi xe Thông minh
✅ Điểm & GPA                       ✅ Đăng ký phòng học/lab         🟡 IoT vận hành / parking / safety
✅ Thông báo                        ✅ Điểm danh QR                  ✅ Cảnh báo cháy API
```

> ✅ = đã có phần chính trong code hiện tại  
> 🟡 = đã có một phần / còn mở rộng  
> 🔜 = chưa hoàn thiện

## Ước lượng effort theo vai trò

| Phase | Backend | Mobile | Ghi chú |
|-------|---------|--------|---------|
| Phase 1 | 3–4 tuần | 4–5 tuần | Backend đi trước, Mobile theo sau |
| Phase 2 | 4–5 tuần | 4–5 tuần | Song song backend + mobile |
| Phase 3 | 3–4 tuần | 3–4 tuần | Cần thêm thời gian cho IoT |
