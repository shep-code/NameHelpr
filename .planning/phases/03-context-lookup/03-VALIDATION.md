---
phase: 03
slug: context-lookup
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-06
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 with jsdom environment |
| **Config file** | `vitest.config.ts` (merged with vite.config.ts) |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run --coverage` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test -- --run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-00-01 | 00 | 0 | - | config | `npm test -- --run --passWithNoTests` | Wave 0 creates | pending |
| 03-00-02 | 00 | 0 | - | scaffold | `npm test -- --run` | Wave 0 creates | pending |
| 03-01-01 | 01 | 1 | LOOK-01 | unit | `npm test -- --run tests/hooks/useSearch.test.ts` | Wave 0 scaffold | pending |
| 03-01-02 | 01 | 1 | LOOK-01 | integration | `npm test -- --run tests/views/SearchView.test.tsx` | Wave 0 scaffold | pending |
| 03-02-01 | 02 | 2 | LOOK-02,03 | unit | `npm test -- --run tests/hooks/useContexts.test.ts` | Wave 0 scaffold | pending |
| 03-02-02 | 02 | 2 | LOOK-02,03 | integration | `npm test -- --run tests/views/ContextBrowseView.test.tsx` | Wave 0 scaffold | pending |
| 03-03-01 | 03 | 3 | LOOK-04 | unit | `npm test -- --run tests/utils/groupByContext.test.ts` | Wave 0 scaffold | pending |
| 03-03-02 | 03 | 3 | LOOK-04 | integration | `npm test -- --run tests/components/GroupedResults.test.tsx` | Wave 0 scaffold | pending |
| 03-04-01 | 04 | 4 | LOOK-01,02,03,04 | manual | Human verification checkpoint | - | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `tests/hooks/useSearch.test.ts` — test scaffold for LOOK-01 (instant search, fuzzy matching)
- [ ] `tests/hooks/useContexts.test.ts` — test scaffold for LOOK-02 (distinct contexts, counts)
- [ ] `tests/views/SearchView.test.tsx` — test scaffold for search integration
- [ ] `tests/views/ContextBrowseView.test.tsx` — test scaffold for LOOK-02, LOOK-03 (browse and filter)
- [ ] `tests/components/GroupedResults.test.tsx` — test scaffold for LOOK-04 (grouped display)
- [ ] `tests/utils/groupByContext.test.ts` — test scaffold for grouping utility
- [ ] Install fuse.js dependency if not already present

Wave 0 (Plan 03-00) creates all test scaffolds with `.todo` markers. Subsequent plans replace todos with real tests as they implement features.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Search under 100ms on mobile | LOOK-01 | Performance varies by device | Open DevTools, search, verify response time in Network/Performance tab |
| Context browse tap on mobile | LOOK-03 | Touch interaction | Tap a context on mobile device, verify people list displays |
| Search results visibility with keyboard | LOOK-01 | Mobile keyboard interaction | Search on mobile, verify results visible while typing |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready
