# 📚 Tổng Hợp Agent Skills & Rules - Netflop Project

> **Mục đích**: Tài liệu tổng hợp toàn bộ skills và rules của AI Agent được cấu hình cho dự án Netflop.

---

## 📋 Mục Lục

1. [Rules (Quy Tắc Làm Việc)](#-rules-quy-tắc-làm-việc)
2. [Skills (Kỹ Năng Chuyên Môn)](#-skills-kỹ-năng-chuyên-môn)
3. [Workflows (Quy Trình Làm Việc)](#-workflows-quy-trình-làm-việc)

---

# 📏 Rules (Quy Tắc Làm Việc)

## 1. Agent Identity & Core Principles

**File**: `.agent/rules/01-identity.md`

Agent hoạt động như một **Full-stack Engineer** - **Professional Software Contractor**.

| # | Principle | Description |
|---|-----------|-------------|
| 1 | **Scope-bound** | Làm đúng yêu cầu, không mở rộng scope tự ý |
| 2 | **Clarify-first** | Hỏi ngay khi yêu cầu không rõ ràng |
| 3 | **Transparent** | Giải thích mọi quyết định kỹ thuật |
| 4 | **Maintainable** | Đảm bảo code dễ bảo trì lâu dài |
| 5 | **Quality-over-speed** | Ưu tiên chất lượng hơn tốc độ |

---

## 2. Task Classification

**File**: `.agent/rules/02-task-classification.md`

Phân loại request thành 4 types:

| Symbol | Type | Description | Keywords |
|:------:|:-----|:------------|:---------|
| 🔍 | **CONSULT** | Hỏi ý kiến, so sánh, đề xuất | "should", "suggest", "compare", "opinion" |
| 🏗️ | **BUILD** | Tạo feature, component mới | "create", "make", "build", "implement" |
| 🔧 | **DEBUG** | Sửa bug, lỗi | "error", "bug", "not working", "fix" |
| ⚡ | **OPTIMIZE** | Cải thiện, refactor | "slow", "refactor", "improve", "optimize" |

**Thứ tự xử lý task phức tạp**: Consult → Build/Debug → Optimize

---

## 3. Mode: Consulting (🔍)

**File**: `.agent/rules/03-mode-consulting.md`

**Goal**: Giúp user ra quyết định TRƯỚC KHI code.

**Process**:
1. Làm rõ context & constraints
2. Đề xuất 2-3 options với trade-offs
3. Recommend option tối ưu với lý do
4. CHỜ xác nhận trước khi implement

**Output Format**:
```markdown
## 🔍 CONSULTING
**Understanding:** [summary]
**Constraints:** Tech stack, timeline, resources...

### Option A: [Name]
| Pros | Cons |
|------|------|
| ✅ ... | ⚠️ ... |

## ✅ Recommendation: Option [X]
⏭️ **Confirm to proceed?**
```

---

## 4. Mode: Build (🏗️)

**File**: `.agent/rules/04-mode-build.md`

**Goal**: Tạo code mới đạt chuẩn và dễ bảo trì.

**Process**:
1. Xác nhận scope & Acceptance Criteria
2. Đề xuất cấu trúc file/component
3. Code theo thứ tự: **Types → Logic/Hooks → UI → Styles**
4. Chạy checklist trước khi delivery
5. Giải thích logic phức tạp

**Principles**:
- ❌ Không thêm feature ngoài scope
- ❌ Không dùng `any` type
- ✅ Dùng constants/config thay vì hardcode
- ✅ Handle errors và edge cases

---

## 5. Mode: Debug (🔧)

**File**: `.agent/rules/05-mode-debug.md`

**Goal**: Tìm đúng nguyên nhân, sửa đúng chỗ, ngăn tái phát.

**Process**:
1. Thu thập thông tin (5W1H)
2. Reproduce bug
3. Phân tích root cause
4. Đề xuất fix + giải thích
5. Đề xuất biện pháp phòng ngừa

**Output Format**:
```markdown
## 🔧 DEBUG
**Symptom:** [error description]

### Analysis:
**Root Cause:** [root cause]
**Location:** `[file:line]`

### Fix:
```diff
- [old code]
+ [new code]
```

### Prevention:
| Suggestion | Priority |
|------------|----------|
| [Add validation] | 🔴 High |
```

---

## 6. Mode: Optimize (⚡)

**File**: `.agent/rules/06-mode-optimize.md`

**Goal**: Cải thiện chất lượng **MÀ KHÔNG thay đổi behavior**.

**Process**:
1. Đo baseline hiện tại
2. Xác định bottleneck chính
3. Đề xuất cải thiện + dự đoán kết quả
4. Refactor theo priority
5. So sánh before/after
6. Đảm bảo tests vẫn pass

**Evaluation Criteria**:
| Criterion | Tool | Good Threshold |
|-----------|------|----------------|
| Bundle size | `npm run build` | < 500KB |
| Render time | React DevTools | < 16ms |
| Complexity | ESLint | Cyclomatic < 10 |

---

## 7. Communication Style

**File**: `.agent/rules/08-communication.md`

| Principle | Description |
|-----------|-------------|
| **Clear** | Ngôn ngữ rõ ràng, tránh jargon |
| **Concise** | Đi thẳng vào vấn đề |
| **Structured** | Dùng headers, lists, tables |
| **Actionable** | Hướng dẫn cụ thể có thể thực hiện |

**Format**: Markdown, code blocks với syntax highlighting, tables, Mermaid diagrams, diff blocks.

---

## 8. Pre-Delivery Checklist

**File**: `.agent/rules/09-checklist.md`

### Code Quality
- [ ] No `any` type
- [ ] No hardcoded magic numbers/strings
- [ ] Complete error handling
- [ ] Clear variable/function naming
- [ ] No duplicate code

### Structure
- [ ] Correct folder structure
- [ ] Correct naming convention
- [ ] < 200 lines/file (recommended)
- [ ] Single Responsibility Principle

### UI/UX (if applicable)
- [ ] Follows Design System
- [ ] Responsive (mobile-first)
- [ ] Loading, Error, Empty states
- [ ] Accessibility (a11y)

### Performance
- [ ] No unnecessary re-renders
- [ ] Lazy loading for heavy components
- [ ] Optimized images
- [ ] No memory leaks

---

## 9. Netflop Workspace Rules (🌟 Quan trọng nhất)

**File**: `.agent/rules/netflop.md`

### 0) Bối cảnh dự án
- netflop là Netflix mini cho **video tự sản xuất**
- Scope: đồ án tốt nghiệp, ưu tiên demo ổn định + kiến trúc rõ ràng

### 1) Nguồn chân lý (Source of Truth)
Trước khi code tính năng lớn, luôn đọc và bám theo:
- PRD.md
- ARCHITECTURE.md
- DATABASE_SCHEMA.md
- OPENAPI.yaml

**Ưu tiên**: PRD > Architecture > OpenAPI > Code

### 2) Stack cố định
- **Monorepo**: pnpm + Turborepo
- **Backend**: NestJS (TypeScript) + Prisma
- **DB**: PostgreSQL
- **Queue/Jobs**: BullMQ + Redis
- **Storage (dev)**: MinIO (S3-compatible)
- **Admin Web**: Next.js
- **Mobile App**: Expo React Native
- **Worker**: Node.js TypeScript (FFmpeg/HLS)

**Không** tự thêm hệ thống mới (Kafka/Elastic/DRM) trừ khi được yêu cầu.

### 3) Quy tắc làm việc
- Luôn bắt đầu bằng: (a) Plan ngắn, (b) Task breakdown, (c) Definition of Done
- Thực hiện theo nhịp: **Plan → Implement → Verify → Summarize**
- Trước khi tạo/chỉnh sửa nhiều file: liệt kê files sẽ thay đổi

### 4) Definition of Done (DoD)
- `pnpm lint` pass
- `pnpm typecheck` pass
- `pnpm dev` chạy được
- Không hardcode secret; update `.env.example` nếu thêm env mới
- Update README nếu thay đổi scripts, ports

### 5) Coding Standards
- TypeScript strict; tránh `any`
- DTO + validation (class-validator hoặc zod)
- Error format thống nhất
- Không truy cập DB trực tiếp từ controller; dùng service layer
- Endpoint REST rõ ràng, số nhiều cho collection

### 6) API & Data Contracts
- Mọi thay đổi API phải cập nhật OPENAPI.yaml
- Không "đoán" fields: dùng DATABASE_SCHEMA.md làm chuẩn
- Pagination thống nhất

### 7) Security
- Phân quyền admin vs viewer rõ ràng (guards)
- Stream URL: chỉ user login mới nhận được signed URL
- Upload: dùng presigned URL, validate contentType/size

### 8) Git hygiene
- Commit message: `feat(api): ...`, `fix(worker): ...`, `chore(repo): ...`
- Không commit file .env thật; chỉ commit .env.example

### 9) Video Pipeline Rules
1. **Canonical API Contract**: Không để lệch endpoint giữa docs ↔ OpenAPI ↔ code
2. **Presigned Upload**: Content-Type phải khớp, CORS đúng cho bucket
3. **HLS Playback**: Khi bucket private, phải sign tất cả playlists + segments
4. **E2E Gate**: PR đụng Upload/Encode/Playback phải chạy `pnpm -w verify` + `pnpm -w smoke`
5. **Authorization theo object (BOLA)**: Kiểm tra quyền ở cấp object

---

# 🛠 Skills (Kỹ Năng Chuyên Môn)

## 1. Auth Expert

**File**: `.agent/skills/auth-expert/SKILL.md`

**Description**: Authentication and authorization expert - JWT, OAuth 2.0, session management, RBAC, password security.

### Key Patterns

**Secure JWT Pattern**:
```typescript
const ACCESS_TOKEN_EXPIRY = '15m';
function generateTokens(payload: TokenPayload) {
  const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
  return { accessToken };
}
```

**Password Security**:
```typescript
const SALT_ROUNDS = 12;
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}
```

### Code Review Checklist
- [ ] Passwords hashed with bcrypt (cost ≥ 12)
- [ ] JWT secrets are strong (256-bit)
- [ ] Cookies are httpOnly, secure, sameSite
- [ ] Rate limiting on login
- [ ] All routes have auth middleware
- [ ] Resource-level authorization

### Anti-Patterns
- ❌ Storing JWT in localStorage → Use httpOnly cookies
- ❌ Weak passwords → Enforce complexity
- ❌ No rate limiting → Prevent brute force
- ❌ Client-side auth only → Always validate on server

---

## 2. Docker Expert

**File**: `.agent/skills/docker-expert/SKILL.md`

**Description**: Docker containerization expert - multi-stage builds, image optimization, container security, Docker Compose orchestration.

### Core Expertise
1. **Dockerfile Optimization & Multi-Stage Builds**
2. **Container Security Hardening**
3. **Docker Compose Orchestration**
4. **Image Size Optimization**
5. **Development Workflow Integration**
6. **Performance & Resource Management**

### Optimized Multi-Stage Pattern
```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS build
WORKDIR /app
COPY . .
RUN npm run build && npm prune --production

FROM node:18-alpine AS runtime
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s CMD curl -f http://localhost:3000/health || exit 1
CMD ["node", "dist/index.js"]
```

### Code Review Checklist
- [ ] Non-root user created with specific UID/GID
- [ ] Secrets managed properly (not in ENV vars or layers)
- [ ] Health checks implemented
- [ ] Resource limits defined

---

## 3. GitHub Actions Expert

**File**: `.agent/skills/github-actions-expert/SKILL.md`

**Description**: CI/CD pipeline optimization, workflow automation, custom actions, security best practices.

### Core Areas
- Workflow Configuration & Syntax
- Job Orchestration & Dependencies
- Actions & Marketplace Integration
- Security & Secrets Management
- Performance & Optimization
- Custom Actions Development

### Advanced Patterns
- Reusable Workflow Templates
- Dynamic Matrix Generation
- Multi-Environment Deployment
- Path-based Conditional Execution

### Code Review Checklist
- [ ] Actions pinned to specific SHA commits
- [ ] Minimal required permissions defined
- [ ] OIDC authentication used where possible
- [ ] Cache strategies implemented
- [ ] Timeout values set

---

## 4. NestJS Expert

**File**: `.agent/skills/nestjs-expert/SKILL.md`

**Description**: Module architecture, dependency injection, middleware, guards, interceptors, testing with Jest/Supertest, TypeORM/Prisma integration.

### Domain Coverage
1. Module Architecture & Dependency Injection
2. Controllers & Request Handling
3. Middleware, Guards, Interceptors & Pipes
4. Testing Strategies (Jest & Supertest)
5. Database Integration (TypeORM & Mongoose)
6. Authentication & Authorization (Passport.js)
7. Configuration & Environment Management
8. Error Handling & Logging

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Nest can't resolve dependencies" | Check providers array, verify exports |
| "Circular dependency detected" | Use forwardRef() or extract to third module |
| "Unknown authentication strategy 'jwt'" | Import from 'passport-jwt' NOT 'passport-local' |
| "secretOrPrivateKey must have value" | Set JWT_SECRET in env, check ConfigModule order |

### Decision Trees

**Choosing Database ORM**:
- Need migrations? → TypeORM or Prisma
- NoSQL database? → Mongoose
- Type safety priority? → Prisma
- Complex relations? → TypeORM

**Module Organization**:
- Simple CRUD → Single module
- Domain logic → Separate domain + infrastructure modules
- Shared logic → Create shared module with exports

---

## 5. Playwright Expert

**File**: `.agent/skills/playwright-expert/SKILL.md`

**Description**: E2E testing, browser automation, cross-browser testing, visual regression, network interception.

### Key Features
- Project Setup & Configuration
- Page Object Model Pattern
- Network Interception & Mocking
- Visual Regression Testing
- Handling Flaky Tests

### Basic Configuration
```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});
```

### Code Review Checklist
- [ ] data-testid attributes for selectors
- [ ] Page Object Model for complex flows
- [ ] Network requests mocked where needed
- [ ] Proper wait strategies (no arbitrary waits)

### Anti-Patterns
- ❌ Hardcoded waits → Use proper assertions
- ❌ Fragile selectors → Use data-testid
- ❌ Shared state between tests → Isolate tests
- ❌ No retries in CI → Add retry for flakiness

---

## 6. PostgreSQL Expert

**File**: `.agent/skills/postgres-expert/SKILL.md`

**Description**: Query optimization, JSONB operations, advanced indexing, partitioning, connection management, replication.

### Problem Categories
1. Query Performance & EXPLAIN Analysis
2. JSONB Operations & Indexing
3. Advanced Indexing Strategies
4. Table Partitioning & Large Data
5. Connection Management & PgBouncer
6. Autovacuum Tuning
7. Replication & High Availability

### Index Types
| Type | Use Case |
|------|----------|
| B-tree | Equality, ranges, sorting |
| GIN | JSONB, arrays, full-text search |
| GiST | Geometric, ranges, hierarchical |
| BRIN | Large sequential tables, time-series |
| Hash | Equality only |

### Memory Configuration (16GB RAM server)
```sql
shared_buffers = '4GB'          -- 25% of RAM
effective_cache_size = '12GB'   -- 75% of RAM
work_mem = '256MB'              -- Per sort/hash operation
maintenance_work_mem = '1GB'    -- VACUUM, CREATE INDEX
```

---

## 7. Prisma Expert

**File**: `.agent/skills/prisma-expert/SKILL.md`

**Description**: Schema design, migrations, query optimization, relations modeling, database operations.

### Problem Playbooks
1. **Schema Design**: Relation definitions, indexes, enums
2. **Migrations**: Conflict resolution, production deployment
3. **Query Optimization**: N+1 problems, select/include
4. **Connection Management**: Pool configuration, serverless
5. **Transaction Patterns**: Interactive transactions, optimistic locking

### Best Practices
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  posts     Post[]   @relation("UserPosts")
  
  @@index([email])
  @@map("users")
}
```

### Query Optimization
```typescript
// BAD: N+1 problem
const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({ where: { authorId: user.id } });
}

// GOOD: Include relations
const users = await prisma.user.findMany({
  include: { posts: true }
});

// BETTER: Select only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    posts: { select: { id: true, title: true } }
  }
});
```

### Code Review Checklist
- [ ] All models have appropriate @id
- [ ] Relations use explicit @relation
- [ ] Cascade behaviors defined
- [ ] Indexes for frequently queried fields
- [ ] No N+1 queries

---

## 8. TypeScript Expert

**File**: `.agent/skills/typescript-expert/SKILL.md`

**Description**: Type-level programming, performance optimization, monorepo management, migration strategies.

### Advanced Patterns

**Branded Types**:
```typescript
type Brand<K, T> = K & { __brand: T };
type UserId = Brand<string, 'UserId'>;
type OrderId = Brand<string, 'OrderId'>;
```

**Strict Configuration**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Common Error Solutions

| Error | Fix |
|-------|-----|
| "Type cannot be named" | Export type explicitly or use ReturnType |
| "Excessive stack depth" | Limit recursion, use interface extends |
| "Cannot find module" | Check moduleResolution, paths alignment |

### Tool Selection
- Type checking only? → **tsc**
- Speed critical? → **Biome**
- Comprehensive linting? → **ESLint + typescript-eslint**
- Build tool (< 10 packages)? → **Turborepo**
- Build tool (> 50 packages)? → **Nx**

---

## 9. Vercel React Best Practices

**File**: `.agent/skills/vercel-react-best-practices/SKILL.md`

**Description**: React and Next.js performance optimization from Vercel Engineering. 45 rules across 8 categories.

### Rule Categories by Priority

| Priority | Category | Impact |
|----------|----------|--------|
| 1 | Eliminating Waterfalls | CRITICAL |
| 2 | Bundle Size Optimization | CRITICAL |
| 3 | Server-Side Performance | HIGH |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH |
| 5 | Re-render Optimization | MEDIUM |
| 6 | Rendering Performance | MEDIUM |
| 7 | JavaScript Performance | LOW-MEDIUM |
| 8 | Advanced Patterns | LOW |

### Key Rules
- `async-parallel` - Use Promise.all() for independent operations
- `bundle-barrel-imports` - Import directly, avoid barrel files
- `bundle-dynamic-imports` - Use next/dynamic for heavy components
- `rerender-memo` - Extract expensive work into memoized components
- `rendering-content-visibility` - Use content-visibility for long lists

---

## 10. Web Interface Guidelines

**File**: `.agent/skills/web-interface-guidelines/SKILL.md`

**Description**: Review UI code for Vercel Web Interface Guidelines compliance.

### Key Rules

**Accessibility**:
- Icon-only buttons need `aria-label`
- Form controls need `<label>` or `aria-label`
- Use semantic HTML before ARIA

**Focus States**:
- Interactive elements need visible focus
- Never `outline-none` without focus replacement

**Forms**:
- Inputs need `autocomplete` and meaningful `name`
- Never block paste
- Submit button stays enabled until request starts

**Animation**:
- Honor `prefers-reduced-motion`
- Animate `transform`/`opacity` only
- Never `transition: all`

**Performance**:
- Large lists (> 50 items): virtualize
- No layout reads in render
- Add `<link rel="preconnect">` for CDN domains

### Anti-Patterns to Flag
- `user-scalable=no` disabling zoom
- `transition: all`
- `outline-none` without replacement
- `<div>` with click handlers (use `<button>`)
- Images without dimensions
- Form inputs without labels

---

# 🔄 Workflows (Quy Trình Làm Việc)

## 1. /verify - Quality Gate

**File**: `.agent/workflows/verify.md`

Runs lint, typecheck, and build checks.

```bash
pnpm -w verify
# Or manually:
pnpm lint
pnpm typecheck
pnpm build
```

**Pass Criteria**:
- ✅ `pnpm lint` succeeds
- ✅ `pnpm typecheck` succeeds
- ✅ `pnpm build` succeeds

---

## 2. /smoke - Infrastructure Health Gate

**File**: `.agent/workflows/smoke.md`

Verifies infrastructure services are healthy.

```bash
pnpm infra:up
pnpm -w smoke
```

**Pass Criteria**:
- ✅ Docker services healthy: postgres, redis, minio
- ✅ API health endpoint returns HTTP 200

---

## 3. /code - Start Coding Existing Plan

**File**: `.agent/workflows/code.md`

Workflow để implement một plan đã có sẵn.

**Steps**:
1. Project setup
2. Plan Detection & Phase Selection
3. Analysis & Task Extraction
4. Implementation
5. Testing
6. User Approval

---

## 4. /cook - Implement Feature Step by Step

**File**: `.agent/workflows/cook.md`

Workflow đầy đủ từ research đến implementation.

**Steps**:
1. Project setup
2. Clarify requirements
3. Research
4. Plan creation
5. Task extraction
6. Implementation by phase
7. Testing by phase
8. User approval

**Principles**: YAGNI, KISS, DRY

---

## 5. /request - Request Handler

**File**: `.agent/workflows/request.md`

Full-stack engineer workflow xử lý request.

**Process**:
1. Classify task (CONSULT/BUILD/DEBUG/OPTIMIZE)
2. Execute based on mode
3. Pre-delivery checklist

---

## Danh Sách Tất Cả Workflows

| Command | Description |
|---------|-------------|
| `/code` | ⚡⚡⚡ Start coding & testing an existing plan |
| `/cook` | ⚡⚡⚡ Implement a feature step by step |
| `/perf-audit` | Performance audit for web/admin apps |
| `/request` | Full-Stack Engineer Agent |
| `/smoke` | Quick smoke checks for local services |
| `/ui-audit` | UI/UX audit workflow |
| `/ui-ux-pro-max` | Plan and implement UI |
| `/verify` | Quality gates (lint, typecheck, build) |

---

# 📁 Cấu Trúc Thư Mục Agent

```
.agent/
├── rules/              # Quy tắc làm việc
│   ├── 01-identity.md
│   ├── 02-task-classification.md
│   ├── 03-mode-consulting.md
│   ├── 04-mode-build.md
│   ├── 05-mode-debug.md
│   ├── 06-mode-optimize.md
│   ├── 08-communication.md
│   ├── 09-checklist.md
│   └── netflop.md      # 🌟 Workspace-specific rules
│
├── skills/             # Kỹ năng chuyên môn
│   ├── auth-expert/
│   ├── docker-expert/
│   ├── github-actions-expert/
│   ├── nestjs-expert/
│   ├── playwright-expert/
│   ├── postgres-expert/
│   ├── prisma-expert/
│   ├── typescript-expert/
│   ├── vercel-react-best-practices/
│   ├── web-design-guidelines/
│   └── web-interface-guidelines/
│
└── workflows/          # Quy trình làm việc
    ├── code.md
    ├── cook.md
    ├── request.md
    ├── smoke.md
    ├── verify.md
    └── ...
```

---

# 📝 Ghi Chú Quan Trọng

1. **Luôn tuân thủ netflop.md** - File này chứa rules đặc thù cho dự án Netflop
2. **Source of Truth**: PRD > Architecture > OpenAPI > Code
3. **Definition of Done**: Luôn chạy `pnpm lint`, `pnpm typecheck` trước khi commit
4. **Video Pipeline**: Đặc biệt chú ý đồng bộ giữa docs, OpenAPI và code
5. **Stack cố định**: Không tự ý thêm công nghệ mới

---

*Generated: 2026-01-18*
