# Danh sách Tính năng & Roadmap

## Tổng quan dự án

Smart Campus gồm **8 nhóm tính năng**, chia thành **3 giai đoạn** phát triển. Các tính năng cơ bản và chủ yếu sẽ được triển khai trước, các tính năng nâng cao và IoT triển khai sau.

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
| Grades trên mobile | ✅ `live` | ❌ `unsupported` | ❌ `unsupported` | ❌ `unsupported` | ❌ `unsupported` |

### Bảng phân quyền tổng quan (roadmap tham khảo)

| Tính năng / Hành động | Student | Lecturer | Admin | Super Admin |
|------------------------|:-------:|:--------:|:-----:|:-----------:|
| **Xác thực** | | | | |
| Đăng ký tài khoản | ✅ | ✅ | — | — |
| Đăng nhập / Đăng xuất | ✅ | ✅ | ✅ | ✅ |
| **Hồ sơ cá nhân** | | | | |
| Xem thông tin của mình | ✅ | ✅ | ✅ | ✅ |
| Cập nhật thông tin của mình | ✅ | ✅ | ✅ | ✅ |
| Xem thông tin người khác | — | ✅ (SV trong lớp) | ✅ | ✅ |
| Quản lý tất cả tài khoản | — | — | ✅ | ✅ |
| **Thời khoá biểu** | | | | |
| Xem TKB của mình | ✅ | ✅ | — | ✅ |
| Tạo / sửa buổi học | — | ✅ | ✅ | ✅ |
| Quản lý học kỳ | — | — | ✅ | ✅ |
| **Điểm & GPA** | | | | |
| Xem điểm của mình | ✅ | — | — | ✅ |
| Nhập / sửa điểm sinh viên | — | ✅ | ✅ | ✅ |
| Xem điểm tất cả SV | — | ✅ (lớp mình) | ✅ | ✅ |
| **Thông báo** | | | | |
| Nhận thông báo | ✅ | ✅ | ✅ | ✅ |
| Gửi thông báo cho SV | — | ✅ (lớp mình) | ✅ | ✅ |
| Gửi thông báo toàn trường | — | — | ✅ | ✅ |
| **Đăng ký môn học** | | | | |
| Xem danh sách môn mở | ✅ | ✅ | ✅ | ✅ |
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
| Xem báo cáo điểm danh | — | ✅ (lớp mình) | ✅ | ✅ |
| **Sự kiện & Cộng đồng** | | | | |
| Xem / đăng ký sự kiện | ✅ | ✅ | ✅ | ✅ |
| Tạo / quản lý sự kiện | — | ✅ | ✅ | ✅ |
| Check-in sự kiện (QR) | ✅ | ✅ | ✅ | ✅ |
| **Bản đồ trường** | | | | |
| Xem bản đồ, tìm đường | ✅ | ✅ | ✅ | ✅ |
| Quản lý dữ liệu bản đồ | — | — | ✅ | ✅ |
| **Thư viện** | | | | |
| Tìm sách, xem tình trạng | ✅ | ✅ | ✅ | ✅ |
| Mượn / trả sách | ✅ | ✅ | — | ✅ |
| Quản lý kho sách | — | — | ✅ | ✅ |
| **Bãi xe** | | | | |
| Xem chỗ trống | ✅ | ✅ | ✅ | ✅ |
| Quản lý bãi xe | — | — | ✅ | ✅ |
| **Phòng học thông minh (IoT)** | | | | |
| Xem trạng thái phòng | ✅ | ✅ | ✅ | ✅ |
| Điều khiển thiết bị | — | ✅ (phòng mình) | ✅ | ✅ |
| Cấu hình hệ thống IoT | — | — | — | ✅ |
| **Cảnh báo cháy (PCCC — phần cứng)** | | | | |
| Nhận cảnh báo / thông báo khẩn cháy | ✅ | ✅ | ✅ | ✅ |
| Xem lịch sử / vị trí cảm biến (nếu có) | — | — | ✅ | ✅ |
| Cấu hình tích hợp cảm biến / gateway | — | — | — | ✅ |

### Chi tiết vai trò

