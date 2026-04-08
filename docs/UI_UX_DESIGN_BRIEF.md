# UI/UX Design Brief - UIT Smart Campus

Tài liệu này tổng hợp hiện trạng từ `D:\Hệ thống IOT - UIT Campus` và `D:\SE346_DoAn` để team có một nguồn sự thật duy nhất khi brief UI cho mobile app UIT Smart Campus.

## 1. Feature Audit

### 1.1. Hệ thống IoT và dữ liệu có sẵn

Nguồn dữ liệu thực tế từ repo IoT hiện tại:

| Nhóm dữ liệu | Nguồn | Hiện trạng kỹ thuật | Hàm ý UI |
| --- | --- | --- | --- |
| RFID scan | ESP32 -> gateway -> backend | Có thật | Hiển thị scan state, plate verification, entry/exit result |
| Biển số nhận diện | Webcam + LPR service | Có thật | Hiển thị plate, evidence image, access decision |
| Slot A1-A4 | 4 cảm biến slot | Có thật | Grid slot real-time, free/busy summary |
| Nhiệt độ | DHT11 | Có thật | Sensor card trong parking/ops |
| Độ ẩm | DHT11 | Có thật | Sensor card trong parking/ops |
| Mưa | Rain sensor | Có thật | Weather safety badge |
| Lửa | Fire sensor | Có thật | High-priority emergency state |
| Mở/đóng cổng | Servo barrier | Có thật | Gate status / maintenance action |
| Session vào/ra | Backend parking session | Có thật | Active sessions, entry/exit history summary |
| Fire alert | Gateway -> `/safety/fire-alerts` | Có thật | Emergency banner, alert detail/history |

Ghi chú kỹ thuật quan trọng:

- Gateway local đang phát state bằng SSE cho dashboard local.
- Mobile app trong `SE346_DoAn` hiện tại chưa có websocket/SSE riêng.
- Vì vậy UI mobile phải được thiết kế theo trải nghiệm "live status" nhưng bám vào hiện trạng `snapshot + polling`.
- Nhiệt độ, độ ẩm, mưa, lửa, trạng thái slot, gateId, deviceIp và thời điểm báo cáo đã có schema/backend rõ ràng.

### 1.2. Nguồn sự thật từ backend `SE346_DoAn`

Backend đang có thật:

- `auth`: register, login, refresh, logout
- `users`: xem/sửa profile của user hiện tại
- `schedule`: lấy TKB, học kỳ, chi tiết buổi học
- `grades`: lấy bảng điểm và GPA
- `notifications`: danh sách, unread count, mark read, mark all read
- `parking`: status, danh sách xe, đăng ký xe
- `iot`: parking scan, telemetry latest
- `safety`: fire alerts cho admin/super admin
- `payments`: tạo thanh toán MoMo cho gửi xe tháng, webhook/mock success

Mobile app đang có thật:

- `Splash/Auth shell`
- `Login`
- `Register`
- `Home`
- `Parking`
- `Profile`
- `Schedule` placeholder
- `Notifications` placeholder

### 1.3. Tính năng theo mức độ sẵn sàng

| Module | Backend | Mobile | Mức độ ưu tiên cho design |
| --- | --- | --- | --- |
| Auth | Có | Có | Cao |
| Profile | Có | Có | Cao |
| Home dashboard | Một phần | Có cơ bản | Cao |
| Schedule | Có | Placeholder | Cao |
| Grades / GPA | Có | Chưa có màn | Cao |
| Notifications | Có | Placeholder | Cao |
| Parking + IoT | Có | Có | Rất cao |
| Fire alerts | Có | Chưa có màn | Rất cao |
| Payments | Có | Có trong parking | Cao |
| Events & community | Roadmap | Chưa có | Trung bình |
| Course registration | Roadmap | Chưa có | Trung bình |
| Room booking | Roadmap | Chưa có | Trung bình |
| QR attendance | Roadmap | Chưa có | Trung bình |
| Campus map | Roadmap | Chưa có | Trung bình |
| Library | Roadmap | Chưa có | Trung bình |
| AI chatbot | Roadmap | Chưa có | Trung bình |
| Smart classroom | Roadmap | Chưa có | Trung bình |
| Admin operations | Một phần | Chưa có | Cao |

### 1.4. Contract cần được coi là source of truth cho UI

UI prompt và sau này implementation nên bám theo các contract hiện có:

