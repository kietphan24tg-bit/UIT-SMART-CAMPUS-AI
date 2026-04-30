# Hướng dẫn Phát triển

## Yêu cầu hệ thống

| Phần mềm | Phiên bản | Ghi chú |
|----------|-----------|---------|
| Node.js | >= 20.0.0 | Dùng `nvm` để quản lý versions |
| pnpm | >= 9.0.0 | `npm install -g pnpm` |
| Docker Desktop | Latest | Cho PostgreSQL + Redis + MinIO local |
| Git | >= 2.40 | |
| Expo Go | Latest | Trên điện thoại để test |
| Android Studio | Latest | Bắt buộc nếu chạy `expo run:android` (SDK + emulator) |

### Cài đặt Node.js với nvm (khuyên dùng)

```bash
# Windows (dùng nvm-windows)
# Download từ: https://github.com/coreybutler/nvm-windows

nvm install 20
nvm use 20

# Cài pnpm
npm install -g pnpm
```

## Setup dự án

### 1. Clone repository

```bash
git clone <repo-url>
cd SE346_DoAn
```

### 2. Cài đặt dependencies

```bash
pnpm install
```

### 3. Setup biến môi trường

```bash
# API
cp apps/api/.env.example apps/api/.env.local

# Mobile
cp apps/mobile/.env.example apps/mobile/.env.local
```

Chỉnh sửa `apps/api/.env.local`:
```env
# Database
DATABASE_URL="postgresql://smartcampus:smartcampus_dev@localhost:65432/smart_campus"
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="smart-campus-dev-secret"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# Server
PORT=3000
CORS_ORIGIN="*"
APP_BASE_URL="http://localhost:3000"
```

Chỉnh sửa `apps/mobile/.env.local`:
```env
EXPO_PUBLIC_API_URL="http://10.0.2.2:3000/api/v1"
EXPO_PUBLIC_EAS_PROJECT_ID="your-project-id"
```

### 4. Khởi động database

```bash
cd apps/api
docker compose up -d
cd ../..
```

Kiểm tra services chạy:
```bash
docker ps
# Phải thấy smart-campus-db, smart-campus-redis và smart-campus-minio đang chạy
```

### 5. Chạy migration và seed

```bash
# Generate Prisma client
pnpm db:generate

# Chạy migrations
pnpm db:migrate

# Seed dữ liệu mẫu
pnpm db:seed
```

### 6. Chạy dự án

```bash
# Chạy tất cả (api + mobile)
pnpm dev

# Hoặc chạy riêng
pnpm dev:api      # Backend tại http://localhost:3000
pnpm dev:mobile   # Mobile app
```

### 7. Xem API docs

Truy cập Swagger docs tại: http://localhost:3000/docs

---

## Flow chạy dự án từ đầu (không lỗi)

Dự án dùng **pnpm** (monorepo). Nên chạy lệnh từ **thư mục gốc** repo.

### Thứ tự chuẩn

1. **Docker** bật → `cd apps/api && docker compose up -d`
2. **Biến môi trường API** → `apps/api/.env.local`
3. **Biến môi trường Mobile** → `apps/mobile/.env.local`
4. **Database** → `pnpm db:generate` → `pnpm db:migrate` → `pnpm db:seed`
5. **Backend** → terminal 1: `pnpm dev:api` (giữ chạy, cổng 3000)
6. **Mobile** → chọn một trong hai cách dưới

### Cách A - Expo Go (nhanh, không cần build native)

```bash
pnpm dev:mobile
```

Trong terminal Expo: nhấn `a` (Android emulator) hoặc quét QR bằng Expo Go trên điện thoại.

### Cách B - Build native Android (`development build`)

Cần **Android Studio** (SDK, platform tools) và **emulator đang bật** hoặc máy thật bật USB debugging.

```bash
# Từ thư mục gốc repo
pnpm android:run
```

### API URL trên Android

Trên **Android emulator**, backend trên máy host nên dùng:

- **`http://10.0.2.2:3000/api/v1`**

**Điện thoại thật + Expo Go / build:** dùng IP LAN máy tính, ví dụ `http://192.168.1.x:3000/api/v1`.

## Cấu trúc dự án

```
SE346/
├── apps/
│   ├── api/          # NestJS backend
│   └── mobile/       # Expo React Native
├── packages/
│   ├── shared/       # Types, constants, utils dùng chung
│   ├── eslint-config/
│   └── typescript-config/
├── docs/             # Tài liệu dự án
└── infrastructure/   # Docker, deployment configs
```

## Lệnh thường dùng

### Development
```bash
pnpm dev              # Chạy tất cả apps
pnpm dev:api          # Chỉ chạy backend
pnpm dev:mobile       # Chỉ chạy mobile
pnpm android:run      # Build & chạy app trên Android
```

Trong `apps/mobile` cũng có thể: `pnpm android` hoặc `pnpm android:run`.

### Database
```bash
pnpm db:generate      # Generate Prisma client sau khi đổi schema
pnpm db:migrate       # Tạo và chạy migration
pnpm db:seed          # Seed dữ liệu mẫu
pnpm db:reset:demo    # Reset + seed demo
cd apps/api && pnpm db:studio  # Mở Prisma Studio (GUI)
```

### Chất lượng code
```bash
pnpm lint             # Kiểm tra lint
pnpm lint:fix         # Tự động sửa lint errors
pnpm format           # Format code
pnpm format:check     # Kiểm tra format
pnpm test             # Chạy tests
```

### Build
```bash
pnpm build            # Build tất cả
pnpm build:api        # Build chỉ backend
```

## Xử lý sự cố

### Lỗi thường gặp

**1. `pnpm install` thất bại**
```bash
# Xoá node_modules và cài lại
pnpm clean
pnpm install
```

**2. Database connection refused**
```bash
# Kiểm tra Docker đang chạy
docker ps

# Restart containers
cd apps/api && docker compose down && docker compose up -d
```

**3. Prisma migration lỗi**
```bash
# Reset database (mất hết dữ liệu!)
cd apps/api
pnpm exec prisma migrate reset
```

**4. Port 3000 đã bị chiếm**
```bash
# Tìm và tắt process
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

**5. Expo không kết nối được với API**
- Đảm bảo điện thoại và máy tính cùng mạng WiFi
- Đổi `EXPO_PUBLIC_API_URL` trong mobile env sang IP LAN của máy tính
- Ví dụ: `http://192.168.1.100:3000/api/v1`
- **Android emulator:** dùng `http://10.0.2.2:3000/api/v1` thay vì `localhost`

**6. Schedule trên app vẫn có dữ liệu dù backend lỗi**
- Mobile hiện còn preview fallback cho lịch học/lịch dạy
- Kiểm tra thêm log request `/schedules` và trạng thái API trước khi kết luận dữ liệu đang lấy thật từ backend
