# Feature Status Matrix

> **Last Updated:** 2026-01-15  
> **Purpose:** Single source of truth for feature implementation status  
> **Legend:** ✅ Done | ⚠️ Partial | ❌ Not Done | ➖ N/A

---

## MVP Features (MUST)

### Viewer - Mobile App

| ID | Feature | PRD | API | Mobile | Web | Admin | Tested | Notes |
|----|---------|-----|-----|--------|-----|-------|--------|-------|
| M-V01 | Login / Register | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | JWT auth working |
| M-V02 | Home - Hero Banner | ✅ | ✅ | ✅ | ✅ | ➖ | ✅ | |
| M-V03 | Home - Genre Rails | ✅ | ✅ | ✅ | ✅ | ➖ | ✅ | Rails config in DB |
| M-V04 | Search | ✅ | ✅ | ✅ | ✅ | ➖ | ✅ | Keyword search |
| M-V05 | Movie Detail | ✅ | ✅ | ✅ | ✅ | ➖ | ✅ | |
| M-V06 | HLS Player | ✅ | ✅ | ✅ | ✅ | ➖ | ✅ | expo-video |
| M-V07 | Watch History & Resume | ✅ | ✅ | ✅ | ⚠️ | ➖ | ✅ | |
| M-V08 | Continue Watching Rail | ✅ | ✅ | ✅ | ⚠️ | ➖ | ✅ | |
| M-V09 | My List / Favorites | ✅ | ✅ | ✅ | ⚠️ | ➖ | ✅ | |
| M-V10 | Loading/Empty/Error States | ✅ | ➖ | ✅ | ✅ | ✅ | ✅ | |

### Admin - CMS

| ID | Feature | PRD | API | Admin | Tested | Notes |
|----|---------|-----|-----|-------|--------|-------|
| M-A01 | Admin Login | ✅ | ✅ | ✅ | ✅ | Role check |
| M-A02 | Movie List | ✅ | ✅ | ✅ | ✅ | Pagination |
| M-A03 | Create/Edit Movie | ✅ | ✅ | ✅ | ✅ | |
| M-A04 | Upload Thumbnail | ✅ | ✅ | ✅ | ✅ | Presigned URL |
| M-A05 | Upload Video (MP4) | ✅ | ✅ | ✅ | ✅ | Progress bar |
| M-A06 | Encode Status | ✅ | ✅ | ✅ | ✅ | Polling |
| M-A07 | Publish/Unpublish | ✅ | ✅ | ✅ | ✅ | |

### Backend API

| ID | Feature | PRD | Implemented | OpenAPI | Tested | Notes |
|----|---------|-----|-------------|---------|--------|-------|
| M-B01 | Auth - Register/Login/Refresh/Me | ✅ | ✅ | ✅ | ✅ | |
| M-B02 | Movies - List/Search/Detail | ✅ | ✅ | ✅ | ✅ | |
| M-B03 | Genres - List | ✅ | ✅ | ✅ | ✅ | |
| M-B04 | Favorites - CRUD | ✅ | ✅ | ✅ | ✅ | |
| M-B05 | Watch History - Upsert/List | ✅ | ✅ | ✅ | ✅ | |
| M-B06 | Admin - Movie CRUD | ✅ | ✅ | ✅ | ✅ | |
| M-B07 | Upload - Presigned URL | ✅ | ✅ | ✅ | ✅ | |
| M-B08 | Upload - Complete callback | ✅ | ✅ | ✅ | ✅ | Triggers encode |
| M-B09 | Stream URL | ✅ | ✅ | ✅ | ✅ | Signed URL |

### Pipeline (HLS Encode)

| ID | Feature | PRD | Implemented | Tested | Notes |
|----|---------|-----|-------------|--------|-------|
| M-P01 | Job Queue | ✅ | ✅ | ✅ | BullMQ |
| M-P02 | FFmpeg Encode | ✅ | ✅ | ✅ | 360p + 720p |
| M-P03 | Output Storage | ✅ | ✅ | ✅ | MinIO |
| M-P04 | Callback API | ✅ | ✅ | ✅ | Status update |

