Repo-specific rules override generic rules…
---
trigger: always_on
---

---
description: Workspace rules for netflop (Netflix mini graduation project)
---

# netflop — Workspace Rules (Always Follow)

## 0) Bối cảnh dự án
- netflop là Netflix mini cho **video tự sản xuất**.
- Scope: đồ án tốt nghiệp, ưu tiên chạy demo ổn định + kiến trúc rõ ràng.

## 1) Nguồn chân lý (Source of Truth)
Trước khi code tính năng lớn, luôn đọc và bám theo:
- PRD.md
- ARCHITECTURE.md
- DATABASE_SCHEMA.md
- OPENAPI.yaml
Nếu có mâu thuẫn, ưu tiên: PRD > Architecture > OpenAPI > Code.

## 2) Stack cố định (không tự ý thay đổi)
- Monorepo: pnpm + Turborepo
- Backend: NestJS (TypeScript) + Prisma
- DB: PostgreSQL
- Queue/Jobs: BullMQ + Redis
- Storage (dev): MinIO (S3-compatible)
- Admin Web: Next.js
- Mobile App: Expo React Native
- Worker: Node.js TypeScript (FFmpeg/HLS)

**Không** tự thêm hệ thống mới (Kafka/Elastic/DRM thương mại) trừ khi được yêu cầu.

## 3) Quy tắc làm việc (Agent Behavior)
- Luôn bắt đầu bằng: (a) Plan ngắn, (b) Task breakdown, (c) Definition of Done.
- Thực hiện theo nhịp: Plan → Implement → Verify (run commands) → Summarize changes.
- Trước khi tạo/chỉnh sửa nhiều file: liệt kê files sẽ thay đổi.
- Mọi thay đổi phải có lý do + liên hệ đến requirement trong PRD/Architecture.

## 4) Definition of Done (DoD) tối thiểu cho mọi task
- `pnpm lint` pass
- `pnpm typecheck` pass
- `pnpm dev` chạy được (API + Admin + Worker + Mobile dev server tối thiểu)
- Không hardcode secret; update `.env.example` nếu thêm env mới
- Update README nếu thay đổi scripts, ports, hoặc cách chạy local

## 5) Coding Standards (TypeScript)
- TypeScript strict; tránh `any` (chỉ dùng khi thật cần và có comment giải thích).
- Backend:
  - DTO + validation (class-validator hoặc zod; chọn 1 và nhất quán)
  - Error format thống nhất
  - Không truy cập DB trực tiếp từ controller; dùng service layer
- Naming:
  - Endpoint REST rõ ràng, số nhiều cho collection (`/movies`, `/genres`)
  - File/folder theo feature (module-based)

## 6) API & Data Contracts
- Mọi thay đổi API phải cập nhật OPENAPI.yaml tương ứng.
- Không “đoán” fields: dùng DATABASE_SCHEMA.md làm chuẩn.
- Pagination thống nhất (page/limit hoặc cursor) đúng như OpenAPI.

## 7) Security mức đồ án
- Phân quyền admin vs viewer rõ ràng (guards).
- Stream URL: “bảo vệ nhẹ” (chỉ user login mới nhận được stream ticket / signed URL).
- Upload: dùng presigned URL, validate contentType/size.

## 8) Git hygiene
- Commit message dạng: `feat(api): ...`, `fix(worker): ...`, `chore(repo): ...`
- Không commit file .env thật; chỉ commit .env.example.
