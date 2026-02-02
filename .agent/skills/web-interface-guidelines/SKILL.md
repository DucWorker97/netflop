---
name: web-interface-guidelines
description: Review UI code for Web Interface Guidelines compliance.
argument-hint: <file-or-pattern>
trigger: on_request
---

# Web Interface Guidelines

## Quick Use
- Use when: UI/UX review, accessibility audit, design best-practice checks.
- Inputs: file or glob pattern (ask if missing).
- Scope: only specified files; avoid whole repo unless asked.
- Process: read files, check against rules, report issues.
- Output: terse, high signal; group by file; file:line format.
- Prioritize: a11y P0, UX P1, performance UX.
- Include: issue + fix suggestion if non-obvious.
- Skip: long explanations or preamble.
- Reference: see `SKILL_REFERENCE.md` for full rules and output format.

## Notes
Review these files for compliance: `$ARGUMENTS`.
Output concise but comprehensive—sacrifice grammar for brevity. High signal-to-noise.