#### 🎓 Student (Sinh viên)
- Vai trò mặc định khi đăng ký
- Xem dữ liệu cá nhân: TKB, điểm, thông báo
- Đăng ký môn học, đặt phòng (cần admin duyệt)
- Sử dụng chatbot, bản đồ, thư viện
- Điểm danh bằng QR, check-in sự kiện

#### 👨‍🏫 Lecturer (Giảng viên)
- Được admin tạo tài khoản hoặc tự đăng ký rồi admin nâng quyền
- Quản lý lớp học: tạo buổi học, nhập điểm, gửi thông báo
- Tạo QR điểm danh, xem báo cáo điểm danh
- Tạo và quản lý sự kiện
- Điều khiển thiết bị IoT trong phòng dạy

#### 🏫 Admin (Quản trị viên)
- Quản lý toàn bộ dữ liệu: users, courses, semesters, phòng, sách
- Duyệt yêu cầu đặt phòng
- Gửi thông báo toàn trường
- Quản lý sự kiện, knowledge base chatbot
- Quản lý bãi xe, thư viện

#### 🔑 Super Admin (Quản trị hệ thống)
- Toàn quyền hệ thống
- Cấu hình hệ thống, IoT
- Quản lý vai trò và quyền hạn
- Truy cập tất cả dữ liệu

---

## Giai đoạn phát triển

### Phase 1 — Nền tảng & Cơ bản (Sprint 1–4, ~8 tuần)

> Mục tiêu: Hoàn thành các tính năng **cốt lõi** mà sinh viên dùng hàng ngày.

#### 1.1 Xác thực (Authentication)
- **Độ ưu tiên**: 🔴 Cao
- **Độ khó**: Dễ
- **Mô tả**: Đăng nhập, đăng ký, refresh token, đăng xuất
- **Phân quyền**: Tất cả vai trò
- **User stories**:
  - Sinh viên có thể đăng ký tài khoản với email UIT và MSSV
  - Sinh viên có thể đăng nhập bằng email và mật khẩu
  - Hệ thống tự động refresh token khi hết hạn
  - Sinh viên có thể đăng xuất trên tất cả thiết bị
- **Acceptance criteria**:
  - [x] API: POST /auth/register
  - [x] API: POST /auth/login
  - [x] API: POST /auth/refresh
  - [x] API: POST /auth/logout
  - [ ] Mobile: Màn hình đăng nhập
  - [ ] Mobile: Màn hình đăng ký
  - [ ] Mobile: Lưu token vào SecureStore
  - [ ] Mobile: Tự động redirect khi đã đăng nhập

#### 1.2 Hồ sơ sinh viên
- **Độ ưu tiên**: 🔴 Cao
- **Độ khó**: Dễ
- **Mô tả**: Xem và cập nhật thông tin cá nhân
- **Phân quyền**: Student (xem/sửa của mình), Lecturer (xem SV lớp mình), Admin (quản lý tất cả)
- **User stories**:
  - Sinh viên có thể xem thông tin cá nhân (họ tên, MSSV, khoa, ngành)
  - Sinh viên có thể cập nhật số điện thoại, địa chỉ, ảnh đại diện
  - Admin có thể xem và quản lý tất cả tài khoản
- **Acceptance criteria**:
  - [x] API: GET /users/me
  - [x] API: PATCH /users/me
  - [ ] API: GET /users (Admin only)
  - [ ] API: PATCH /users/:id/role (Super Admin only)
  - [ ] Mobile: Màn hình profile
  - [ ] Mobile: Form cập nhật thông tin

#### 1.3 Xem thời khoá biểu
- **Độ ưu tiên**: 🔴 Cao
- **Độ khó**: Dễ
- **Mô tả**: Hiển thị thời khoá biểu theo tuần/ngày, nhắc lịch deadline
- **Phân quyền**: Student (xem TKB mình), Lecturer (tạo/sửa buổi học), Admin (quản lý)
- **User stories**:
  - Sinh viên có thể xem thời khoá biểu của học kỳ hiện tại
  - Sinh viên có thể chuyển đổi giữa các học kỳ
  - Sinh viên nhận push notification khi đổi phòng học
  - Sinh viên nhận nhắc lịch deadline đồ án
  - Giảng viên có thể tạo và chỉnh sửa buổi học
