# API Documentation

## Overview

Backend API is built with NestJS and exposed through Swagger.

**Swagger UI:** `http://localhost:3000/docs`

## Base URL

```text
Development: http://localhost:3000/api/v1
Production:  cấu hình theo môi trường deploy thực tế
```

## Authentication

Use JWT bearer tokens for all protected endpoints.

```text
Authorization: Bearer <access_token>
```

## IoT Secret

Gateway and firmware calls must include a shared secret header:

```text
x-iot-secret: <IOT_SHARED_SECRET>
```

This applies only to IoT and safety ingress endpoints, not to mobile clients.

## Response Format

### Success

```json
{
  "success": true,
  "data": {},
  "message": "Success",
  "statusCode": 200,
  "timestamp": "2026-04-30T10:30:00.000Z"
}
```

### Error

```json
{
  "success": false,
  "data": null,
  "message": "Error description",
  "statusCode": 400,
  "timestamp": "2026-04-30T10:30:00.000Z"
}
```

## Core Modules

### Auth

| Method | Endpoint                       | Auth |
| ------ | ------------------------------ | ---- |
| POST   | `/auth/register`               | No   |
| POST   | `/auth/login`                  | No   |
| POST   | `/auth/refresh`                | No   |
| POST   | `/auth/password-reset/request` | No   |
| POST   | `/auth/password-reset/verify`  | No   |
| POST   | `/auth/password-reset/reset`   | No   |
| POST   | `/auth/logout`                 | Yes  |

### Users

| Method | Endpoint            | Auth                |
| ------ | ------------------- | ------------------- |
| GET    | `/users/me`         | Yes                 |
| PATCH  | `/users/me`         | Yes                 |
| POST   | `/users/me/avatar`  | Yes                 |
| GET    | `/users`            | Admin / Super Admin |
| GET    | `/users/:id`        | Admin / Super Admin |
| PATCH  | `/users/:id/role`   | Super Admin         |
| PATCH  | `/users/:id/active` | Admin / Super Admin |
| DELETE | `/users/:id`        | Admin / Super Admin |

### Password Reset Contracts

#### `POST /auth/password-reset/request`

Body:

```json
{
  "email": "student@gm.uit.edu.vn"
}
```

Response `data`:

```json
{
  "maskedEmail": "st***@gm.uit.edu.vn",
  "expiresInSeconds": 600,
  "delivery": "email"
}
```

When SMTP is not configured in local development, the API falls back to:

```json
{
  "maskedEmail": "st***@gm.uit.edu.vn",
  "expiresInSeconds": 600,
  "delivery": "preview",
  "previewCode": "123456"
}
```

#### `POST /auth/password-reset/verify`

Body:

```json
{
  "email": "student@gm.uit.edu.vn",
  "otp": "123456"
}
```

Response `data`:

```json
{
  "verified": true
}
```

#### `POST /auth/password-reset/reset`

Body:

```json
{
  "email": "student@gm.uit.edu.vn",
  "otp": "123456",
  "newPassword": "Password123"
}
```

Response `data`:

```json
{
  "success": true
}
```

### Schedule

| Method | Endpoint                           | Auth |
| ------ | ---------------------------------- | ---- |
| GET    | `/schedules`                       | Yes  |
| GET    | `/schedules/current`               | Yes  |
| GET    | `/schedules/semesters/:semesterId` | Yes  |

### Grades

| Method | Endpoint                             | Auth                           |
| ------ | ------------------------------------ | ------------------------------ |
| GET    | `/grades`                            | Yes                            |
| GET    | `/grades/summary`                    | Yes                            |
| GET    | `/grades/current`                    | Yes                            |
| GET    | `/grades/semesters/:semesterId`      | Yes                            |
| GET    | `/grades/lecturer/class-sections`    | Lecturer / Admin / Super Admin |
| GET    | `/grades/class-sections/:id/sheet`   | Lecturer / Admin / Super Admin |
| PUT    | `/grades/class-sections/:id/weights` | Lecturer / Admin / Super Admin |
| PUT    | `/grades/class-sections/:id/sheet`   | Lecturer / Admin / Super Admin |

### Notifications

| Method | Endpoint                      | Auth                           |
| ------ | ----------------------------- | ------------------------------ |
| POST   | `/notifications`              | Lecturer / Admin / Super Admin |
| GET    | `/notifications`              | Yes                            |
| GET    | `/notifications/unread-count` | Yes                            |
| GET    | `/notifications/:id`          | Yes                            |
| PATCH  | `/notifications/:id/read`     | Yes                            |
| PATCH  | `/notifications/read-all`     | Yes                            |
| POST   | `/notifications/push-token`   | Yes                            |
| DELETE | `/notifications/push-token`   | Yes                            |

### Attendance

