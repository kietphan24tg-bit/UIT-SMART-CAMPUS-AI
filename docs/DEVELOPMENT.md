# Huong dan Phat trien

## Yeu cau he thong

| Phan mem | Phien ban | Ghi chu |
|----------|-----------|---------|
| Node.js | >= 20.0.0 | Dung `nvm` de quan ly versions |
| pnpm | >= 9.0.0 | `npm install -g pnpm` |
| Docker Desktop | Latest | Cho PostgreSQL + Redis |
| Git | >= 2.40 | |
| Expo Go | Latest | Tren dien thoai de test |

### Cai dat Node.js voi nvm (khuyen dung)

```bash
# Windows (dung nvm-windows)
# Download tu: https://github.com/coreybutler/nvm-windows

nvm install 20
nvm use 20

# Cai pnpm
npm install -g pnpm
```

## Setup du an

### 1. Clone repository

```bash
git clone https://github.com/<your-org>/smart-campus.git
cd smart-campus
```

### 2. Cai dat dependencies

```bash
pnpm install
```

### 3. Setup environment variables

```bash
# Copy file env mau
cp .env.example apps/api/.env.local
```

Chinh sua `apps/api/.env.local`:
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

### 4. Khoi dong database

```bash
cd apps/api
docker compose up -d
cd ../..
```

Kiem tra database chay:
```bash
docker ps
# Phai thay smart-campus-db va smart-campus-redis dang chay
```

### 5. Chay migration va seed

```bash
# Generate Prisma client
pnpm db:generate

# Chay migrations
pnpm db:migrate

# Seed du lieu mau
pnpm db:seed
```

### 6. Chay du an

```bash
# Chay tat ca (api + mobile)
pnpm dev

# Hoac chay rieng
pnpm dev:api      # Backend tai http://localhost:3000
pnpm dev:mobile   # Mobile app
```

### 7. Xem API docs

Truy cap Swagger docs tai: http://localhost:3000/docs

## Cau truc du an

```
SE346/
├── apps/
│   ├── api/          # NestJS backend
│   └── mobile/       # Expo React Native
├── packages/
│   ├── shared/       # Types, constants, utils dung chung
│   ├── eslint-config/
│   └── typescript-config/
├── docs/             # Tai lieu du an
└── infrastructure/   # Docker, deployment configs
```

## Lenh thuong dung

### Development
```bash
pnpm dev              # Chay tat ca apps
pnpm dev:api          # Chi chay backend
pnpm dev:mobile       # Chi chay mobile
```

### Database
```bash
pnpm db:generate      # Generate Prisma client sau khi doi schema
pnpm db:migrate       # Tao va chay migration
pnpm db:seed          # Seed du lieu mau
cd apps/api && pnpm db:studio  # Mo Prisma Studio (GUI)
```

### Code Quality
```bash
pnpm lint             # Kiem tra lint
pnpm lint:fix         # Tu dong sua lint errors
pnpm format           # Format code
pnpm format:check     # Kiem tra format
pnpm test             # Chay tests
```

### Build
```bash
pnpm build            # Build tat ca
pnpm build:api        # Build chi backend
```

## Troubleshooting

### Loi thuong gap

**1. `pnpm install` that bai**
```bash
# Xoa node_modules va cai lai
pnpm clean
pnpm install
```

**2. Database connection refused**
```bash
# Kiem tra Docker dang chay
docker ps

# Restart containers
cd apps/api && docker compose down && docker compose up -d
```

**3. Prisma migration loi**
```bash
# Reset database (mat het du lieu!)
cd apps/api
pnpm exec prisma migrate reset
```

**4. Port 3000 da bi chiem**
```bash
# Tim va tat process
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

**5. Expo khong ket noi duoc voi API**
- Dam bao dien thoai va may tinh cung mang WiFi
- Doi `API_URL` trong mobile config sang IP LAN cua may tinh
- Vi du: `http://192.168.1.100:3000/api/v1`
