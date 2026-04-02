# Huong dan Deploy

## Tong quan

| Thanh phan | Noi deploy | Chi phi |
|---|---|---|
| Backend API | Docker + VPS (DigitalOcean/AWS) | ~$12/thang |
| Database | Supabase hoac Neon (PostgreSQL managed) | Free tier |
| Mobile App | Expo EAS Build | Free tier (30 builds/thang) |
| Push Notifications | Firebase Cloud Messaging | Free |
| CI/CD | GitHub Actions | Free (public repo) |

## Backend Deployment

### Option 1: Docker + VPS

#### 1. Setup VPS
- Tao VPS tren DigitalOcean (Droplet $12/thang) hoac AWS EC2 (free tier)
- OS: Ubuntu 22.04 LTS
- Cai dat Docker va Docker Compose

#### 2. Build Docker image
```bash
cd apps/api
docker build -t smart-campus-api .
```

#### 3. Docker Compose Production
Su dung file `infrastructure/docker/docker-compose.prod.yml`:
```bash
cd infrastructure/docker
docker compose -f docker-compose.prod.yml up -d
```

#### 4. Nginx Reverse Proxy
Config Nginx de proxy requests tu domain den Docker container:
- HTTP -> HTTPS redirect
- SSL certificate (Let's Encrypt)
- Proxy pass to port 3000

### Option 2: Supabase (Database + Auth)
Neu muon don gian hon, co the dung Supabase cho:
- PostgreSQL database (free tier: 500MB)
- Authentication (tuy chon)
- File Storage
- Realtime subscriptions

## Mobile Deployment

### Expo EAS Build

#### 1. Cai dat EAS CLI
```bash
npm install -g eas-cli
eas login
```

#### 2. Build cho testing (internal distribution)
```bash
cd apps/mobile

# Android APK cho testing
eas build --platform android --profile preview

# iOS (can Apple Developer account)
eas build --platform ios --profile preview
```

#### 3. Build cho production
```bash
# Android (AAB cho Google Play)
eas build --platform android --profile production

# iOS (IPA cho App Store)
eas build --platform ios --profile production
```

#### 4. Submit len store
```bash
eas submit --platform android
eas submit --platform ios
```

## CI/CD Pipeline

### GitHub Actions Workflows

#### CI (tren moi Pull Request)
1. Checkout code
2. Setup Node.js + pnpm
3. Install dependencies
4. Run lint
5. Run tests
6. Build check

#### CD - Backend (khi merge vao main)
1. Build Docker image
2. Push len Container Registry
3. Deploy len VPS (SSH)

#### CD - Mobile (khi tao release tag)
1. Trigger EAS Build
2. Build Android + iOS
3. (Optional) Auto submit len store

## Environment Variables

### Development
- Copy `.env.example` thanh `.env.local` trong `apps/api/`
- Khong commit file `.env.local`

### Staging
- Su dung GitHub Secrets cho CI/CD
- Database: Supabase/Neon staging instance

### Production
- Tat ca secrets luu trong GitHub Secrets hoac VPS environment
- Database: Managed PostgreSQL (Supabase/Neon/AWS RDS)
- Change `JWT_SECRET` khac voi dev!

## SSL/Domain Setup

### Domain
1. Mua domain (namecheap, cloudflare, ...)
2. Tro DNS A record ve IP cua VPS
3. Sub-domain goi y:
   - `api.smartcampus.uit.edu.vn` - Backend API
   - `smartcampus.uit.edu.vn` - Landing page (optional)

### SSL Certificate
Su dung Certbot (Let's Encrypt) de tao SSL mien phi:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.smartcampus.uit.edu.vn
```