- **Acceptance criteria**:
  - [x] API: GET /schedules
  - [x] API: GET /schedules/semesters
  - [x] API: GET /schedules/:id
  - [ ] API: POST /schedules (Lecturer/Admin)
  - [ ] API: PATCH /schedules/:id (Lecturer/Admin)
  - [ ] Mobile: Calendar view theo tuần
  - [ ] Mobile: Danh sách buổi học theo ngày
  - [ ] Mobile: Push notification khi đổi phòng
  - [ ] Mobile: Nhắc deadline đồ án

#### 1.4 Xem điểm và GPA
- **Độ ưu tiên**: 🔴 Cao
- **Độ khó**: Dễ
- **Mô tả**: Xem bảng điểm và tính GPA
- **Phân quyền**: Student (xem điểm mình), Lecturer (nhập/xem điểm lớp mình), Admin (xem tất cả)
- **User stories**:
  - Sinh viên có thể xem bảng điểm tất cả môn theo từng kỳ
  - Sinh viên có thể xem GPA tích luỹ và GPA từng kỳ
  - Sinh viên nhận thông báo khi có điểm mới
  - Giảng viên có thể nhập và sửa điểm cho sinh viên
- **Acceptance criteria**:
  - [x] API: GET /grades
  - [x] API: GET /grades/gpa
  - [x] API: GET /grades/lecturer/class-sections (Lecturer/Admin)
  - [x] API: GET /grades/class-sections/:id/sheet (Lecturer/Admin)
  - [x] API: PUT /grades/class-sections/:id/weights (Lecturer/Admin)
  - [x] API: PUT /grades/class-sections/:id/sheet (Lecturer/Admin)
  - [x] Mobile: Nhập điểm theo lớp cho giảng viên
  - [ ] Mobile: Bảng điểm theo kỳ
  - [ ] Mobile: GPA summary card
  - [ ] Mobile: Filter theo học kỳ

#### 1.5 Thông báo
- **Độ ưu tiên**: 🟡 Trung bình
- **Độ khó**: Trung bình
- **Mô tả**: Nhận thông báo từ hệ thống, khoa, giảng viên
- **Phân quyền**: Student (nhận), Lecturer (gửi cho lớp), Admin (gửi toàn trường)
- **User stories**:
  - Sinh viên nhận thông báo khi có thay đổi lịch học
  - Sinh viên nhận thông báo khi có điểm mới
  - Sinh viên nhận thông báo sự kiện UIT
  - Giảng viên gửi thông báo cho sinh viên lớp mình
  - Admin gửi thông báo toàn trường
  - Sinh viên có thể đánh dấu đã đọc / đọc tất cả
- **Acceptance criteria**:
  - [x] API: GET /notifications
  - [x] API: GET /notifications/unread-count
  - [x] API: PATCH /notifications/:id/read
  - [x] API: PATCH /notifications/read-all
  - [ ] API: POST /notifications (Lecturer/Admin)
  - [ ] Mobile: Danh sách thông báo
  - [ ] Mobile: Badge số thông báo chưa đọc
  - [ ] Push notification (Firebase)

---

### Phase 2 — Tính năng Chính (Sprint 5–8, ~8 tuần)

> Mục tiêu: Bổ sung các tính năng **tương tác** quan trọng của hệ thống.

#### 2.1 AI Chatbot sinh viên
- **Độ ưu tiên**: 🟡 Trung bình
- **Độ khó**: Trung bình
- **Mô tả**: Trợ lý ảo 24/7 trả lời câu hỏi sinh viên
- **Phân quyền**: Tất cả (sử dụng), Admin (quản lý knowledge base)
- **User stories**:
  - Sinh viên hỏi: "Phòng A101 ở đâu?", "Deadline đăng ký môn?", "Thủ tục xin giấy xác nhận?"
  - Chatbot trả lời dựa trên knowledge base của trường
  - Admin cập nhật knowledge base
