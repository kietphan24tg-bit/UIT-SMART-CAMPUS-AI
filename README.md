

# UIT Smart Campus 

![React Native](https://img.shields.io/badge/React%20Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turbo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

**Ứng dụng tất-cả-trong-một dành cho sinh viên Trường Đại học Công nghệ Thông tin (UIT)**

---

## Giới thiệu

**UIT Smart Campus** là super app giúp số hoá toàn bộ hoạt động học tập và sinh hoạt của sinh viên UIT — từ xem thời khoá biểu, tra cứu điểm, nhận thông báo, đến chatbot AI hỗ trợ 24/7.

### 8 nhóm tính năng — 3 giai đoạn phát triển


| #   | Tính năng               | Mô tả                                          | Phase | Trạng thái |
| --- | ----------------------- | ---------------------------------------------- | ----- | ---------- |
| 1   | **Super App cơ bản**    | TKB, điểm/GPA, thông báo, hồ sơ SV             | 1     | ✅ API      |
| 2   | **AI Chatbot**          | Trợ lý ảo trả lời câu hỏi SV 24/7              | 2     | 🔜         |
| 3   | **Sự kiện & Cộng đồng** | Đăng ký workshop, CLB, check-in QR             | 2     | 🔜         |
| 4   | **ĐKMH & Đặt phòng**    | Đăng ký môn học, đặt phòng học/lab             | 2     | 🔜         |
| 5   | **Điểm danh QR**        | Giảng viên tạo QR, SV scan điểm danh           | 2     | 🔜         |
| 6   | **Bản đồ trường**       | Tìm phòng, chỉ đường trong campus              | 3     | 🔜         |
| 7   | **Thư viện Thông minh** | Tìm sách, mượn/trả, đặt chỗ ngồi               | 3     | 🔜         |
| 8   | **IoT**                 | Bãi xe thông minh, phòng học TM (đèn LED demo) | 3     | 🔜         |


> Xem roadmap chi tiết, user stories và phân quyền tại [docs/FEATURES.md](docs/FEATURES.md)

### Phân quyền (5 vai trò)


| Vai trò            | Mô tả                                                            |
| ------------------ | ---------------------------------------------------------------- |
| 🎓 **Student**     | Xem TKB, điểm, thông báo, ĐKMH, đặt phòng, chatbot, điểm danh QR |
| 👨‍🏫 **Lecturer** | Quản lý lớp, nhập điểm, tạo QR điểm danh, gửi thông báo          |
| 🍽️ **Canteen Admin** | Quản lý menu canteen, đơn hàng và hoàn tất đơn đã thanh toán     |
| 🏫 **Admin**       | Quản lý users, courses, sự kiện, phòng, thư viện, bãi xe         |
| 🔑 **Super Admin** | Toàn quyền hệ thống, cấu hình IoT                                |

> Quy ước hiện tại: `admin/super_admin` có toàn quyền trên các tính năng đã live.
> Các năng lực chưa hoàn thiện được hiển thị là `Sắp triển khai`/`unsupported`, không coi là đã live.


## Tech Stack


| Tầng              | Công nghệ                                                         |
| ----------------- | ----------------------------------------------------------------- |
| **Mobile**        | React Native (Expo SDK 52), Expo Router, Zustand, TanStack Query  |
| **Backend**       | NestJS 10, Prisma ORM, PostgreSQL 16, Passport + JWT, RBAC Guards |
| **Monorepo**      | Turborepo, pnpm workspaces                                        |
| **Kiểm thử**      | Jest, Testing Library, Maestro (E2E mobile)                       |
| **CI/CD**         | GitHub Actions, Expo EAS Build                                    |
| **Hạ tầng**       | Docker, Nginx, Redis                                              |
| **IoT** (Phase 3) | MQTT, ESP32, đèn LED demo                                         |


## Bắt đầu nhanh

### Yêu cầu

- **Node.js** >= 20 — khuyên dùng [nvm](https://github.com/coreybutler/nvm-windows)
- **pnpm** >= 9 — `npm install -g pnpm`
- **Docker Desktop** — cho PostgreSQL + Redis
- **Expo Go** (trên điện thoại) hoặc Android Emulator / iOS Simulator

### Cài đặt & Khởi chạy

```bash
# 1. Clone repository
git clone https://github.com/<your-org>/smart-campus.git
cd smart-campus

# 2. Cài đặt dependencies
pnpm install

# 3. Khởi động database (cần Docker)
cd apps/api && docker compose up -d && cd ../..

# 4. Setup biến môi trường
cp .env.example .env.local

# 5. Chạy database migration & seed dữ liệu mẫu
pnpm db:migrate
pnpm db:seed

# 6. Khởi chạy dự án
pnpm dev
```

> **Backend** chạy tại `http://localhost:3000` · **Swagger API docs** tại `http://localhost:3000/docs`

### Chạy riêng từng app

```bash
pnpm dev:api       # Chỉ chạy backend
pnpm dev:mobile    # Chỉ chạy mobile app
```

## Cấu trúc dự án

```
smart-campus/
├── apps/
│   ├── api/                # NestJS Backend API
│   │   ├── src/modules/    #   Feature modules (auth, users, schedule, ...)
│   │   ├── src/common/     #   Guards (JWT, Roles), filters, interceptors
│   │   ├── prisma/         #   Database schema & migrations
│   │   └── test/           #   E2E tests
│   └── mobile/             # Expo React Native App
│       ├── app/            #   Màn hình (file-based routing)
│       ├── stores/         #   Zustand state management
│       ├── services/       #   API client
│       └── .maestro/       #   E2E test flows (Maestro)
├── packages/
│   ├── shared/             # Types, constants, utils dùng chung
│   ├── eslint-config/      # Cấu hình ESLint chung
│   └── typescript-config/  # Cấu hình TypeScript chung
├── docs/                   # Tài liệu dự án
├── infrastructure/         # Docker, Nginx configs
└── .github/                # CI/CD workflows, issue/PR templates
```

## Kiểm thử

Dự án sử dụng **3 tầng kiểm thử**:

```bash
# Unit + Component tests (Jest)
pnpm test

# Với coverage report
pnpm test:cov

# E2E mobile (Maestro — cần emulator)
cd apps/mobile && pnpm test:e2e
```

> Chi tiết tại [docs/TESTING.md](docs/TESTING.md)

## Tài liệu


| Tài liệu                                    | Mô tả                                           |
| ------------------------------------------- | ----------------------------------------------- |
| [Hướng dẫn phát triển](docs/DEVELOPMENT.md) | Setup môi trường, lệnh thường dùng, xử lý sự cố |
| [Kiến trúc hệ thống](docs/ARCHITECTURE.md)  | Tech stack, phân quyền, luồng dữ liệu           |
| [Quy tắc lập trình](docs/CONVENTIONS.md)    | Naming, TypeScript, import order, API format    |
| [Quy trình làm việc](docs/WORKFLOW.md)      | Sprint theo phase, Git workflow, phân công nhóm |
| [Database Schema](docs/DATABASE.md)         | ERD, mô tả bảng, migration guide                |
| [Hướng dẫn Deploy](docs/DEPLOYMENT.md)      | Docker, VPS, EAS Build, CI/CD pipeline          |
| [Tính năng & Roadmap](docs/FEATURES.md)     | 8 tính năng, 3 phase, phân quyền RBAC           |
| [Kiểm thử](docs/TESTING.md)                 | Jest, Testing Library, Maestro E2E              |
| [Hướng dẫn đóng góp](CONTRIBUTING.md)       | Branch, commit, PR, review process              |
| [Quy tắc ứng xử](CODE_OF_CONDUCT.md)        | Tiêu chuẩn hành vi trong dự án                  |


## Nhóm phát triển

Dự án thuộc môn học **SE346** — Trường Đại học Công nghệ Thông tin (UIT), ĐHQG TP.HCM.


| Vai trò               | Trách nhiệm                                         |
| --------------------- | --------------------------------------------------- |
| Team Lead / Fullstack | Setup repo, infrastructure, auth, RBAC, code review |
| Backend Developer     | NestJS modules, database, API endpoints, phân quyền |
| Mobile Developer      | React Native screens, UI/UX, navigation             |
| Mobile + Integration  | State management, API integration, E2E testing      |


## Giấy phép

Phát hành dưới giấy phép [MIT](LICENSE).
