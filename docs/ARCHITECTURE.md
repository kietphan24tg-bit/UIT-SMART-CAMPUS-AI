# Kiến trúc Hệ thống

## Tổng quan

Smart Campus sử dụng kiến trúc **monorepo** với Turborepo, chia thành 2 ứng dụng chính và các package dùng chung. Hệ thống hiện hỗ trợ **5 vai trò người dùng** (RBAC) và có nhiều module đã được triển khai thực tế trong backend/mobile.

## Kiến trúc tổng thể

```
                    ┌─────────────────────┐
                    │   Expo React Native │
                    │   (Mobile Client)   │
                    └────────┬────────────┘
                             │ HTTPS / JWT
                             ▼
                    ┌─────────────────────┐
                    │   NestJS API        │
                    │   (Backend)         │
                    │                     │
                    │  ┌───────────────┐  │
                    │  │ Auth Guard    │  │◄── JWT validation
                    │  │ Roles Guard   │  │◄── RBAC kiểm tra quyền
                    │  └───────────────┘  │
                    └──┬──────┬───────┬───┘
                       │      │       │
              ┌────────▼┐  ┌──▼───┐  ┌▼──────────────┐
              │PostgreSQL│  │Redis │  │External Services│
              │(Database)│  │(Cache│  │• Expo Push / SMTP│
              │          │  │Queue)│  │• Payments        │
              └──────────┘  └──────┘  │• IoT / TrackAsia │
                                      └─────────────────┘
```

## Phân quyền (RBAC — Role-Based Access Control)

### 5 vai trò trong hệ thống

```
Super Admin   ──►  Toàn quyền hệ thống, cấu hình nâng cao
      │
   Admin      ──►  Quản lý users, courses, phòng, thư viện, vận hành
      │
Canteen Admin ──►  Quản lý menu/đơn hàng canteen
      │
 Lecturer     ──►  Quản lý lớp, nhập điểm, tạo QR điểm danh, gửi thông báo
      │
 Student      ──►  Xem TKB, điểm, thông báo, ĐKMH, chatbot, điểm danh QR
```

### Cách thức hoạt động

1. **JWT Token** chứa thông tin `role` của user
2. **JwtAuthGuard** xác thực token ở mọi request protected
3. **RolesGuard** kiểm tra quyền dựa trên `@Roles()` decorator
4. Mỗi endpoint định nghĩa rõ vai trò nào được phép truy cập

```typescript
// Ví dụ minh hoạ
@Get('grades/class-sections/:id/sheet')
@Roles(Role.LECTURER, Role.ADMIN, Role.SUPER_ADMIN)
getClassSectionGradeSheet() { ... }
```

### Ma trận quyền theo module

| Module | Student | Lecturer | Canteen Admin | Admin | Super Admin |
|--------|:-------:|:--------:|:-------------:|:-----:|:-----------:|
| Auth | R/W | R/W | R/W | R/W | R/W |
| Users | R (mình) | R (mình) | R (mình) | CRUD | CRUD + roles |
| Schedule | R | R | — | R | R |
| Grades | R (mình) | R/W (lớp) | — | R/W | R/W |
| Notifications | R | R/W | R | R/W | R/W |
| Registrations | R/W | — | — | — | — |
| Room Booking | R/W | R/W | — | CRUD + duyệt | CRUD + duyệt |
| Attendance | Checkin | CRUD | — | CRUD | CRUD |
| Events | R | R | — | R | R |
| Chatbot | R/W | R/W | — | quản trị KB | quản trị KB |
| Library | R/Borrow | R/Borrow | — | CRUD | CRUD |
| Parking | R | R | — | CRUD | CRUD |
| Canteen | consumer | consumer | CRUD vận hành | CRUD | CRUD |
| SOS | R/W | R/W | R/W | R/W | R/W |

> R = Read, W = Write, CRUD = Create/Read/Update/Delete

## Tech Stack và Lý do chọn

### Frontend — React Native (Expo)
- **Expo**: tiết kiệm thời gian setup, hỗ trợ build/dev tốt
- **Expo Router**: file-based routing
- **Zustand**: state management nhẹ
- **TanStack Query**: server state management, caching, refetch
- **TypeScript**: type safety tốt hơn cho monorepo

### Backend — NestJS
- **NestJS**: module/controller/service rõ ràng, DI, dễ test
- **Prisma**: type-safe ORM, migration, generate client
- **PostgreSQL**: relational database chính
- **Passport + JWT**: auth chuẩn, dễ mở rộng
- **Guards (RBAC)**: phân quyền theo role
- **Swagger**: tài liệu API sinh tự động

### Infrastructure
- **Turborepo**: orchestration/cache cho monorepo
- **pnpm**: package manager nhanh, nhẹ
- **Docker**: local infra cho DB/Redis/MinIO
- **GitHub Actions**: CI/CD

## Module Map theo Phase

```
Phase 1 (Nền tảng)         Phase 2 (Chính)              Phase 3 (Nâng cao)
───────────────────         ──────────────────           ──────────────────
AuthModule                  ChatbotModule                IoT / Safety
UsersModule                 EventsModule                 LibraryModule
ScheduleModule              RegistrationsModule          ParkingModule
GradesModule                RoomBookingModule            TrackAsia integrations
NotificationsModule         AttendanceModule
CanteenModule               CatalogModule
PaymentsModule              SosModule
```

## Luồng dữ liệu

### Luồng xác thực + Phân quyền
1. User nhập email/password trên mobile
2. Mobile gửi POST `/api/v1/auth/login`
3. API validate credentials, trả về JWT
4. Mobile lưu token vào SecureStore
5. Mỗi request gửi kèm `Authorization: Bearer <token>`
6. `JwtAuthGuard` validate token
7. `RolesGuard` kiểm tra `user.role`
8. Nếu hợp lệ → Controller → Service → Prisma → DB
9. Nếu không đủ quyền → `403 Forbidden`

### Luồng API Request
1. Mobile gửi request kèm JWT token
2. NestJS Guards validate token + kiểm tra quyền
3. Controller nhận request, gọi Service
4. Service xử lý business logic, gọi Prisma
5. Prisma query PostgreSQL
6. Response đi ngược lại qua interceptor format chuẩn
7. Trả về `{ success, data, message, statusCode, timestamp }`

### Ghi chú dữ liệu học vụ
- Lịch của **student** hiện lấy từ `schedule_items`
- Lịch của **lecturer** hiện map từ `class_meetings`
- Mobile schedule vẫn có preview fallback nếu API lỗi

## Folder Structure Pattern

### NestJS Module Pattern
Mỗi feature module bao gồm:
```
modules/<feature>/
├── <feature>.module.ts
├── <feature>.controller.ts
├── <feature>.service.ts
├── dto/
└── entities/ hoặc spec files (tuỳ module)
```

### Common Module (Guards & Utilities)
```
common/
├── guards/
├── decorators/
├── filters/
├── interceptors/
└── pipes/
```

### Mobile Screen Pattern
```
app/(tabs)/<screen>/
├── index.tsx
├── [id].tsx
└── _layout.tsx
```