- **Acceptance criteria**:
  - [ ] API: POST /chatbot/message
  - [ ] Tích hợp OpenAI API
  - [ ] Knowledge base cơ bản về UIT
  - [ ] Mobile: Giao diện chat
  - [ ] API: CRUD /chatbot/knowledge (Admin)

#### 2.2 Sự kiện & Cộng đồng (Event & Community)
- **Độ ưu tiên**: 🟡 Trung bình
- **Độ khó**: Trung bình
- **Mô tả**: Quản lý hoạt động sinh viên, workshop, CLB
- **Phân quyền**: Student (xem/đăng ký), Lecturer (tạo sự kiện), Admin (quản lý tất cả)
- **User stories**:
  - Sinh viên xem danh sách sự kiện / workshop sắp tới
  - Sinh viên đăng ký tham gia sự kiện
  - Sinh viên check-in sự kiện bằng QR
  - Sinh viên đăng ký CLB
  - Giảng viên / Admin tạo và quản lý sự kiện
- **Acceptance criteria**:
  - [ ] API: CRUD /events
  - [ ] API: POST /events/:id/register
  - [ ] API: POST /events/:id/checkin
  - [ ] API: CRUD /clubs
  - [ ] Mobile: Danh sách sự kiện
  - [ ] Mobile: Chi tiết & đăng ký sự kiện
  - [ ] Mobile: QR check-in sự kiện

#### 2.3 Đăng ký môn học
- **Độ ưu tiên**: 🟡 Trung bình
- **Độ khó**: Trung bình
- **Mô tả**: Xem và đăng ký môn học trong kỳ
- **Phân quyền**: Student (đăng ký/huỷ), Admin (quản lý danh sách môn mở)
- **User stories**:
  - Sinh viên xem danh sách môn học mở trong kỳ đăng ký
  - Sinh viên đăng ký / huỷ đăng ký môn học
  - Hệ thống kiểm tra tiên quyết và sĩ số tối đa
  - Admin mở / đóng đợt đăng ký
- **Acceptance criteria**:
  - [ ] API: GET /registrations/available-courses
  - [ ] API: POST /registrations
  - [ ] API: DELETE /registrations/:id
  - [ ] Mobile: Danh sách môn mở
  - [ ] Mobile: Đăng ký / huỷ môn
  - [ ] Mobile: Kiểm tra tiên quyết

#### 2.4 Đăng ký phòng học / phòng lab
- **Độ ưu tiên**: 🟢 Thấp
- **Độ khó**: Trung bình
- **Mô tả**: Sinh viên và giảng viên đặt phòng trống
- **Phân quyền**: Student (đặt, cần duyệt), Lecturer (đặt trực tiếp), Admin (duyệt, quản lý)
- **User stories**:
  - Sinh viên / giảng viên xem phòng trống theo ngày giờ
  - Sinh viên gửi yêu cầu đặt phòng (cần admin duyệt)
  - Giảng viên đặt phòng trực tiếp
  - Admin duyệt / từ chối yêu cầu
- **Acceptance criteria**:
  - [ ] API: GET /rooms/available
  - [ ] API: POST /room-bookings
  - [ ] API: PATCH /room-bookings/:id/approve (Admin)
  - [ ] Mobile: Xem phòng trống
  - [ ] Mobile: Form đặt phòng
  - [ ] Mobile: Danh sách yêu cầu (Admin)

#### 2.5 Điểm danh thông minh (Smart Attendance)
- **Độ ưu tiên**: 🟡 Trung bình
- **Độ khó**: Trung bình
- **Mô tả**: Thay thế điểm danh thủ công bằng QR code
- **Phân quyền**: Student (scan QR), Lecturer (tạo QR, xem báo cáo), Admin (xem tất cả)
- **Công nghệ**: QR code check-in (Phase 2), Face recognition & BLE/GPS proximity (Phase 3+)
- **User stories**:
  - Giảng viên tạo QR code cho buổi học (có thời hạn)
  - Sinh viên scan QR để điểm danh
  - Hệ thống tự động lưu kết quả
  - Giảng viên xem báo cáo điểm danh theo buổi / cả kỳ
  - Giảng viên không cần gọi tên