| Method | Endpoint                                         | Auth                           |
| ------ | ------------------------------------------------ | ------------------------------ |
| POST   | `/attendance/session/start`                      | Lecturer / Admin / Super Admin |
| POST   | `/attendance/session/:id/stop`                   | Lecturer / Admin / Super Admin |
| GET    | `/attendance/session/:id/qr-token`               | Public by session/display key  |
| POST   | `/attendance/checkin`                            | Student                        |
| GET    | `/attendance/session/:id/records`                | Lecturer / Admin / Super Admin |
| GET    | `/attendance/session/:id/export`                 | Lecturer / Admin / Super Admin |
| GET    | `/attendance/class-sections/:id/export`          | Lecturer / Admin / Super Admin |
| GET    | `/attendance/history`                            | Lecturer / Admin / Super Admin |
| GET    | `/attendance/lecturer/class-sections`            | Lecturer / Admin / Super Admin |
| GET    | `/attendance/class-sections/:id/students`        | Lecturer / Admin / Super Admin |
| GET    | `/attendance/class-sections/:id/session-summary` | Lecturer / Admin / Super Admin |
| GET    | `/attendance/me/history`                         | Student                        |

### Registrations

| Method | Endpoint                                  | Auth    |
| ------ | ----------------------------------------- | ------- |
| GET    | `/registrations/available-class-sections` | Student |
| GET    | `/registrations/me`                       | Student |
| POST   | `/registrations`                          | Student |
| PATCH  | `/registrations/:id/drop`                 | Student |

### Room Bookings

| Method | Endpoint                                                               | Auth                |
| ------ | ---------------------------------------------------------------------- | ------------------- |
| POST   | `/room-bookings`                                                       | Yes                 |
| GET    | `/room-bookings/rooms/:roomCode/schedule`                              | No                  |
| GET    | `/room-bookings/buildings`                                             | No                  |
| GET    | `/room-bookings/buildings/:buildingCode/rooms`                         | No                  |
| GET    | `/room-bookings/me`                                                    | Yes                 |
| GET    | `/room-bookings`                                                       | Admin / Super Admin |
| GET    | `/room-bookings/admin/request-rooms`                                   | Admin / Super Admin |
| GET    | `/room-bookings/admin/rooms/:roomCode/request-slots`                   | Admin / Super Admin |
| GET    | `/room-bookings/admin/rooms/:roomCode/request-slots/:date/:timeSlotId` | Admin / Super Admin |
| PATCH  | `/room-bookings/admin/request-slots/approve-one`                       | Admin / Super Admin |
| PATCH  | `/room-bookings/admin/request-slots/reject-all`                        | Admin / Super Admin |
| POST   | `/room-bookings/admin/schedule-overrides`                              | Admin / Super Admin |
| PATCH  | `/room-bookings/admin/schedule-overrides/:id`                          | Admin / Super Admin |
| DELETE | `/room-bookings/admin/schedule-overrides/:id`                          | Admin / Super Admin |
| POST   | `/room-bookings/admin/class-meetings/:classMeetingId/cancel`           | Admin / Super Admin |
| POST   | `/room-bookings/admin/class-meetings/:classMeetingId/move`             | Admin / Super Admin |
| PATCH  | `/room-bookings/:id/approve`                                           | Admin / Super Admin |
| PATCH  | `/room-bookings/:id/reject`                                            | Admin / Super Admin |
| PATCH  | `/room-bookings/:id/cancel`                                            | Yes                 |

### Library

| Method | Endpoint                    | Auth                                     |
| ------ | --------------------------- | ---------------------------------------- |
| GET    | `/library/books`            | Yes                                      |
| GET    | `/library/books/:id`        | Yes                                      |
| GET    | `/library/me/loans`         | Student / Lecturer                       |
| GET    | `/library/me/reservations`  | Student / Lecturer                       |
| POST   | `/library/reservations`     | Student / Lecturer                       |
| DELETE | `/library/reservations/:id` | Student / Lecturer / Admin / Super Admin |
| PATCH  | `/library/loans/:id/renew`  | Student / Lecturer                       |

### Catalog

| Method | Endpoint                               | Auth                |
| ------ | -------------------------------------- | ------------------- |
| GET    | `/catalog/semesters`                   | Admin / Super Admin |
| GET    | `/catalog/courses`                     | Admin / Super Admin |
| GET    | `/catalog/lecturers`                   | Admin / Super Admin |
| GET    | `/catalog/class-sections`              | Admin / Super Admin |
| POST   | `/catalog/courses`                     | Admin / Super Admin |
| POST   | `/catalog/class-sections`              | Admin / Super Admin |
| PATCH  | `/catalog/class-sections/:id`          | Admin / Super Admin |
| PATCH  | `/catalog/class-sections/:id/meetings` | Admin / Super Admin |

### Parking

