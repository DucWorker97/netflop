# 🚧 Incomplete Information & Known Gaps

> **Last Updated:** 2026-01-15  
> **Purpose:** Track known gaps, missing features, and required follow-up work

---

## 1. Missing Features (Not Implemented)

### High Priority (SHOULD in PRD)

| Feature | PRD ID | Status | Impact | Suggested PR |
|---------|--------|--------|--------|--------------|
| **Forgot Password** | Implied | ❌ Missing | Users cannot recover accounts | PR-AUTH-001 |
| **Email Verification** | Security | ❌ Missing | No email validation | PR-AUTH-001 |
| **Subtitles (VTT)** | S-01 | ❌ Missing | No accessibility support | PR-MOBILE-001 |
| **Subtitle Upload** | S-04 | ❌ Missing | Admin cannot add subtitles | PR-ADMIN-001 |
| **480p Variant** | S-06 | ❌ Missing | Only 360p + 720p available | PR-WORKER-001 |

### Low Priority (COULD in PRD)

| Feature | PRD ID | Status | Notes |
|---------|--------|--------|-------|
| Auto-generate Thumbnail | C-06 | ❌ Missing | FFmpeg can extract frame |
| Push Notifications | C-07 | ❌ Missing | Expo Push possible |

---

## 2. Scope Conflicts (Code vs PRD)

| Module | Location | PRD Status | Issue | Recommended Action |
|--------|----------|------------|-------|-------------------|
| **Billing** | `apps/api/src/billing/` | **WON'T DO** | Explicitly excluded in PRD Section 3.4 | Remove or isolate |
| Subscription | Prisma schema | **WON'T DO** | Models exist but no UI | Remove or keep as stub |
| Payment | Prisma schema | **WON'T DO** | Models exist but no UI | Remove or keep as stub |

### Action Required:
```bash
# Option 1: Remove billing module entirely
rm -rf apps/api/src/billing/
# Update schema.prisma to remove Subscription, Payment models

# Option 2: Keep as isolated/disabled module
# Add comment in code: "Out of scope for MVP - disabled"
```

---

## 3. Documentation Gaps (Now Fixed)

| Gap | Status | Fix |
|-----|--------|-----|
| Missing README.md | ✅ Fixed | Created `README.md` |
| Missing feature_status.md | ✅ Fixed | Created `feature_status.md` |
| Missing docs/INDEX.md | ✅ Fixed | Created `docs/INDEX.md` |
| ARCHITECTURE.md outdated | ⚠️ Partial | Updated references |

---

## 4. API/OpenAPI Gaps

### Endpoints in Code but NOT in OpenAPI

| Endpoint | Module | OpenAPI | Action |
|----------|--------|---------|--------|
| `GET /api/rails` | `rails/` | ❌ | Add to OpenAPI |
| `GET /api/recommendations` | `recommendations/` | ❌ | Add to OpenAPI |
| `POST /api/ratings/:movieId` | `ratings/` | ❌ | Add to OpenAPI |
| `GET /api/actors` | `actors/` | ❌ | Add to OpenAPI |
| `GET /api/events` | `events/` | ❌ | Add to OpenAPI |
| `GET /health` | `health/` | ❌ | Add to OpenAPI |

### Action:
- [ ] Add missing endpoints to OPENAPI.yaml
- [ ] Or remove unused code if not needed

---

## 5. Verification Pending

| Item | Status | How to Verify |
|------|--------|---------------|
| Mobile Subtitles Display | ❌ Not implemented | N/A |
| Quality Selector UI | ⚠️ Unclear | Test on mobile |
| Profile Switching UI | ⚠️ Partial | Test on mobile |
| AI Recommendations Display | ⚠️ Partial | Test "For You" rail |

---

## 6. Security Considerations

| Issue | Risk | Status | Mitigation |
|-------|------|--------|------------|
| No rate limiting configured | Medium | ⚠️ | Add `@nestjs/throttler` |
| No email verification | Low | ❌ | Implement email flow |
| Presigned URLs public | Low | ✅ | TTL applied |
| JWT refresh token rotation | Low | ⚠️ | Consider implementing |

---

## 7. Follow-up PRs

| PR ID | Priority | Description | Dependencies |
|-------|----------|-------------|--------------|
| PR-DOC-001 | P0 | This PR - Sync docs | None |
| PR-CODE-001 | P1 | Remove/isolate billing | None |
| PR-API-001 | P2 | Add missing endpoints to OpenAPI | None |
| PR-AUTH-001 | P2 | Implement Forgot Password | None |
| PR-MOBILE-001 | P3 | Add Subtitles support | S3 VTT storage |
| PR-MOBILE-002 | P3 | Quality Selector UI | None |
| PR-WORKER-001 | P3 | Add 480p variant | None |

---

## 8. Questions for Stakeholder

1. **Billing module**: Delete entirely or keep as disabled stub?
2. **Profiles feature**: Complete implementation or defer?
3. **AI Curator**: Integrate with main app or keep separate?
4. **Email verification**: Required for MVP demo?

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-15 | Restructured document, added action items |
| 2026-01-14 | Initial gap analysis |