- **Acceptance criteria**:
  - [ ] API: POST /attendance/sessions (Lecturer)
  - [ ] API: POST /attendance/checkin (Student — QR payload)
  - [ ] API: GET /attendance/reports (Lecturer/Admin)
  - [ ] Mobile: Tạo QR (Lecturer)
  - [ ] Mobile: Scan QR (Student)
  - [ ] Mobile: Báo cáo điểm danh

---

### Phase 3 — Nâng cao & IoT (Sprint 9–12, ~8 tuần)

> Mục tiêu: Các tính năng **thông minh**, tích hợp IoT và dữ liệu bên ngoài.

#### 3.1 Bản đồ trường (Campus Navigation)
- **Độ ưu tiên**: 🟢 Thấp
- **Độ khó**: Trung bình–Khó
- **Mô tả**: Bản đồ 2D khuôn viên trường, tìm và chỉ đường
- **Phân quyền**: Tất cả (xem), Admin (quản lý dữ liệu bản đồ)
- **User stories**:
  - Sinh viên tìm phòng học, phòng lab, căn tin, thư viện trên bản đồ
  - App chỉ đường trong campus
  - Sinh viên mới dùng để làm quen khuôn viên
- **Acceptance criteria**:
  - [ ] API: GET /maps/locations
  - [ ] API: GET /maps/directions
  - [ ] Mobile: Bản đồ 2D tương tác
  - [ ] Mobile: Tìm kiếm địa điểm
  - [ ] Mobile: Chỉ đường

#### 3.2 Thư viện Thông minh (Smart Library)
- **Độ ưu tiên**: 🟢 Thấp
- **Độ khó**: Trung bình
- **Mô tả**: Tìm sách, xem tình trạng, mượn/trả, đặt chỗ ngồi
- **Phân quyền**: Student/Lecturer (tìm, mượn/trả, đặt chỗ), Admin (quản lý kho sách)
- **User stories**:
  - Sinh viên tìm sách trên app
  - Xem tình trạng còn / hết
  - Mượn / trả sách (tự động bằng RFID — tuỳ chọn)
  - Đặt chỗ ngồi học
- **Acceptance criteria**:
  - [ ] API: GET /library/books
  - [ ] API: POST /library/borrow
  - [ ] API: POST /library/return
  - [ ] API: POST /library/seats/book
  - [ ] Mobile: Tìm kiếm sách
  - [ ] Mobile: Mượn / trả
  - [ ] Mobile: Đặt chỗ ngồi

#### 3.3 Bãi xe Thông minh (Smart Parking)
- **Độ ưu tiên**: 🟢 Thấp
- **Độ khó**: Khó (IoT)
- **Mô tả**: Quản lý bãi xe, hiển thị chỗ trống, nhận diện biển số
- **Phân quyền**: Tất cả (xem chỗ trống), Admin (quản lý)
- **Công nghệ**: Cảm biến IoT, camera nhận diện biển số xe
- **User stories**:
  - Sinh viên xem số chỗ trống trên app trước khi đến trường
  - Camera tự động nhận diện biển số xe
  - Hệ thống ghi nhận xe vào / ra
- **Acceptance criteria**:
  - [ ] API: GET /parking/status
  - [ ] API: POST /parking/entry (IoT trigger)
  - [ ] API: POST /parking/exit (IoT trigger)
  - [ ] Mobile: Xem chỗ trống
  - [ ] Tích hợp cảm biến / camera

#### 3.4 Phòng học Thông minh (Smart Classroom)
- **Độ ưu tiên**: 🟢 Thấp
- **Độ khó**: Khó (IoT)
- **Mô tả**: Phòng học thông minh với điều khiển IoT
- **Phân quyền**: Lecturer (điều khiển phòng mình), Admin (quản lý), Super Admin (cấu hình)
- **Công nghệ**: IoT sensors, **đèn LED để demo**
- **User stories**:
  - Tự động bật máy chiếu khi có lớp
  - Điều khiển đèn + máy lạnh qua IoT
  - Giảng viên điều khiển thiết bị qua app
  - **Demo**: Dùng 1 đèn LED bật/tắt qua app để minh hoạ
