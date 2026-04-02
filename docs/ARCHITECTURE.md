# Kien truc He thong

## Tong quan

Smart Campus su dung kien truc **monorepo** voi Turborepo, chia thanh 2 ung dung chinh va cac package dung chung.

## Kien truc tong the

```
Client (Expo RN)  <-->  API Gateway (NestJS)  <-->  Database (PostgreSQL)
                                |
                         Redis (Cache/Queue)
                                |
                    External Services (Firebase, OpenAI, ...)
```

## Tech Stack va Ly do chon

### Frontend - React Native (Expo)
- **Expo**: Tiet kiem thoi gian setup, OTA updates, EAS Build
- **Expo Router**: File-based routing, tuong tu Next.js
- **Zustand**: State management nhe, don gian, it boilerplate
- **TanStack Query**: Server state management, caching, background refetch
- **TypeScript**: Type safety, IDE support tot

### Backend - NestJS
- **NestJS**: Framework co cau truc ro rang (Module/Controller/Service), dependency injection, de test
- **Prisma**: Type-safe ORM, auto-generate types, migration system
- **PostgreSQL**: Relational database manh, ho tro JSON, full-text search
- **Passport + JWT**: Authentication chuan, de mo rong
- **Swagger**: Auto-generate API docs tu decorators

### Infrastructure
- **Turborepo**: Build system nhanh, cache thong minh, shared configs
- **pnpm**: Package manager nhanh, tiet kiem dung luong
- **Docker**: Containerization cho dev va production
- **GitHub Actions**: CI/CD tu dong

## Module Dependency

```
apps/mobile  --->  packages/shared  <---  apps/api
     |                                          |
     v                                          v
  Expo Router                            NestJS Modules
  Zustand                                Prisma + PostgreSQL
  React Query                            JWT + Passport
```

## Data Flow

### Authentication Flow
1. User nhap email/password tren mobile
2. Mobile gui POST /api/v1/auth/login
3. API validate credentials, tra ve JWT access + refresh token
4. Mobile luu token vao SecureStore
5. Moi request tiep theo gui kem Bearer token
6. Khi access token het han, dung refresh token de lay token moi

### API Request Flow
1. Mobile gui request kem JWT token
2. NestJS JwtAuthGuard validate token
3. Controller nhan request, goi Service
4. Service xu ly business logic, goi Prisma
5. Prisma query PostgreSQL
6. Response di nguoc lai qua TransformInterceptor
7. Tra ve format chuan `{ success, data, message, statusCode, timestamp }`

## Folder Structure Pattern

### NestJS Module Pattern
Moi feature module bao gom:
```
modules/<feature>/
├── <feature>.module.ts       # Module definition
├── <feature>.controller.ts   # HTTP endpoints
├── <feature>.service.ts      # Business logic
├── dto/                      # Data Transfer Objects
│   ├── create-<feature>.dto.ts
│   └── update-<feature>.dto.ts
└── entities/                 # (optional) Entity definitions
```

### Mobile Screen Pattern
```
app/(tabs)/<screen>/
├── index.tsx                 # Main screen component
├── [id].tsx                  # Dynamic route (optional)
└── _layout.tsx              # Layout (optional)
```
