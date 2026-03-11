# QA Regression Checklist

## Pre-Flight
- [ ] Docker Desktop running?
- [ ] `docker-compose up -d` executed?
- [ ] Backend running on port 3000? (`curl http://localhost:3000/health`)
- [ ] Database seeded? (`npx pnpm db:seed`)
- [ ] Frontend running on port 3002?

## Smoke Tests (Top Priority)
- [x] **Home Load**: Open `/`. Hero Banner image & Text loaded? ✅
- [ ] **Navigation**: Click "Movies" (Genre) -> Grid loads?
- [x] **Detail**: Click any movie card -> Detail page loads (after login)? ✅
- [x] **Playback**: Click "Play" -> Video player opens & starts? ✅

## User Flows
- [x] **Login**: `/login` -> Enter creds -> Redirect to Home? ✅
- [ ] **Add Favorite**: Click Heart icon -> Icon turns red?
- [ ] **Remove Favorite**: Click again -> Icon white?
- [ ] **History**: Watch video 10s -> Appears in "Continue Watching"?

## Search Tests
- [ ] **Search Input**: Type query -> Results appear?
- [ ] **Debounce**: Network request fires after 300ms pause?
- [ ] **Empty State**: Search "zzzzz" -> Shows "No results"?
- [ ] **Result Click**: Click result -> Navigates to Detail?

## Responsive
- [ ] **Mobile (375px)**: Navbar collapses/hides? Grid becomes 1-2 columns?
- [ ] **Desktop (1440px)**: Grid expands to 5-6 columns?

## Known Issues
- [x] BUG-001: Detail shows 404 for guests - **LOGGED**
- [x] BUG-002: Movie description missing - **LOGGED**
- [x] BUG-003: Seed data title issue - **LOGGED**
- [x] BUG-004: API crashes when Docker down - **LOGGED**
