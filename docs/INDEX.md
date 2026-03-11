# Documentation Index

> **Netflop** — Netflix Mini cho Video Tự Sản Xuất  
> 📚 Organized documentation by topic

---

## 🚀 Start Here

| Bạn là... | Đọc file | Mục đích |
|-----------|----------|----------|
| **Mới vào team** | [README.md](../README.md) | Setup local, chạy `pnpm dev` |
| **PM / Reviewer** | [reference/PRD.md](reference/PRD.md) | Scope, features, acceptance |
| **Developer** | [architecture/OVERVIEW.md](architecture/OVERVIEW.md) | System design, tech stack |
| **Tester** | [features/STATUS.md](features/STATUS.md) | Feature checklist |

---

## 📁 Documentation Structure

```
docs/
├── INDEX.md                          # 👈 You are here
│
├── architecture/                     # System design
│   ├── OVERVIEW.md                   # C4 architecture, NestJS modules, data flow
│   ├── DATABASE.md                   # ERD, Prisma schema, enums, models
│   ├── VIDEO_PIPELINE.md             # FFmpeg HLS encoding pipeline
│   ├── UPLOAD_AND_PLAYBACK_FLOW.md   # End-to-end upload → playback
│   └── PIPELINE_IDEMPOTENCY.md       # Encode idempotency audit
│
├── features/                         # Feature tracking
│   ├── STATUS.md                     # Implementation matrix (MVP/SHOULD/COULD)
│   ├── KNOWN_GAPS.md                 # Missing features, TODOs
│   └── AUDIT_MISMATCH.md             # PRD vs Code discrepancies
│
├── testing/                          # QA & CI
│   ├── CI_GATES.md                   # CI quality gates definition
│   ├── QA_TEST_PLAN.md               # Functional test plan by module
│   ├── QA_REGRESSION.md              # Regression checklist
│   ├── QA_REPORT.md                  # Latest test report
│   ├── DIAGNOSTIC_REPORT.md          # Playback/upload troubleshooting
│   └── PATCH_PLAN.md                 # Quick-fix plans
│
├── deployment/                       # Infrastructure
│   ├── DOCKER.md                     # Local Docker (Postgres, Redis, MinIO)
│   └── STAGING.md                    # Staging deployment guide
│
├── security/                         # Security
│   └── BOLA_AUDIT.md                 # OWASP API security audit
│
├── observability/                    # Logging & monitoring
│   └── MONITORING.md                 # Request ID, JSON logs, Grafana
│
├── ai-service/                       # AI Curator
│   └── README.md                     # Python FastAPI recommendation engine
│
├── mobile/                           # Mobile app
│   └── README.md                     # Expo React Native app docs
│
├── design/                           # UI/UX design
│   ├── UI_REFERENCE.md               # Admin upload UI reference (Lovable)
│   └── LOVABLE_CONTEXT.md            # Context for AI redesign
│
└── reference/                        # Source of truth & handoffs
    ├── PRD.md                        # Product Requirements Document
    ├── HANDOFF.md                    # Latest technical handoff
    ├── HANDOFF_CODEX.md              # Previous handoff (Codex)
    └── UI_AUDIT.md                   # Web app UI/UX audit
```

---

## 🔗 Quick Links by Topic

### Authentication & Security
- PRD: [reference/PRD.md](reference/PRD.md)
- Security Audit: [security/BOLA_AUDIT.md](security/BOLA_AUDIT.md)
- API spec: [OPENAPI.yaml](../OPENAPI.yaml)
- Code: `apps/api/src/auth/`

### Video Upload & Encoding
- Architecture: [architecture/VIDEO_PIPELINE.md](architecture/VIDEO_PIPELINE.md)
- Flow: [architecture/UPLOAD_AND_PLAYBACK_FLOW.md](architecture/UPLOAD_AND_PLAYBACK_FLOW.md)
- Idempotency: [architecture/PIPELINE_IDEMPOTENCY.md](architecture/PIPELINE_IDEMPOTENCY.md)
- Code: `apps/worker/`

### Database
- Schema: [architecture/DATABASE.md](architecture/DATABASE.md)
- Prisma: `apps/api/prisma/schema.prisma`

### Mobile App
- Docs: [mobile/README.md](mobile/README.md)
- Code: `apps/mobile/`

### Admin CMS
- Code: `apps/admin/`
- Design: [design/UI_REFERENCE.md](design/UI_REFERENCE.md)

### AI Recommendations
- Docs: [ai-service/README.md](ai-service/README.md)
- Code: `apps/ai-curator/`

### Infrastructure
- Local: [deployment/DOCKER.md](deployment/DOCKER.md)
- Staging: [deployment/STAGING.md](deployment/STAGING.md)

---

## 📖 Document Types (Diátaxis Framework)

| Type | Documents | When to Use |
|------|-----------|-------------|
| **Tutorial** | `README.md` | First-time setup |
| **How-to** | `testing/`, `deployment/` | Run specific tasks |
| **Reference** | `OPENAPI.yaml`, `architecture/DATABASE.md` | Look up specs |
| **Explanation** | `reference/PRD.md`, `architecture/OVERVIEW.md` | Understand why |
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
