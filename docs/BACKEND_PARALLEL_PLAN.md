# Backend Parallel Delivery Plan

Mục tiêu: triển khai backend theo giai đoạn, chạy song song với vòng lặp UI/UX để giảm rối khi tích hợp.

## Nguyên tắc
- UI/UX và backend chạy song song theo sprint, không đợi nhau.
- Mỗi cụm endpoint phải có test và tiêu chí nghiệm thu trước khi merge.
- Luồng IoT luôn bám contract với `D:\Hệ thống IOT - UIT Campus`.

## Phase A - Stabilization

### Trạng thái
- In progress

### Phạm vi
- Ổn định build/start API và cấu hình môi trường.
- Chuẩn hóa bảo mật IoT qua header `x-iot-secret`.
- Giữ ổn định các endpoint live:
1. `POST /api/v1/iot/parking/scan`
2. `POST /api/v1/iot/telemetry`
3. `POST /api/v1/safety/fire-alerts`
4. `GET /api/v1/iot/telemetry/latest`
5. `GET /api/v1/safety/fire-alerts`

### Acceptance Criteria
- `pnpm --filter api build` chạy ổn định nhiều lần liên tiếp.
- IoT endpoints từ chối request thiếu/sai `x-iot-secret`.
- Không còn lỗi 500 khi dữ liệu rỗng (telemetry/safety list).

### Rủi ro và giảm thiểu
- Sai secret giữa gateway và backend:
- Chuẩn hóa biến `CAMPUS_IOT_SECRET` và `IOT_SHARED_SECRET` trong docs + env.
- Build lỗi do cấu hình incremental:
- Giữ cấu hình `tsBuildInfoFile` trong `dist/`.

## Phase B - Feature Completion

### Trạng thái
- Planned

### Phạm vi
- Hoàn thiện cụm vận hành:
1. Notification broadcast cho admin.
2. Operation snapshot cho dashboard admin/super admin.
3. Validation sâu hơn cho payload gateway/LPR.
- Bổ sung integration tests:
1. `iot -> backend -> mobile snapshot`.
2. `scan -> parking session -> payment status`.

### Acceptance Criteria
- Admin xem được telemetry/fire-alert snapshot không lỗi.
- Luồng scan RFID + plate trả đúng quyết định `entry_allowed`, `exit_allowed`, `denied`.
- Webhook/mock payment cập nhật trạng thái subscription đúng.

### Rủi ro và giảm thiểu
- Dữ liệu gateway không đồng nhất:
- Chuẩn hóa payload schema và reject payload sai sớm.
- Race condition scan vào/ra:
- Viết test cho scan lặp trong cửa sổ thời gian ngắn.

## Phase C - Production Hardening

### Trạng thái
- Planned

### Phạm vi
- Rate limiting cho auth/iot endpoints.
- Audit log cho thao tác admin/super admin.
- Observability: health checks, log grouping, failure alerts.
- Regression test trước release cho:
1. Auth.
2. Parking + IoT.
3. Safety alerts.
4. Payments.

### Acceptance Criteria
- Các endpoint nhạy cảm có rate-limit policy rõ.
- Có log truy vết cho thao tác admin trọng yếu.
- Regression suite pass trước mỗi build release.

### Rủi ro và giảm thiểu
- Spam alert từ cảm biến:
- Thêm cơ chế cooldown/dedup theo gate + thời gian.
- Regression chậm:
- Ưu tiên smoke suite bắt buộc, regression đầy đủ chạy theo lịch.

## Sprint Checklist
- UI/UX: 1 vòng polish + 1 vòng QA visual theo checklist consistency/approval.
- Backend: 1 cụm endpoint + test + docs mỗi sprint.
- Integration: smoke test gateway/firmware trước khi chốt sprint.
