---
name: playwright-expert
description: Playwright E2E testing expert for browser automation, cross-browser testing, visual regression, network interception, and CI integration. Use for E2E test setup, flaky tests, or browser automation challenges.
trigger: on_request
---

# Playwright Expert

## Quick Use
- Use when: E2E setup, flaky tests, browser automation, visual regression.
- Skip when: unit/integration-only tests (use typescript-expert or nestjs-expert).
- Inputs: failing test logs, target URLs, config, CI environment details.
- Ask for: repro steps, scope, browsers/devices, CI runner.
- Focus: selectors, waits, tracing, network mocking, stability.
- Output: minimal diff + rationale + test run instructions.
- Verify: `npx playwright test` (or repo-specific script).
- Handoff: typescript-expert (unit tests), nestjs-expert (API-only), vercel-react-best-practices (React UI perf).
- Avoid: hardcoded waits; prefer assertions and auto-waiting.
- Reference: see `SKILL_REFERENCE.md` for full playbooks, examples, checklists.

## Scope
Playwright E2E testing and browser automation guidance.
