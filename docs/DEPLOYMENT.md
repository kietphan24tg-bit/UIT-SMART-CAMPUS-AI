# Hướng dẫn Deploy

## Tổng quan

| Thành phần | Nơi deploy | Chi phí |
|---|---|---|
| Backend API | Docker + VPS (DigitalOcean/AWS) | ~$12/tháng |
| Database | Supabase hoặc Neon (PostgreSQL managed) | Free tier |
| Mobile App | Expo EAS Build | Free tier (30 builds/tháng) |
| Push Notifications | Firebase Cloud Messaging | Miễn phí |
| CI/CD | GitHub Actions | Miễn phí (public repo) |

## Backend Deployment

### Phương án 1: Docker + VPS

#### 1. Setup VPS
- Tạo VPS trên DigitalOcean (Droplet $12/tháng) hoặc AWS EC2 (free tier)
- OS: Ubuntu 22.04 LTS
- Cài đặt Docker và Docker Compose

#### 2. Build Docker image
```bash
cd apps/api
docker build -t smart-campus-api .
```

#### 3. Docker Compose Production
Sử dụng file `infrastructure/docker/docker-compose.prod.yml`:
```bash
cd infrastructure/docker
docker compose -f docker-compose.prod.yml up -d
```

#### 4. Nginx Reverse Proxy
Cấu hình Nginx để proxy requests từ domain đến Docker container:
- HTTP → HTTPS redirect
- SSL certificate (Let's Encrypt)
- Proxy pass to port 3000

### Phương án 2: Supabase (Database + Auth)
Nếu muốn đơn giản hơn, có thể dùng Supabase cho:
- PostgreSQL database (free tier: 500MB)
- Authentication (tuỳ chọn)
- File Storage
- Realtime subscriptions

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

# Android APK cho testing
eas build --platform android --profile preview

# iOS (cần Apple Developer account)
eas build --platform ios --profile preview
```

#### 3. Build cho production
```bash
# Android (AAB cho Google Play)
eas build --platform android --profile production

# iOS (IPA cho App Store)
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
2. Push lên Container Registry
3. Deploy lên VPS (SSH)

#### CD — Mobile (khi tạo release tag)
1. Trigger EAS Build
2. Build Android + iOS
3. (Tuỳ chọn) Auto submit lên store

## Biến môi trường

### Development
- Copy `.env.example` thành `.env.local` trong `apps/api/`
- Không commit file `.env.local`

### Staging
- Sử dụng GitHub Secrets cho CI/CD
- Database: Supabase/Neon staging instance

### Production
- Tất cả secrets lưu trong GitHub Secrets hoặc VPS environment
- Database: Managed PostgreSQL (Supabase/Neon/AWS RDS)
- Thay đổi `JWT_SECRET` khác với dev!

## Cài đặt SSL/Domain

### Domain
1. Mua domain (Namecheap, Cloudflare, ...)
2. Trỏ DNS A record về IP của VPS
3. Sub-domain gợi ý:
   - `api.smartcampus.uit.edu.vn` — Backend API
   - `smartcampus.uit.edu.vn` — Landing page (tuỳ chọn)

### SSL Certificate
Sử dụng Certbot (Let's Encrypt) để tạo SSL miễn phí:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.smartcampus.uit.edu.vn
```
