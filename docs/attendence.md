-Giảng viên vào lớp học sẽ có mục chuyên cần. Sẽ hiện các tab điểm danh vào ngày nào, 
click vào có thể link đến excel hiện ra hoặc vẽ giao diện dashboard
🧱 2. Thành phần hệ thống
1. Backend (Spring Boot) — CORE
Xử lý toàn bộ:
 session 
 token 
 check-in 
 validate 
---
2. Mobile App
👨‍🏫 Giảng viên
 tạo session 
 mở QR 
 xem danh sách 
👨‍🎓 Sinh viên
 scan QR 
 check-in 
---
3. Web QR Display (1 page duy nhất)

/live/attendance/{sessionId}

 hiển thị QR 
 auto refresh 
👉 chạy chung backend (không cần web riêng)
---
🔄 3. Flow tổng thể (end-to-end)
---
🔵 Bước 1: Giảng viên tạo session

POST /attendance/session/start

→ trả:

{
 "sessionId": "abc123",
 "displayUrl": "/live/attendance/abc123"
}

---
🔵 Bước 2: Hiển thị QR
Giảng viên:
 mở link trên laptop / máy chiếu 
---
🔵 Bước 3: Web render QR
Flow:

Load page
 ↓
GET /session/{id}/qr-token
 ↓
Render QR(token)
 ↓
30s → refresh QR

---
🔵 Bước 4: Sinh viên scan
QR chứa:

token = xyz789

---
🔵 Bước 5: App gọi API

POST /attendance/checkin
Authorization: Bearer <JWT>

Body:

{
 "token": "xyz789"
}

---
🔵 Bước 6: Backend xử lý
Validate:
 token tồn tại? 
 token còn hạn? 
 session ACTIVE? 
 student đã check-in chưa? 
---
Nếu OK:

INSERT attendance_record

---
🔵 Bước 7: Giảng viên xem kết quả

GET /attendance/session/{id}/records

---
🔒 4. RULE hệ thống (bắt buộc)
---
✅ Rule 1: QR dynamic
 refresh: 30s
👉 tránh chụp QR
---
✅ Rule 2: Token TTL
 sống: 60–90s
👉 không reuse
---
✅ Rule 3: Token overlap
👉 nhiều token cùng valid
✔️ tránh lỗi mạng
 ✔️ UX mượt
---
✅ Rule 4: Login bắt buộc
👉 dùng JWT
 👉 không nhập studentId tay
---
✅ Rule 5: 1 sinh viên = 1 check-in

UNIQUE(student_id, session_id)

---
✅ Rule 6: Session có thời gian
 5–10 phút 
---
✅ Rule 7: Session phải ACTIVE
---
🧠 5. Cơ chế token (QUAN TRỌNG)
---
❗ Hiểu đúng:
 QR = hiển thị token 
 Token = chìa khóa check-in 
---
🔁 Token hoạt động
Ví dụ:

Refresh QR: 30s
TTL token: 90s

---
Timeline:

---
👉 Đây là overlap
---
📱 6. Flow scan trong app

Scan QR
 ↓
Extract token
 ↓
POST /checkin
 ↓
Backend validate
 ↓
Success

---
🔒 7. Anti-cheat (chống gian lận)
---
❌ Gian lận phổ biến:
 chụp QR gửi 
 gửi token 
 gọi API fake 
---
✔️ Cách hệ thống chống:

---
⚖️ 8. Cân bằng UX vs Security
👉 Config tốt nhất:

QR refresh: 30s
Token TTL: 90s
Session: 10 phút

---
✔️ không lag
 ✔️ không fail
 ✔️ khó gian lận
---
🗄️ 9. Database (tối thiểu)
---
attendance_session

id
class_id
status
start_time
expire_time

---
attendance_record

id
student_id
session_id
checkin_time

---
(optional) token store

token
session_id
expire_time

👉 nên dùng Redis
---
🏗️ 10. Kiến trúc tổng thể

Mobile (GV)
 ↓
Start session
 ↓
Backend
 ↓
Web hiển thị QR
 ↓
Sinh viên scan
 ↓
Mobile gọi API
 ↓
Backend validate
 ↓
DB lưu attendance

---
🚫 11. Sai lầm cần tránh
❌ QR tĩnh
 ❌ Không expire token
 ❌ Cho nhập studentId tay
 ❌ Không giới hạn check-in
 ❌ Dùng mobile làm màn hình chính