- `ParkingStatus`
- `RegisteredVehicle`
- `ParkingSubscriptionInfo`
- `User` / `UserProfile`
- schedule responses
- grades responses + GPA summary
- notification list + unread count
- `TelemetrySnapshot`
- `FireAlert`

Không được giả định có mobile stream API mới. Nếu cần "real realtime" sau này, nên bổ sung kênh stream/mobile-safe push riêng.

## 2. Information Architecture

### 2.1. App shell đã chốt

Super app mobile duy nhất, Android-first, giao diện thay đổi theo role.

5 tab chính:

1. `Home`
2. `Schedule` cho Student/Lecturer, `Operations` cho Admin/Super Admin
3. `Services`
4. `Alerts`
5. `Profile`

### 2.2. Logic theo role

| Role | Tab 2 | Home tập trung vào | Module phụ trợ thêm |
| --- | --- | --- | --- |
| Student | Schedule | lịch hôm nay, điểm/GPA, thông báo mới, parking summary | đăng ký môn, library, map, events, chatbot |
| Lecturer | Schedule | lớp hôm nay, điểm danh, thông báo lớp, smart classroom | tạo QR attendance, grade review, class notifications |
| Admin | Operations | parking ops, fire alerts, user/course summaries | fire logs, telemetry status, room approvals |
| Super Admin | Operations | hệ thống tổng quan, IoT zone status, cảnh báo khẩn | gateway status, role-aware management entry points |

### 2.3. Home dashboard

Home phải là dashboard cá nhân hóa, không phải menu icon đơn thuần.

Khối bắt buộc:

- Greeting + role badge
- Today snapshot
- Upcoming classes / operations cards
- Latest GPA or score update card
- Unread notifications summary
- Parking status summary
- Emergency banner nếu có fire alert hoặc stale telemetry
- Quick actions theo role
- Recent activity / shortcut stack

### 2.4. Services Hub

Services tab là nơi gom toàn bộ module để tránh quá tải tab bar.

Nhóm đề xuất:

- Academic: Schedule detail, Grades/GPA, Course registration, Attendance
- Campus life: Events, Community, Library, Campus map
- Campus utilities: Parking, Room booking, AI chatbot
- Teaching tools: Class dashboard, QR generation, reports, smart classroom
- Admin tools: Parking ops, fire logs, IoT health, user/course summaries

### 2.5. Alerts tab

Alerts tab không chỉ là thông báo thường.

Cần có:

- All alerts
- Unread filter
- Priority grouping: General / Academic / Payment / Emergency
- Fire alert detail deep link
- Empty / error / offline / resolved states
- Admin history list cho fire alerts

### 2.6. Profile tab

Profile và settings cần bao gồm đầy đủ:

- Profile summary
- Account & security
- Permissions & data usage
- Terms of Service
- Privacy Policy
- Help & Support
- About / developer identity
- Delete account
- Logout

## 3. Screen Inventory Cần Thiết Kế

Bắt buộc cover đủ các nhóm màn sau:

- Splash / Onboarding
- Login / Register
- Forgot password / Reset
- Home
- Schedule
- Grades / GPA
- Notifications
- Parking status
- Vehicle registration
- Parking payment flow
- Fire alert detail / history
- Events & Community
- Course registration
- Room booking
- QR attendance
- Campus map
- Library
- AI chatbot
- Smart classroom control
- Profile
- Settings
- Help & Support
- Terms
- Privacy Policy
- Permissions Center
- Account deletion

Thêm theo role:

- Lecturer: class dashboard, attendance QR generation, attendance reports, grade entry/review, class notifications, smart classroom controls
- Admin / Super Admin: operations dashboard, parking ops, fire alert logs, user/course summaries, IoT gateway status, zone status

## 4. UX Rules và States

### 4.1. Parking + IoT

Đây là module cần nổi bật nhất trong toàn bộ app.

Bắt buộc có:

- Hero summary: `available / occupied / total`
- Slot grid rõ ràng, đọc nhanh trên mobile
- Sensor cards: nhiệt độ, độ ẩm, mưa, lửa
- Device/IP + `last updated`
- Badge `online`, `stale`, `fire alert`, `offline`
- CTA đăng ký xe
- Danh sách xe đã đăng ký
- Gói gửi xe: active / inactive / pending / expired
- Payment CTA cho parking subscription
- Empty state khi user chưa đăng ký xe
- Payment success / failure state rõ ràng

### 4.2. Realtime contract cho mobile

- Polling-ready UI: 10-15 giây / lần
- Stale state: nếu không có dữ liệu mới sau 30 giây
- Emergency state ưu tiên cao hơn mọi block thông tin khác
- Luôn hiển thị `last updated`
- Khi mất dữ liệu: fallback sang snapshot cũ + banner cảnh báo

### 4.3. State coverage bắt buộc

Mọi module chính cần có đầy đủ:

- loading / skeleton
- empty
- error
- offline
- permission denied
- no data yet
- no vehicle
- success
- successful payment
- account deletion confirmation
- expired subscription
- fire alert
- stale telemetry
- partial/degraded
- destructive confirmation nếu có

### 4.4. Accessibility và adaptive quality

Cần bám theo Android quality guidance:

- Touch targets tối thiểu `48dp`
- Contrast text nên đạt ngưỡng để đọc tốt
- Không dùng màu là tín hiệu duy nhất
- Icon + text + state label đi kèm
- Typography scale rõ ràng cho phone và tablet
- Layout adaptive cho phone, tablet, foldable
- Emergency UI phải có icon, color, title, status text rõ ràng

## 5. Google Play Review Readiness Checklist

### 5.1. Pháp lý và account

- Có `Privacy Policy` trong app và trên URL public, active, non-geofenced, non-PDF
- Có `Terms of Service`
- Có `Help & Support`
- Có thông tin developer / đơn vị phát hành
- Có cơ chế `Delete account` trong app nếu app cho tạo account
- Có thêm web link để user request xóa tài khoản và data bên ngoài app

### 5.2. User data và permission UX

- Chỉ xin quyền trong đúng ngữ cảnh
- Có in-app disclosure trước runtime permission nếu cần
- Giải thích rõ tại sao cần camera / notifications / location
- Nếu user từ chối quyền, app degrade gracefully
- Có màn `Permissions & Data Usage`
- Có data retention / deletion notice trong privacy policy

### 5.3. Payment và monetization

- Parking subscription được định nghĩa là physical service gắn với bãi xe thật
- Không tái sử dụng external payment pattern này cho digital goods/features khác nếu chưa review policy
- Copy giá, hạn gói, trạng thái thanh toán phải rõ ràng
- Không đẩy user sang external payment trong các flow digital khác

### 5.4. Store và quality

- Android-first screenshots và store assets cần đồng nhất với app
- App shell resize tốt, không letterbox xấu trên tablet/foldable
- Emergency và privacy affordances dễ tìm
- Nội dung copy, icon, trạng thái cần nhất quán

## 6. Hướng Dẫn Sử Dụng Với Google Stitch

Dùng file [GOOGLE_STITCH_PROMPT.md](GOOGLE_STITCH_PROMPT.md) để copy/paste vào Stitch.

Quy tắc khi dùng:

1. Tạo trước design system + navigation shell.
2. Tạo core phone flows cho Student.
3. Tạo role variants cho Lecturer và Admin/Super Admin.
4. Sau cùng mới sinh thêm tablet/foldable adaptations.

## 7. Official References

Tài liệu này bám theo các nguồn chính thức sau:

- Android app quality: https://developer.android.com/quality
- Adaptive app quality guidelines: https://developer.android.com/docs/quality-guidelines/adaptive-app-quality
- Adaptive apps overview: https://developer.android.com/adaptive-apps
- Android accessibility: https://developer.android.com/guide/topics/ui/accessibility/apps.html
- Accessibility principles: https://developer.android.com/guide/topics/ui/accessibility/principles
- Runtime permissions: https://developer.android.com/guide/topics/permissions/requesting
- Minimize permission requests: https://developer.android.com/privacy-and-security/minimize-permission-requests
- Google Play User Data policy: https://support.google.com/googleplay/android-developer/answer/10144311
- Google Play account deletion requirements: https://support.google.com/googleplay/android-developer/answer/13327111
- Google Play Payments policy education: https://support.google.com/googleplay/android-developer/answer/10281818

## 8. Implementation Note Cho Team

Nếu team muốn mobile có trải nghiệm realtime mạnh hơn sau khi UI đã được chốt, nên bổ sung:

- mobile-safe telemetry stream hoặc
- push/deep link cho fire alerts và parking state changes

Không nên brief cho designer một websocket flow mà backend hiện tại chưa hỗ trợ, vì dễ tạo expectation sai cho implementation.