---

## SHOULD Features (Nice-to-have)

| ID | Feature | PRD | Implemented | Notes |
|----|---------|-----|-------------|-------|
| S-01 | Subtitles (VTT) | SHOULD | ❌ | Not implemented |
| S-02 | Quality Selector | SHOULD | ⚠️ | HLS variants exist, UI partial |
| S-03 | Pull-to-refresh Home | SHOULD | ✅ | Mobile |
| S-04 | Subtitle Upload | SHOULD | ❌ | Not implemented |
| S-05 | Stream Signed URL TTL | SHOULD | ✅ | 1h TTL |
| S-06 | 480p variant | SHOULD | ❌ | Only 360p + 720p |

---

## COULD Features (Bonus)

| ID | Feature | PRD | Implemented | Notes |
|----|---------|-----|-------------|-------|
| C-01 | Multiple Profiles | COULD | ⚠️ | DB model exists, UI not complete |
| C-02 | Simple Recommendations | COULD | ⚠️ | `ai-curator` exists, integration partial |
| C-03 | Rate Movies | COULD | ⚠️ | API exists, not in OpenAPI |
| C-04 | Dashboard Analytics | COULD | ⚠️ | `PlayEvent` exists, no UI |
| C-05 | Reorder Home Rails | COULD | ⚠️ | `RailConfig` exists |
| C-06 | Auto-generate Thumbnail | COULD | ❌ | Not implemented |
| C-07 | Push Notifications | COULD | ❌ | Not implemented |

---

## Out of Scope (WON'T DO) - But Found in Code

| Feature | PRD Status | Code Location | Action Required |
|---------|------------|---------------|-----------------|
| **Billing/Subscription** | WON'T DO | `apps/api/src/billing/` | ⚠️ Remove or isolate |
| DRM | WON'T DO | ❌ Not in code | OK |
| Live Streaming | WON'T DO | ❌ Not in code | OK |
| Offline Download | WON'T DO | ❌ Not in code | OK |
| Multi-tenant | WON'T DO | ❌ Not in code | OK |
| Social Login | WON'T DO | ❌ Not in code | OK |

---

## Missing from PRD but Implemented

| Feature | Code Location | OpenAPI | Recommendation |
|---------|--------------|---------|----------------|
| Rails API | `apps/api/src/rails/` | ❌ | Add to OpenAPI or document |
| Recommendations API | `apps/api/src/recommendations/` | ❌ | Add to OpenAPI or document |
| Ratings API | `apps/api/src/ratings/` | ❌ | Add to OpenAPI or document |
| Actors | `apps/api/src/actors/` | ❌ | Add to OpenAPI or document |
| Events (Analytics) | `apps/api/src/events/` | ❌ | Add to OpenAPI or document |
| Health Check | `apps/api/src/health/` | ❌ | Add to OpenAPI |

---

## Action Items (Follow-up PRs)

| Priority | PR | Description | Status |
|----------|-----|-------------|--------|
| P0 | PR-DOC-001 | Sync docs, create INDEX.md | 🔄 In Progress |
| P1 | PR-CODE-001 | Remove/isolate billing module | ⏳ TODO |
| P2 | PR-API-001 | Add missing endpoints to OpenAPI | ⏳ TODO |
| P2 | PR-AUTH-001 | Implement Forgot Password | ⏳ TODO |
| P3 | PR-MOBILE-001 | Add Subtitles support | ⏳ TODO |
| P3 | PR-MOBILE-002 | Add Quality Selector UI | ⏳ TODO |

---

## Verification Checklist

- [x] CI gates pass (verify + smoke)
- [x] API health check returns 200
- [x] Admin can login and CRUD movies
- [x] Video upload triggers encode
- [x] Encode completes successfully
- [x] Viewer can play HLS video
- [x] Watch progress saves and resumes
- [x] Favorites add/remove works
- [ ] Subtitles display (not implemented)
- [ ] Quality selector works (partial)