---
🧠 12. Tư duy quan trọng nhất
---
👉 1
QR chỉ là “hiển thị”, token mới là logic thật
---
👉 2
Không cần chặn gian lận tuyệt đối
 chỉ cần làm nó khó và không đáng
---
👉 3
Scan trong app ≠ bảo mật
 Token + backend validation mới là bảo mật
---
✅ 13. Kết luận cuối cùng
👉 Hệ thống chuẩn:
 QR thay đổi liên tục 
 Token sống ngắn + overlap 
 Backend kiểm soát toàn bộ 
 Mobile chỉ là client 
---
👉 Chốt 1 câu:
Scan QR = gửi token + xác thực user → backend quyết định tất cả

---
## 14. Mobile UI — sinh viên (Expo app)

**Đường dẫn:** Dịch vụ → Điểm danh QR → `/services/attendance` (route tĩnh; không dùng `/services/[service]`).

**Thứ tự màn hình**

1. **Hub** — Thẻ hướng dẫn (màu nền `successSurface`, viền/chữ `success` trong theme), placeholder trạng thái camera, CTA “Mở camera quét QR” (nút màu `success`), thẻ “Lịch sử điểm danh” (placeholder đến khi có API sinh viên). Font: Inter (`theme.fonts`).
2. **Quyền camera** (tuỳ chọn) — `/services/attendance/permission`: giải thích lý do, “Cho phép truy cập camera”, link mở Cài đặt, ghi chú privacy.
3. **Quét** — `/services/attendance/scan`: fullscreen nền đen, khung quét màu `success`; sau ~8s không đọc được mã → khung/chữ cảnh báo màu `warning`. Haptic khi decode; cooldown ~2.5s giữa các lần gửi API.
4. **Đang ghi nhận** — overlay trên camera (spinner + “Đang ghi nhận…”).
5. **Kết quả** — `/services/attendance/result`: thành công (tiêu đề “Điểm danh thành công”, pill thời gian, tự về hub sau 3s hoặc “Xong”); lỗi map theo `code` từ API (`TOKEN_INVALID`, `RATE_LIMITED`, `SESSION_CLOSED`, `ALREADY_CHECKED_IN`) với nút “Quét lại” (recoverable) hoặc “Về Dịch vụ” (non-recoverable).

**API:** `POST /attendance/checkin` với `{ token }` (JWT sinh viên). Phản hồi lỗi chuẩn có thêm trường `code` trong body JSON (filter Nest).

**Ghi chú:** Lịch sử điểm danh trên app sinh viên chờ endpoint phía server (hiện `GET /attendance/history` là lecturer).

---

Những gì cần thêm vào:
1. Xử lý offline/network fail phía sinh viên — Tài liệu đề cập token overlap để tránh lỗi mạng, nhưng nên bổ sung: nếu POST /checkin fail thì app retry tối đa mấy lần, trong bao lâu? Cần định nghĩa rõ để dev mobile biết xử lý.
2. Thiếu API lấy danh sách lớp/buổi học cho giảng viên — Bạn có đề cập "Giảng viên vào mục chuyên cần → tab điểm danh theo ngày" nhưng chưa có API GET /attendance/history?classId=... trả về lịch sử các session theo ngày. Cần bổ sung endpoint này.
3. Redis TTL cần nêu rõ key schema — Nếu dùng Redis lưu token, nên định nghĩa luôn: token:{token_value} → { sessionId, expireTime } để tránh hiểu nhầm khi implement.
4. Chưa có cơ chế báo lỗi cụ thể về phía sinh viên — Ví dụ backend nên trả về mã lỗi phân biệt: TOKEN_EXPIRED, ALREADY_CHECKED_IN, SESSION_CLOSED để app hiển thị thông báo đúng ngữ cảnh, không chỉ generic error.
Những điểm nhỏ nên làm rõ hơn:
5. "Web QR Display" chạy ở đâu? — Bạn ghi "chạy chung backend", nhưng thực tế /live/attendance/{sessionId} là một trang web (HTML), nên cần nói rõ: Spring Boot serve luôn static page này, hay dùng template engine (Thymeleaf)? Để tránh tranh luận khi dev.
6. Session expire tự động hay thủ công? — Tài liệu ghi 5–10 phút nhưng nên nêu: giảng viên có thể đóng sớm không? Nếu có thì cần API POST /attendance/session/{id}/stop. Nếu chỉ auto-expire thì nói rõ.