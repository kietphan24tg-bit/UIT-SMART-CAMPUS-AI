# Hướng dẫn Deploy

## Tổng quan

| Thành phần | Nơi deploy | Chi phí |
|---|---|---|
| Backend API | Docker + VPS hoặc runtime tương đương | tuỳ hạ tầng |
| Database | PostgreSQL managed hoặc self-hosted | tuỳ hạ tầng |
| Redis | managed Redis hoặc self-hosted | tuỳ hạ tầng |
| Mobile App | Expo EAS Build | theo gói Expo |
| Push Notifications | Expo Push / Firebase stack phụ trợ | tuỳ cấu hình |
| CI/CD | GitHub Actions | theo gói GitHub |

## Backend Deployment

### Phương án 1: Docker + VPS

#### 1. Setup VPS
- Tạo VPS trên DigitalOcean, AWS, Hetzner hoặc nền tảng tương đương
- OS: Ubuntu 22.04 LTS hoặc tương đương
- Cài đặt Docker và Docker Compose

#### 2. Build Docker image
```bash
cd apps/api
docker build -t smart-campus-api .
```

#### 3. Docker Compose Production
Repo hiện commit file local ở `apps/api/docker-compose.yml` cho development.  
Khi deploy production, nên có compose hoặc manifest riêng cho:

- API
- PostgreSQL
- Redis
- object storage / MinIO hoặc dịch vụ tương đương

#### 4. Nginx Reverse Proxy
Cấu hình Nginx để proxy requests từ domain đến API:
- HTTP → HTTPS redirect
- SSL certificate (Let's Encrypt)
- Proxy pass to port 3000

### Phương án 2: Managed Services
Nếu muốn đơn giản hơn, có thể dùng:
- Managed PostgreSQL
- Managed Redis
- S3-compatible object storage cho avatar
- VPS/container runtime chỉ chạy API

## Mobile Deployment

### Expo EAS Build

#### 1. Cài đặt EAS CLI
```bash
npm install -g eas-cli
eas login
```

#### 2. Build cho testing (internal distribution)
```bash
cd apps/mobile

# Android APK/AAB cho testing
eas build --platform android --profile preview

# iOS (cần Apple Developer account)
eas build --platform ios --profile preview
```

#### 3. Build cho production
```bash
# Android
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production
```

#### 4. Submit lên store
```bash
eas submit --platform android
eas submit --platform ios
```

## CI/CD Pipeline

### GitHub Actions Workflows

#### CI (trên mỗi Pull Request)
1. Checkout code
2. Setup Node.js + pnpm
3. Install dependencies
4. Chạy lint
5. Chạy tests
6. Build check

#### CD — Backend (khi merge vào main)
1. Build Docker image
2. Push lên registry
3. Deploy lên VPS hoặc platform tương đương
4. Chạy `pnpm db:migrate:prod` cho backend nếu cần

#### CD — Mobile
1. Trigger EAS Build
2. Build Android + iOS
3. (Tuỳ chọn) Submit lên store

## Biến môi trường

### Development
- Copy `apps/api/.env.example` thành `apps/api/.env.local`
- Copy `apps/mobile/.env.example` thành `apps/mobile/.env.local`
- Không commit file `.env.local`

### Staging
- Sử dụng GitHub Secrets hoặc secret manager của hạ tầng
- Database/Redis/object storage nên tách riêng với dev

### Production
- Tất cả secrets lưu trong secret manager hoặc VPS environment
- Database: PostgreSQL managed hoặc self-hosted
- Cần cấu hình đúng cho:
  - `JWT_SECRET`
  - `DATABASE_URL`
  - `REDIS_URL`
  - `SMTP_*`
  - `MOMO_*`
  - `SEPAY_*`
  - `AVATAR_STORAGE_*`
  - `TRACK_ASIA_*`
  - `IOT_SHARED_SECRET`
  - `OPEN_LIBRARY_USER_AGENT`

## Cài đặt SSL/Domain

### Domain
1. Mua domain hoặc dùng domain tổ chức
2. Trỏ DNS A/AAAA record về IP của VPS
3. Sub-domain gợi ý:
   - `api.smartcampus.uit.edu.vn` — Backend API
   - `smartcampus.uit.edu.vn` — Landing page hoặc website giới thiệu

### SSL Certificate
Sử dụng Certbot (Let's Encrypt) để tạo SSL miễn phí:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.smartcampus.uit.edu.vn
```

## Ghi chú triển khai hiện tại

- Payment webhook phải public và map đúng vào backend
- Avatar upload hiện cần object storage compatible với S3/MinIO
- Password reset production cần SMTP thật, nếu không sẽ chỉ phù hợp local preview
- Mobile schedule có fallback preview, nên staging/prod cần giám sát API để tránh che khuất lỗi backend
