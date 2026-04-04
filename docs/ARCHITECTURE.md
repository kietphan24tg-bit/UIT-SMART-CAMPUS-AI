# Kiến trúc Hệ thống

## Tổng quan

Smart Campus sử dụng kiến trúc **monorepo** với Turborepo, chia thành 2 ứng dụng chính và các package dùng chung. Hệ thống hỗ trợ **4 vai trò người dùng** (RBAC) và được chia thành **3 giai đoạn** phát triển.

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
              │(Database)│  │(Cache│  │• Firebase (FCM) │
              │          │  │Queue)│  │• OpenAI (Chat)  │
              └──────────┘  └──────┘  │• MQTT (IoT)     │
                                      └─────────────────┘
```

## Phân quyền (RBAC — Role-Based Access Control)

### 4 vai trò trong hệ thống

```
Super Admin  ──►  Toàn quyền hệ thống, cấu hình IoT
     │
  Admin      ──►  Quản lý users, courses, sự kiện, phòng, thư viện, bãi xe
     │
  Lecturer   ──►  Quản lý lớp, nhập điểm, tạo QR điểm danh, gửi thông báo
     │
  Student    ──►  Xem TKB, điểm, thông báo, ĐKMH, chatbot, điểm danh QR
```

### Cách thức hoạt động

1. **JWT Token** chứa thông tin `role` của user
2. **JwtAuthGuard** xác thực token ở mọi request
3. **RolesGuard** kiểm tra quyền dựa trên `@Roles()` decorator
4. Mỗi endpoint định nghĩa rõ vai trò nào được phép truy cập

```typescript
// Ví dụ: Chỉ Lecturer và Admin mới được nhập điểm
@Post('grades')
@Roles(Role.LECTURER, Role.ADMIN)
createGrade(@Body() dto: CreateGradeDto) { ... }

// Ví dụ: Tất cả user đã đăng nhập đều xem được TKB
@Get('schedules')
getSchedule(@CurrentUser() user: User) { ... }
```

### Ma trận quyền theo module

| Module | Student | Lecturer | Admin | Super Admin |
|--------|:-------:|:--------:|:-----:|:-----------:|
| Auth | R/W | R/W | R/W | R/W |
| Users | R (mình) | R (lớp) | CRUD | CRUD + roles |
| Schedule | R | R/W | CRUD | CRUD |
| Grades | R (mình) | R/W (lớp) | R/W | R/W |
| Notifications | R | R/W (lớp) | R/W (all) | R/W (all) |
| Registrations | R/W | R | CRUD | CRUD |
| Room Booking | R/W (cần duyệt) | R/W | CRUD + duyệt | CRUD |
| Attendance | Checkin | CRUD | R | R |
| Events | R/Register | CRUD | CRUD | CRUD |
| Chatbot | R/W | R/W | CRUD KB | CRUD KB |
| Maps | R | R | CRUD | CRUD |
| Library | R/Borrow | R/Borrow | CRUD | CRUD |
| Parking | R | R | CRUD | CRUD |
| Classroom IoT | R | Control | CRUD | Config |

> R = Read, W = Write, CRUD = Create/Read/Update/Delete, KB = Knowledge Base

## Tech Stack và Lý do chọn

### Frontend — React Native (Expo)
- **Expo**: Tiết kiệm thời gian setup, OTA updates, EAS Build
- **Expo Router**: File-based routing, tương tự Next.js
- **Zustand**: State management nhẹ, đơn giản, ít boilerplate
- **TanStack Query**: Server state management, caching, background refetch
- **TypeScript**: Type safety, IDE support tốt

### Backend — NestJS
- **NestJS**: Framework có cấu trúc rõ ràng (Module/Controller/Service), dependency injection, dễ test
- **Prisma**: Type-safe ORM, auto-generate types, migration system
- **PostgreSQL**: Relational database mạnh, hỗ trợ JSON, full-text search
- **Passport + JWT**: Authentication chuẩn, dễ mở rộng
- **Guards (RBAC)**: Phân quyền linh hoạt qua decorators
- **Swagger**: Auto-generate API docs từ decorators

### Infrastructure
- **Turborepo**: Build system nhanh, cache thông minh, shared configs
- **pnpm**: Package manager nhanh, tiết kiệm dung lượng
- **Docker**: Containerization cho dev và production
- **GitHub Actions**: CI/CD tự động

## Module Map theo Phase

```
Phase 1 (Nền tảng)         Phase 2 (Chính)              Phase 3 (Nâng cao)
───────────────────         ──────────────────           ──────────────────
AuthModule                  ChatbotModule                MapsModule
UsersModule                 EventsModule                 LibraryModule
ScheduleModule              RegistrationsModule          ParkingModule
GradesModule                RoomBookingModule            ClassroomIoTModule
NotificationsModule         AttendanceModule
DatabaseModule (Prisma)
CommonModule (Guards, Filters, Interceptors)
```

## Luồng dữ liệu

### Luồng xác thực + Phân quyền
1. User nhập email/password trên mobile
2. Mobile gửi POST /api/v1/auth/login
3. API validate credentials, trả về JWT (chứa `userId`, `role`)
4. Mobile lưu token vào SecureStore
5. Mỗi request gửi kèm `Authorization: Bearer <token>`
6. `JwtAuthGuard` → validate token → gắn user vào request
7. `RolesGuard` → kiểm tra `user.role` có trong `@Roles(...)` không
8. Nếu hợp lệ → Controller → Service → Prisma → DB
9. Nếu không đủ quyền → trả về `403 Forbidden`

### Luồng API Request
1. Mobile gửi request kèm JWT token
2. NestJS Guards validate token + kiểm tra quyền
3. Controller nhận request, gọi Service
4. Service xử lý business logic, gọi Prisma
5. Prisma query PostgreSQL
6. Response đi ngược lại qua TransformInterceptor
7. Trả về format chuẩn `{ success, data, message, statusCode, timestamp }`

## Folder Structure Pattern

### NestJS Module Pattern
Mỗi feature module bao gồm:
```
modules/<feature>/
├── <feature>.module.ts       # Định nghĩa module
├── <feature>.controller.ts   # HTTP endpoints + @Roles()
├── <feature>.service.ts      # Business logic
├── dto/                      # Data Transfer Objects
│   ├── create-<feature>.dto.ts
│   └── update-<feature>.dto.ts
└── entities/                 # (tuỳ chọn) Entity definitions
```

### Common Module (Guards & Utilities)
```
common/
├── guards/
│   ├── jwt-auth.guard.ts     # Xác thực JWT
│   └── roles.guard.ts        # Kiểm tra quyền RBAC
├── decorators/
│   ├── roles.decorator.ts    # @Roles(Role.ADMIN, Role.LECTURER)
│   └── current-user.decorator.ts  # @CurrentUser()
├── filters/
│   └── http-exception.filter.ts
├── interceptors/
│   └── transform.interceptor.ts
└── pipes/
    └── parse-pagination.pipe.ts
```

### Mobile Screen Pattern
```
app/(tabs)/<screen>/
├── index.tsx                 # Màn hình chính
├── [id].tsx                  # Dynamic route (tuỳ chọn)
└── _layout.tsx              # Layout (tuỳ chọn)
```
