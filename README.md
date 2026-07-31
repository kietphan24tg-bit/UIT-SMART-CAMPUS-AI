
# UIT Smart Campus 

![React Native](https://img.shields.io/badge/React%20Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turbo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

**Ứng dụng tất-cả-trong-một dành cho sinh viên Trường Đại học Công nghệ Thông tin (UIT)** Copyright by Phạm Minh Quân (24521449)

---

## Giới thiệu

**UIT Smart Campus** là super app giúp số hoá toàn bộ hoạt động học tập và sinh hoạt của sinh viên UIT, từ xem thời khoá biểu, tra cứu điểm, nhận thông báo, đến các luồng vận hành như điểm danh, đặt phòng, canteen, bãi xe và SOS.

### 8 nhóm tính năng - 3 giai đoạn phát triển


| #   | Tính năng               | Mô tả                                          | Phase | Trạng thái |
| --- | ----------------------- | ---------------------------------------------- | ----- | ---------- |
| 1   | **Super App cơ bản**    | TKB, điểm/GPA, thông báo, hồ sơ SV             | 1     | ✅ Đã có API + mobile core |
| 2   | **AI Chatbot**          | Trợ lý ảo trả lời câu hỏi SV 24/7              | 2     | ✅ Đã có API + giao diện cơ bản |
| 3   | **Sự kiện & Cộng đồng** | Danh sách sự kiện, mở rộng đăng ký/check-in    | 2     | ✅ Đã có API + giao diện listing/detail |
| 4   | **ĐKMH & Đặt phòng**    | Đăng ký môn học, đặt phòng học/lab             | 2     | ✅ Đang dùng trong app |
| 5   | **Điểm danh QR**        | Giảng viên tạo QR, SV scan điểm danh           | 2     | ✅ Đang dùng trong app |
| 6   | **Bản đồ trường**       | Tìm phòng, chỉ đường trong campus              | 3     | 🟡 Đã có giao diện tích hợp |
| 7   | **Thư viện Thông minh** | Tìm sách, mượn/trả, đặt chỗ ngồi               | 3     | ✅ Đã có API + giao diện cơ bản |
| 8   | **IoT**                 | Bãi xe thông minh, phòng học TM, cảnh báo cháy | 3     | 🟡 Đã có API + một phần giao diện vận hành |


> Xem thêm trạng thái hiện tại tại [docs/FEATURES.md](docs/FEATURES.md)

### Phân quyền (3 vai trò)


| Vai trò            | Mô tả                                                            |
| ------------------ | ---------------------------------------------------------------- |
| 🎓 **Student**     | Xem TKB, điểm, thông báo, ĐKMH, đặt phòng, chatbot, điểm danh QR |
| 👨‍🏫 **Lecturer** | Quản lý lớp, nhập điểm, tạo QR điểm danh, gửi thông báo          |
| 🏫 **Admin**       | Quản lý users, courses, phòng, thư viện, bãi xe, queue vận hành  |


> Quy ước hiện tại: `admin` có toàn quyền trên các tính năng đã live.  
> Các tính năng roadmap hoặc chưa hoàn thiện không nên coi là production-ready chỉ dựa vào README.


## Tech Stack


| Tầng              | Công nghệ                                                         |
| ----------------- | ----------------------------------------------------------------- |
| **Mobile**        | React Native 0.81, Expo SDK 54, Expo Router, Zustand, TanStack Query |
| **Backend**       | NestJS 10, Prisma ORM, PostgreSQL 16, Passport + JWT, RBAC Guards |
| **Monorepo**      | Turborepo, pnpm workspaces                                        |
| **Kiểm thử**      | Jest, Testing Library, Maestro (E2E mobile)                       |
| **CI/CD**         | GitHub Actions, Expo EAS Build                                    |
| **Hạ tầng**       | Docker, Redis, MinIO                                              |
| **IoT**           | Telemetry ingress, parking scan, fire alert integration           |


## Bắt đầu nhanh

### Yêu cầu

- **Node.js** >= 20 - khuyên dùng [nvm](https://github.com/coreybutler/nvm-windows)
- **pnpm** >= 9 - `npm install -g pnpm`
- **Docker Desktop** - cho PostgreSQL, Redis, MinIO local
- **Expo Go** (trên điện thoại) hoặc Android Emulator / iOS Simulator

### Cài đặt & Khởi chạy

```bash
# 1. Clone repository
git clone <repo-url>
cd SE346_DoAn

# 2. Cài đặt dependencies
pnpm install

# 3. Khởi động local services (PostgreSQL + Redis + MinIO)
cd apps/api && docker compose up -d && cd ../..

# 4. Setup biến môi trường
# API
cp apps/api/.env.example apps/api/.env.local

# Mobile
cp apps/mobile/.env.example apps/mobile/.env.local

# 5. Chạy database migration & seed dữ liệu mẫu
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 6. Khởi chạy dự án
pnpm dev
```

> **Backend** chạy tại `http://localhost:3000`  
> **Base API**: `http://localhost:3000/api/v1`  
> **Swagger API docs** tại `http://localhost:3000/docs`

### Chạy riêng từng app

```bash
pnpm dev:api       # Chỉ chạy backend
pnpm dev:mobile    # Chỉ chạy mobile app
pnpm android:run   # Build/chạy Android native
```

### Lưu ý tích hợp mobile

- Android emulator nên dùng `http://10.0.2.2:3000/api/v1`
- Thiết bị thật nên dùng IP LAN của máy đang chạy backend
- Riêng luồng `schedule` hiện vẫn có preview fallback trong mobile nếu request backend lỗi; thấy lịch trên app không đồng nghĩa backend đang hoạt động đúng

## Cấu trúc dự án

```
smart-campus/
├── apps/
│   ├── api/                # NestJS Backend API
│   │   ├── src/modules/    #   Feature modules
│   │   ├── src/common/     #   Guards, filters, interceptors, decorators
│   │   ├── prisma/         #   Database schema, migrations, seed
│   │   └── test/           #   E2E tests
│   └── mobile/             # Expo React Native App
│       ├── app/            #   Màn hình (file-based routing)
│       ├── stores/         #   Zustand state management
│       ├── services/       #   API client và notification helpers
│       └── .maestro/       #   E2E test flows (Maestro)
├── packages/
│   ├── shared/             # Types, constants, utils dùng chung
│   ├── eslint-config/      # Cấu hình ESLint chung
│   └── typescript-config/  # Cấu hình TypeScript chung
├── docs/                   # Tài liệu dự án
├── infrastructure/         # Hạ tầng và deploy notes
└── .github/                # CI/CD workflows, issue/PR templates
```

## Kiểm thử

Dự án sử dụng nhiều tầng kiểm thử:

```bash
# Unit + component tests
pnpm test

# Theo app
pnpm test:api
pnpm test:mobile

# Coverage
pnpm test:cov

# E2E mobile (Maestro - cần emulator/device)
cd apps/mobile && pnpm test:e2e
```

> Chi tiết tại [docs/TESTING.md](docs/TESTING.md)

## Tài liệu


| Tài liệu                                    | Mô tả                                           |
| ------------------------------------------- | ----------------------------------------------- |
| [Hướng dẫn phát triển](docs/DEVELOPMENT.md) | Setup môi trường, lệnh thường dùng, xử lý sự cố |
| [Kiến trúc hệ thống](docs/ARCHITECTURE.md)  | Cấu trúc runtime, module map, data flow         |
| [Quy tắc lập trình](docs/CONVENTIONS.md)    | Naming, TypeScript, import order, API format    |
| [Quy trình làm việc](docs/WORKFLOW.md)      | Git workflow, phân công nhóm, nhịp làm việc     |
| [Database](docs/DATABASE.md)                | Prisma schema, migration, seed, phạm vi DB      |
| [API](docs/API.md)                          | Route map backend hiện tại                      |
| [Hướng dẫn Deploy](docs/DEPLOYMENT.md)      | Biến môi trường và assumptions khi deploy       |
| [Tính năng](docs/FEATURES.md)               | Trạng thái tính năng theo code hiện tại         |
| [Kiểm thử](docs/TESTING.md)                 | Jest, Testing Library, Maestro E2E              |
| [Hướng dẫn đóng góp](CONTRIBUTING.md)       | Branch, commit, PR, review process              |
| [Quy tắc ứng xử](CODE_OF_CONDUCT.md)        | Tiêu chuẩn hành vi trong dự án                  |


## Nhóm phát triển

Dự án thuộc môn học **SE346** - Trường Đại học Công nghệ Thông tin (UIT), ĐHQG TP.HCM.


| Vai trò               | Trách nhiệm                                         |
| --------------------- | --------------------------------------------------- |
| Team Lead / Fullstack | Setup repo, infrastructure, auth, RBAC, code review |
| Backend Developer     | NestJS modules, database, API endpoints, phân quyền |
| Mobile Developer      | React Native screens, UI/UX, navigation             |
| Mobile + Integration  | State management, API integration, E2E testing      |


## Giấy phép

Phát hành dưới giấy phép [MIT](LICENSE).