- **Acceptance criteria**:
  - [ ] API: GET /classrooms/:id/devices
  - [ ] API: POST /classrooms/:id/devices/:deviceId/control
  - [ ] Tích hợp IoT (MQTT / HTTP)
  - [ ] Mobile: Điều khiển thiết bị
  - [ ] **Demo: Đèn LED bật/tắt qua app**

#### 3.5 Cảnh báo cháy & Thông báo khẩn (Fire / Emergency Alert)
- **Độ ưu tiên**: 🟡 Trung bình (an toàn — lên cao khi triển khai thật)
- **Độ khó**: Khó (phần cứng + tích hợp)
- **Mô tả**: Khi cảm biến/gateway phát hiện cháy (hoặc tín hiệu khẩn từ hệ thống PCCN), backend nhận sự kiện và đẩy thông báo khẩn tới app (in-app + push), kèm thông tin tối thiểu: khu vực/tòa/phòng (tuỳ cấu hình thiết bị).
- **Phân quyền**: Tất cả vai trò (nhận cảnh báo); Admin/Super Admin (xem log, cấu hình tích hợp nếu có).
- **Công nghệ** (gợi ý): Cảm biến khói/nhiệt hoặc module báo cháy → gateway (MQTT/HTTP webhook) → API backend → FCM / kênh thông báo hiện có; demo có thể dùng nút/giả lập tín hiệu thay cảm biến thật.
- **User stories**:
  - Người dùng nhận thông báo khẩn ngay khi có sự kiện cháy được xác nhận từ phần cứng.
  - Thông báo hiển thị rõ mức độ khẩn và khu vực liên quan (theo dữ liệu từ thiết bị).
  - Admin có thể xem (và sau này cấu hình) mapping thiết bị ↔ địa điểm trên campus.
- **Acceptance criteria**:
  - [ ] API: POST /safety/fire-alerts (hoặc webhook IoT) — xác thực gateway / secret
  - [ ] API: GET /safety/fire-alerts (Admin — lịch sử, phân trang)
  - [ ] Backend: Tạo bản ghi sự kiện + phát push/in-app notification tới người dùng phù hợp (toàn trường hoặc theo zone — tuỳ thiết kế)
  - [ ] Mobile: Màn hình chi tiết cảnh báo khẩn (hoặc deep link từ push)
  - [ ] Mobile: Push notification kênh ưu tiên cao (Android channel / iOS critical nếu áp dụng)
  - [ ] Tích hợp phần cứng demo: gateway nhận tín hiệu (thật hoặc giả lập)

---

## Tổng kết Roadmap

```
Phase 1 (Sprint 1–4)                Phase 2 (Sprint 5–8)              Phase 3 (Sprint 9–12)
─────────────────────               ─────────────────────              ─────────────────────
✅ Xác thực (Auth)                  🔜 AI Chatbot                     🔜 Bản đồ trường
✅ Hồ sơ sinh viên                  🔜 Sự kiện & Cộng đồng           🔜 Thư viện Thông minh
✅ Thời khoá biểu                   🔜 Đăng ký môn học               🔜 Bãi xe Thông minh
✅ Điểm & GPA                       🔜 Đăng ký phòng học/lab         🔜 Phòng học TM (IoT+LED)
✅ Thông báo                        🔜 Điểm danh QR
                                   🔜 Cảnh báo cháy (IoT → app) *
```

\* Cảnh báo cháy: mục **3.5**, Phase 3; phụ thuộc gateway + push notification.

> ✅ = API đã có · 🔜 = Sẽ phát triển

## Ước lượng effort theo vai trò

| Phase | Backend | Mobile | Ghi chú |
|-------|---------|--------|---------|
| Phase 1 | 3–4 tuần | 4–5 tuần | Backend đi trước, Mobile theo sau |
| Phase 2 | 4–5 tuần | 4–5 tuần | Song song backend + mobile |
| Phase 3 | 3–4 tuần | 3–4 tuần | Cần thêm thời gian cho IoT |