| Method | Endpoint            | Auth |
| ------ | ------------------- | ---- |
| GET    | `/parking/status`   | Yes  |
| GET    | `/parking/vehicles` | Yes  |
| POST   | `/parking/vehicles` | Yes  |

### Payments

| Method | Endpoint                                           | Auth                                            |
| ------ | -------------------------------------------------- | ----------------------------------------------- |
| POST   | `/parking/subscriptions/:vehicleId/payments/momo`  | Yes                                             |
| POST   | `/parking/subscriptions/:vehicleId/payments/sepay` | Yes                                             |
| POST   | `/canteen/orders/:id/pay`                          | Yes                                             |
| POST   | `/canteen/orders/:id/pay/sepay`                    | Yes                                             |
| POST   | `/payments/momo/webhook`                           | No                                              |
| POST   | `/payments/sepay/webhook`                          | `Authorization: Apikey <SEPAY_WEBHOOK_API_KEY>` |
| GET    | `/payments/momo/return`                            | No                                              |

SePay payment creation calls SePay VA Order API v2 with `Authorization: Bearer <SEPAY_API_TOKEN>` and requires `SEPAY_BANK_ACCOUNT_UUID`.

### IoT

| Method | Endpoint                | Auth                       |
| ------ | ----------------------- | -------------------------- |
| POST   | `/iot/parking/scan`     | `x-iot-secret`             |
| POST   | `/iot/telemetry`        | `x-iot-secret`             |
| GET    | `/iot/telemetry/latest` | Bearer + admin/super_admin |

### Safety

| Method | Endpoint              | Auth                       |
| ------ | --------------------- | -------------------------- |
| POST   | `/safety/fire-alerts` | `x-iot-secret`             |
| GET    | `/safety/fire-alerts` | Bearer + admin/super_admin |

## IoT Contracts

### `POST /iot/parking/scan`

Headers:

```text
Content-Type: application/json
x-iot-secret: <IOT_SHARED_SECRET>
```

Body:

```json
{
  "rfidTag": "RFID-22520001",
  "recognizedPlate": "51F44614",
  "gateId": "uit-gate-a",
  "capturedAt": "2026-04-06T12:15:00.000Z"
}
```

Response `data`:

```json
{
  "action": "entry_allowed",
  "message": "Xe hợp lệ. Mở barrier cho xe vào.",
  "availableSlots": 1,
  "sessionId": "ps_01H..."
}
```

`action` can be `entry_allowed`, `exit_allowed`, or `denied`.

### `POST /iot/telemetry`

Headers:

```text
Content-Type: application/json
x-iot-secret: <IOT_SHARED_SECRET>
```

Body:

```json
{
  "gateId": "uit-gate-a",
  "deviceIp": "192.168.1.55",
  "slotBitmap": "01",
  "slots": [
    { "slotNumber": "A1", "occupied": false },
    { "slotNumber": "A2", "occupied": true }
  ],
  "temperature": 32.5,
  "humidity": 72.4,
  "rainDetected": false,
  "fireDetected": false,
  "reportedAt": "2026-04-06T12:15:00.000Z"
}
```

### `GET /iot/telemetry/latest`

Query:

```text
gateId=uit-gate-a (optional)
```

Requires bearer token and `admin` or `super_admin`.

## Safety Contracts

### `POST /safety/fire-alerts`

Headers:

```text
Content-Type: application/json
x-iot-secret: <IOT_SHARED_SECRET>
```

Body:

```json
{
  "gateId": "uit-gate-a",
  "message": "Cảm biến lửa đã kích hoạt tại bãi xe.",
  "reportedAt": "2026-04-06T12:15:00.000Z",
  "telemetrySnapshot": {
    "gateId": "uit-gate-a",
    "deviceIp": "192.168.1.55",
    "slotBitmap": "01",
    "slots": [
      { "slotNumber": "A1", "occupied": false },
      { "slotNumber": "A2", "occupied": true }
    ],
    "temperature": 32.5,
    "humidity": 72.4,
    "rainDetected": false,
    "fireDetected": true,
    "reportedAt": "2026-04-06T12:15:00.000Z"
  }
}
```

`message` is optional. When omitted, the backend uses the default campus-safe fire alert copy.

### `GET /safety/fire-alerts`

Query:

```text
page=1 (optional)
limit=20 (optional)
```

Requires bearer token and `admin` or `super_admin`.

## Usage Notes

- Mobile clients should poll snapshots, not expect a mobile streaming channel.
- Telemetry UI should treat data older than 30 seconds as stale.
- Gateway and firmware must keep `gateId` aligned with the backend contract.
- Fire alerts are high-priority and should surface ahead of normal notifications.
- Mobile schedule hiện vẫn có fallback preview nếu request backend lỗi; kiểm tra thêm network/API khi debug dữ liệu lịch.
