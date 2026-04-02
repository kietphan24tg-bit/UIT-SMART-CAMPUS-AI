# Smart Campus - UIT Super App

[![React Native](https://img.shields.io/badge/React%20Native-Expo-blue?logo=expo)](https://expo.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red?logo=nestjs)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://www.postgresql.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-blueviolet?logo=turborepo)](https://turbo.build/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)

> Ung dung tat-ca-trong-mot danh cho sinh vien UIT. Quan ly thoi khoa bieu, diem so, thong bao, su kien va nhieu tinh nang thong minh khac.

## Tong quan

Smart Campus la mot super app danh cho sinh vien Truong Dai hoc Cong nghe Thong tin (UIT), giup so hoa toan bo hoat dong hoc tap va sinh hoat trong truong.

## Tech Stack

| Thanh phan | Cong nghe |
|---|---|
| Mobile App | React Native (Expo), Expo Router, Zustand, React Query |
| Backend API | NestJS, Prisma, PostgreSQL |
| Monorepo | Turborepo, pnpm workspaces |
| CI/CD | GitHub Actions, EAS Build |
| Infrastructure | Docker, Nginx |

## Bat dau nhanh

### Yeu cau

- Node.js >= 20
- pnpm >= 9
- Docker Desktop (cho PostgreSQL + Redis)
- Expo Go (tren dien thoai) hoac Android Emulator / iOS Simulator

### Cai dat

```bash
# 1. Clone repository
git clone https://github.com/<your-org>/smart-campus.git
cd smart-campus

# 2. Cai dat dependencies
pnpm install

# 3. Khoi dong database (can Docker)
cd apps/api && docker compose up -d && cd ../..

# 4. Setup environment variables
cp .env.example .env.local

# 5. Chay database migration
pnpm db:migrate

# 6. Seed du lieu mau
pnpm db:seed

# 7. Chay du an
pnpm dev
```

### Chay rieng tung app

```bash
# Chi chay backend
pnpm dev:api

# Chi chay mobile
pnpm dev:mobile
```

## Cau truc du an

```
smart-campus/
├── apps/
│   ├── api/          # NestJS Backend
│   └── mobile/       # Expo React Native App
├── packages/
│   ├── shared/       # Shared types, constants, utils
│   ├── eslint-config/# Shared ESLint configs
│   └── typescript-config/ # Shared TS configs
├── docs/             # Documentation
└── infrastructure/   # Docker, Nginx configs
```

## Tai lieu

- [Huong dan phat trien](docs/DEVELOPMENT.md)
- [Kien truc he thong](docs/ARCHITECTURE.md)
- [Quy tac lap trinh](docs/CONVENTIONS.md)
- [Quy trinh lam viec](docs/WORKFLOW.md)
- [Database schema](docs/DATABASE.md)
- [Huong dan deploy](docs/DEPLOYMENT.md)
- [Danh sach tinh nang](docs/FEATURES.md)
- [Huong dan dong gop](CONTRIBUTING.md)

## Nhom phat trien

Du an thuoc mon hoc SE346 - Truong Dai hoc Cong nghe Thong tin (UIT).

## License

[MIT](LICENSE)
