# Hướng dẫn Phát triển

## Yêu cầu hệ thống

| Phần mềm | Phiên bản | Ghi chú |
|----------|-----------|---------|
| Node.js | >= 20.0.0 | Dùng `nvm` để quản lý versions |
| pnpm | >= 9.0.0 | `npm install -g pnpm` |
| Docker Desktop | Latest | Cho PostgreSQL + Redis |
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
git clone https://github.com/<your-org>/smart-campus.git
cd smart-campus
```

### 2. Cài đặt dependencies

```bash
pnpm install
```

### 3. Setup biến môi trường

```bash
# Copy file env mẫu
cp .env.example apps/api/.env.local
```

Chỉnh sửa `apps/api/.env.local`:
```env
# Database
DATABASE_URL="postgresql://smartcampus:smartcampus_dev@localhost:5432/smart_campus"

# JWT
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# Server
PORT=3000
CORS_ORIGIN="*"
```

### 4. Khởi động database

```bash
cd apps/api
docker compose up -d
cd ../..
```

Kiểm tra database chạy:
```bash
docker ps
# Phải thấy smart-campus-db và smart-campus-redis đang chạy
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

Dự án dùng **pnpm** (monorepo). Nên chạy lệnh từ **thư mục gốc** `smart-campus/`.

### Thứ tự chuẩn

1. **Docker** bật → `cd apps/api && docker compose up -d`
2. **Biến môi trường API** → `apps/api/.env.local` (xem mục 3)
3. **Database** → `pnpm db:generate` → `pnpm db:migrate` → `pnpm db:seed`
4. **Backend** → terminal 1: `pnpm dev:api` (giữ chạy, cổng 3000)
5. **Mobile** → chọn một trong hai cách dưới

### Cách A — Expo Go (nhanh, không cần build native)

```bash
pnpm dev:mobile
```

Trong terminal Expo: nhấn `a` (Android emulator) hoặc quét QR bằng Expo Go trên điện thoại.

### Cách B — Build native Android (`development build`)

Cần **Android Studio** (SDK, platform tools) và **emulator đang bật** hoặc máy thật bật USB debugging.

```bash
# Từ thư mục gốc repo
pnpm android:run
```

Lần đầu có thể mất vài phút (Expo tạo thư mục `android/` tạm thời nếu chưa có).

**Lưu ý:** Không dùng `npm run android:run` ở root nếu chưa có script trong `package.json` của npm — repo này định nghĩa script qua **pnpm** (`pnpm android:run`). Nếu bắt buộc dùng npm: `npm run android:run` chỉ chạy được sau khi root `package.json` đã có script tương ứng (đã thêm).

### API URL trên Android

Mặc định app gọi `http://localhost:3000/api/v1`. Trên **Android emulator**, `localhost` là chính emulator — backend trên máy host cần dùng:

- **`http://10.0.2.2:3000/api/v1`** (emulator → máy Windows/Mac/Linux chạy API)

Cách chỉnh nhanh: thêm vào `app.json` trong `expo`:

```json
"extra": {
  "apiUrl": "http://10.0.2.2:3000/api/v1"
}
```

Hoặc tách theo môi trường bằng `app.config.js` + biến `EXPO_PUBLIC_API_URL` (khuyên dùng khi team lớn).

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
pnpm android:run      # Build & chạy app trên Android (expo run:android)
```

Trong `apps/mobile` cũng có thể: `pnpm android` hoặc `pnpm android:run`.

### Database
```bash
pnpm db:generate      # Generate Prisma client sau khi đổi schema
pnpm db:migrate       # Tạo và chạy migration
pnpm db:seed          # Seed dữ liệu mẫu
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
- Đổi `API_URL` trong mobile config sang IP LAN của máy tính
- Ví dụ: `http://192.168.1.100:3000/api/v1`
- **Android emulator:** dùng `http://10.0.2.2:3000/api/v1` thay vì `localhost`

**6. `npm run android:run` báo "Missing script" hoặc lỗi**
- Repo dùng **pnpm**: chạy `pnpm android:run` từ thư mục gốc, hoặc `cd apps/mobile && pnpm android:run`
- Cài Android Studio, mở **Device Manager** tạo/khởi động emulator trước
- Đặt `ANDROID_HOME` (Windows: thường `%LOCALAPPDATA%\Android\Sdk`)
