# 📅 UI/UX Completion Plan - Netflop Web

## MILESTONES

### Phase 1: Global Shell & Consistency (Step 1 & 2)
- [ ] **Global Navbar:** Extract `Navbar` to `components/shared/Navbar.tsx`.
- [ ] **Global Footer:** Create `components/shared/Footer.tsx`.
- [ ] **Root Layout:** Update `app/layout.tsx` to implement the shell.
- [ ] **Design Tokens:** Create `app/globals.css` variables for colors/spacing if missing.
- [ ] **Componentization:**
    - Extract `MovieCard` to `components/shared/MovieCard.tsx`.
    - Extract `HeroBanner` from Home to `components/features/HeroBanner.tsx`.

### Phase 2: Core Screens Polish (Step 3)
- [ ] **Home:** Use new components, fix spacing.
- [ ] **Detail:** Add "Similar Movies" rail, fix responsive layout.
- [ ] **Catalog:** Add Pagination/Infinite Scroll, grid responsiveness.
- [ ] **Search:** Improve search bar UI & results grid.
- [ ] **Auth:** Polish Login page.

### Phase 3: Quality Assurance (Step 4 & 5)
- [ ] **Responsive Check:** Verify 360px, 768px, 1024px.
- [ ] **Accessibility:** Alt text, keyboard nav, focus states.
- [ ] **Production Verify:** Build check.

## RISKS
- **Data Dependency:** "Similar Movies" might need API changes. *Mitigation: Use mock data if API missing.*
- **Layout Shift:** Extracting inline styles to CSS modules might cause temporary regression. *Mitigation: Verify with screenshots.*

## TERMINAL COMMANDS
- `turbo run dev --filter @netflop/web` (Running)
