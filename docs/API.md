# API Documentation

## Tong quan

Backend API duoc xay dung voi NestJS va tu dong generate Swagger docs.

**Swagger UI**: http://localhost:3000/docs (khi chay dev)

## Base URL

```
Development: http://localhost:3000/api/v1
Production:  https://api.smartcampus.uit.edu.vn/api/v1
```

## Authentication

Su dung **Bearer Token** (JWT) cho tat ca endpoints yeu cau xac thuc.

```
Authorization: Bearer <access_token>
```

### Token lifecycle
1. Login/Register -> Nhan `accessToken` + `refreshToken`
2. Gui `accessToken` trong header moi request
3. Khi `accessToken` het han (15 phut) -> Dung `refreshToken` de lay cap token moi
4. `refreshToken` het han sau 7 ngay -> Phai dang nhap lai

## Response Format

### Thanh cong
```json
{
  "success": true,
  "data": { ... },
  "message": "Success",
  "statusCode": 200,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Loi
```json
{
  "success": false,
  "data": null,
  "message": "Error description",
  "statusCode": 400,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

## Endpoints

### Auth (`/auth`)

| Method | Endpoint | Mo ta | Auth |
|--------|----------|-------|------|
| POST | `/auth/register` | Dang ky tai khoan moi | No |
| POST | `/auth/login` | Dang nhap | No |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/logout` | Dang xuat | Yes |

### Users (`/users`)

| Method | Endpoint | Mo ta | Auth |
|--------|----------|-------|------|
| GET | `/users/me` | Lay thong tin user hien tai | Yes |
| PATCH | `/users/me` | Cap nhat profile | Yes |

### Schedule (`/schedules`)

| Method | Endpoint | Mo ta | Auth |
|--------|----------|-------|------|
| GET | `/schedules` | Lay thoi khoa bieu (query: ?semesterId=) | Yes |
| GET | `/schedules/semesters` | Lay danh sach hoc ky | Yes |
| GET | `/schedules/:id` | Lay chi tiet 1 buoi hoc | Yes |

### Grades (`/grades`)

| Method | Endpoint | Mo ta | Auth |
|--------|----------|-------|------|
| GET | `/grades` | Lay bang diem (query: ?semesterId=) | Yes |
| GET | `/grades/gpa` | Tinh GPA (query: ?semesterId=) | Yes |

### Notifications (`/notifications`)

| Method | Endpoint | Mo ta | Auth |
|--------|----------|-------|------|
| GET | `/notifications` | Lay danh sach thong bao (query: ?page=&limit=) | Yes |
| GET | `/notifications/unread-count` | Dem thong bao chua doc | Yes |
| PATCH | `/notifications/:id/read` | Danh dau da doc | Yes |
| PATCH | `/notifications/read-all` | Danh dau tat ca da doc | Yes |

## Error Codes

| Status Code | Mo ta |
|------------|-------|
| 200 | Thanh cong |
| 201 | Tao moi thanh cong |
| 400 | Bad Request - Du lieu khong hop le |
| 401 | Unauthorized - Chua dang nhap hoac token het han |
| 403 | Forbidden - Khong co quyen truy cap |
| 404 | Not Found - Khong tim thay tai nguyen |
| 409 | Conflict - Du lieu bi trung (vd: email da ton tai) |
| 500 | Internal Server Error |

## Rate Limiting

(Se duoc cau hinh o Phase 2)
- 100 requests/phut cho endpoints thong thuong
- 10 requests/phut cho auth endpoints (chong brute force)
