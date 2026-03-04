# Documentation Index

> **netflop** - Netflix Mini cho Video Tự Sản Xuất  
> 📚 Hướng dẫn đọc tài liệu theo đúng thứ tự

---

## 🚀 Start Here (5 phút)

| Bạn là... | Đọc file | Mục đích |
|-----------|----------|----------|
| **Mới vào team** | [README.md](../README.md) | Setup local, chạy `pnpm dev`, smoke test |
| **PM / Reviewer** | [PRD.md](./PRD.md) | Scope, features, acceptance criteria |
| **Developer** | [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, luồng data, tech stack |
| **Tester** | [feature_status.md](../feature_status.md) | Checklist tính năng, test status |

---

## 📁 Document Structure

```
netflop/
├── README.md              # 🏠 Onboarding: quickstart, scripts, links
├── OPENAPI.yaml           # 📋 API Reference (single source of truth)
├── feature_status.md      # ✅ Feature tracking matrix
│
├── docs/
│   ├── INDEX.md           # 👈 You are here
│   ├── PRD.md             # Product Requirements Document
│   ├── ARCHITECTURE.md    # System architecture (C4-lite)
│   ├── DATABASE_SCHEMA.md # ERD + Prisma schema docs
│   ├── CI_GATES.md        # CI/CD gates & automation
│   ├── DEPLOY_STAGING.md  # Deployment guide
│   ├── OBSERVABILITY.md   # Logging, monitoring
│   ├── AUDIT_MISMATCH.md  # Docs vs Code discrepancies
│   └── INCOMPLETE_INFO.md # Known gaps & TODOs
│
└── .agent/
    └── workflows/         # How-to guides (verify, smoke, etc.)
```

---

## 📖 Document Types (Diátaxis Framework)

| Type | Documents | When to Use |
|------|-----------|-------------|
| **Tutorial** (learning) | `README.md` | First-time setup |
| **How-to** (doing) | `.agent/workflows/*.md` | Run specific tasks |
| **Reference** (information) | `OPENAPI.yaml`, `DATABASE_SCHEMA.md` | Look up specs |
| **Explanation** (understanding) | `PRD.md`, `ARCHITECTURE.md` | Understand why |

---

## 🔗 Quick Links by Topic

### Authentication & Authorization
- PRD: [Section 2.2 - User Stories](./PRD.md#22-user-stories-mvp) (US-01, US-10)
- API: [`OPENAPI.yaml#/paths/~1auth`](../OPENAPI.yaml) - Auth endpoints
- Code: `apps/api/src/auth/`

### Video Upload & Encoding
- PRD: [Section 3.1 - Pipeline](./PRD.md#pipeline-hls-encode)
- Architecture: [Section 3 - E2E Flows](./ARCHITECTURE.md#3-luồng-nghiệp-vụ-end-to-end)
- Worker: `apps/worker/`
- Workflow: [video-pipeline-smoke.md](../.agent/workflows/video-pipeline-smoke.md)

### Mobile App (Viewer)
- PRD: [Section 5.1 - Mobile Screens](./PRD.md#51-mobile-screens)
- Code: `apps/mobile/`
- API Calls: See React Query hooks in `apps/mobile/src/hooks/`

### Admin CMS
- PRD: [Section 5.2 - Admin Screens](./PRD.md#52-admin-screens)
- Code: `apps/admin/`
- API: Admin endpoints in `OPENAPI.yaml` (tag: Admin)

### Database
- Schema: [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- Prisma: `apps/api/prisma/schema.prisma`
- Migrations: `apps/api/prisma/migrations/`

---

## 🏗️ Architecture Overview

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Mobile    │  │    Web      │  │   Admin     │
│ (Expo RN)   │  │  (Next.js)  │  │  (Next.js)  │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │   API (NestJS)   │
              ├─────────────────┤
              │  PostgreSQL     │
              │  Redis (Queue)  │
              │  MinIO (S3)     │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Worker (FFmpeg) │
              └─────────────────┘
```

---

## 📋 Source of Truth Hierarchy

> Khi có mâu thuẫn, ưu tiên theo thứ tự:

1. **PRD.md** - Scope, features, acceptance criteria
2. **ARCHITECTURE.md** - System design, components
3. **OPENAPI.yaml** - API contracts
4. **Code** - Implementation

---

## 🔄 CI/CD Workflows

| Command | Description | Gate |
|---------|-------------|------|
| `pnpm verify` | Lint + Typecheck + Build | P0 |
| `pnpm smoke` | Infrastructure health | P0 |
| `pnpm smoke:video` | E2E video pipeline | Optional |

See [CI_GATES.md](./CI_GATES.md) for details.

---

## ❓ FAQ

**Q: Tôi cần thêm endpoint mới, bắt đầu từ đâu?**
1. Cập nhật `OPENAPI.yaml` (design first)
2. Implement trong `apps/api/src/`
3. Cập nhật `feature_status.md`

**Q: Làm sao biết tính năng nào đã implement?**
- Xem [feature_status.md](../feature_status.md)

**Q: Tìm thấy bug/mismatch giữa docs và code?**
- Thêm vào [AUDIT_MISMATCH.md](./AUDIT_MISMATCH.md)
- Tạo issue/PR để fix

**Q: Muốn chạy demo nhanh?**
1. `pnpm infra:up`
2. `pnpm db:migrate:deploy && pnpm db:seed`
3. `pnpm dev`
4. Mở Admin: http://localhost:3001 (admin@netflop.local / admin123)

---

## 📝 Contributing to Docs

1. Giữ docs **ngắn gọn** và **chính xác**
2. Mỗi thay đổi API phải cập nhật `OPENAPI.yaml`
3. Mỗi thay đổi feature phải cập nhật `feature_status.md`
4. Dùng Mermaid cho diagrams trong markdown
