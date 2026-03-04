m# netflop

> Netflix mini cho video tự sản xuất — Đồ án tốt nghiệp

## 📋 Tổng quan

**netflop** là ứng dụng xem video tự sản xuất với trải nghiệm "Netflix vibe":
- 📱 **Mobile App** (Expo React Native) — Xem phim, tìm kiếm, resume, favorites
- 🖥️ **Admin Web** (Next.js) — Quản lý phim, upload, encode
- 🚀 **API** (NestJS + Prisma) — RESTful API, JWT auth, PostgreSQL
- ⚙️ **Worker** (BullMQ) — Encode MP4 → HLS

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Monorepo | pnpm + Turborepo |
| API | NestJS + Prisma + PostgreSQL |
| Queue | BullMQ + Redis |
| Storage | MinIO (S3-compatible) |
| Admin | Next.js 15 (App Router) |
| Mobile | Expo (React Native) |
| Worker | Node.js + FFmpeg |

## 📁 Cấu trúc dự án

```
netflop/
├── apps/
│   ├── api/        # NestJS API (port 3000)
│   ├── admin/      # Next.js Admin (port 3001)
│   ├── mobile/     # Expo React Native
│   └── worker/     # BullMQ Encode Worker
├── packages/
│   ├── shared/     # Shared types
│   └── tsconfig/   # TypeScript configs
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

## ⚡ Quick Start

### Prerequisites

- **Node.js** >= 20
- **pnpm** >= 8 (`npm install -g pnpm`)
- **Docker** + Docker Compose

### Setup

```bash
# 1. Clone repo
git clone <repo-url>
cd netflop

# 2. Install dependencies
pnpm install

# 3. Copy environment file
cp .env.example .env

# 4. Start infrastructure (PostgreSQL, Redis, MinIO)
pnpm infra:up

# 5. Generate Prisma client
pnpm db:generate

# 6. Run database migrations
pnpm db:migrate

# 7. Seed database
pnpm db:seed

# 8. Start all services
pnpm dev
```

### URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| API Health | http://localhost:3000/health | - |
| API Docs | http://localhost:3000/api | - |
| Admin CMS | http://localhost:3001/login | admin@netflop.local / admin123 |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin |
| Mobile | Expo Go app | - |

## 🔧 Commands

### Development

```bash
pnpm dev           # Start all services (API, Admin, Worker, Mobile)
pnpm infra:up      # Start Docker containers
pnpm infra:down    # Stop Docker containers
pnpm infra:logs    # View Docker logs
pnpm infra:reset   # Reset Docker volumes
```

### Database

```bash
pnpm db:generate   # Generate Prisma client
pnpm db:migrate    # Run migrations
pnpm db:seed       # Seed database
pnpm db:studio     # Open Prisma Studio
pnpm db:reset      # Reset database
```

### Build & Lint

```bash
pnpm build         # Build all apps
pnpm lint          # Lint all apps
pnpm typecheck     # Type check all apps
```

### 🎬 Demo Quickstart

```bash
# One-command release verification
pnpm release:check

# Prepare for demo (infra + seed)
pnpm demo:prep

# Then start services manually
cd apps/api && npm run start:dev
cd apps/worker && npx ts-node src/main.ts
cd apps/admin && npm run dev
cd apps/mobile && npx expo start
```

**Demo Documentation:**
- [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md) — 3-5 min demo flow
- [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md) — Pre-demo checklist
- [`DEMO_DATA.md`](./DEMO_DATA.md) — Accounts, URLs, timings

## 📱 Mobile App (Expo)

### Running on device

**Physical device:**
```bash
# Edit .env - replace localhost with your LAN IP
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:3000

cd apps/mobile
pnpm dev
# Scan QR code with Expo Go app
```

**Android Emulator:**
```bash
# Use special Android emulator IP
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000
```

**iOS Simulator:**
```bash
# localhost works for iOS simulator
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

## 🐳 Docker Services

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Queue + Cache |
| MinIO (S3) | 9000 | Object Storage API |
| MinIO Console | 9001 | MinIO Web UI |

### Reset everything

```bash
pnpm infra:reset
pnpm db:migrate
pnpm db:seed
```

## 🗄️ Database

### Default users (after seed)

| Email | Password | Role |
|-------|----------|------|
| admin@netflop.local | admin123 | Admin |
| viewer@netflop.local | viewer123 | Viewer |

### Prisma Studio

```bash
pnpm db:studio
# Opens at http://localhost:5555
```

## 🔍 Troubleshooting

### Port already in use

```bash
# Find and kill process on port
lsof -i :3000
kill -9 <PID>
```

### Docker issues

```bash
# Reset all containers and volumes
docker compose down -v
docker compose up -d
```

### Prisma issues

```bash
# Regenerate client
pnpm db:generate

# Reset database
pnpm db:reset
```

### Mobile can't connect to API

1. Make sure API is running: `curl http://localhost:3000/health`
2. For physical device, use LAN IP instead of localhost
3. Check firewall settings
4. For Android emulator, use `10.0.2.2` instead of `localhost`

## 📚 Documentation

- [PRD.md](./PRD.md) — Product Requirements
- [ARCHITECTURE.md](./ARCHITECTURE.md) — System Architecture
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — Database Schema
- [OPENAPI.yaml](./OPENAPI.yaml) — API Specification

## 📝 License

MIT
