---
phase: 01
slug: foundation-data
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-05
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest with jsdom environment |
| **Config file** | `vitest.config.ts` — Wave 0 creates this |
| **Quick run command** | `npm test -- --run --reporter=verbose` |
| **Full suite command** | `npm test -- --run --coverage` |
| **Estimated runtime** | ~15 seconds |

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
| 01-00-01 | 00 | 0 | - | config | `npm test -- --run --passWithNoTests` | Wave 0 creates | pending |
| 01-00-02 | 00 | 0 | - | scaffold | `npm test -- --run` | Wave 0 creates | pending |
| 01-01-01 | 01 | 1 | DATA-01 | build+smoke | `npm run build && npm test -- --run tests/pwa.test.ts` | Wave 0 scaffold | pending |
| 01-01-02 | 01 | 1 | DATA-01 | unit | `npm test -- --run tests/pwa.test.ts` | Wave 0 scaffold | pending |
| 01-02-01 | 02 | 2 | DATA-02,03,04 | build | `npm run build` | - | pending |
| 01-02-02 | 02 | 2 | DATA-02,03,04 | unit | `npm test -- --run tests/db/crud.test.ts` | Wave 0 scaffold | pending |
| 01-03-01 | 03 | 3 | DATA-01,02,03,04 | build | `npm run build` | - | pending |
| 01-03-02 | 03 | 3 | DATA-01 | integration | `npm test -- --run tests/persistence.test.ts tests/offline.test.ts` | Wave 0 scaffold | pending |
| 01-03-03 | 03 | 3 | DATA-01,02,03,04 | manual | Human verification checkpoint | - | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements (Complete)

- [x] `vitest.config.ts` — Vitest configuration with jsdom environment
- [x] `tests/setup.ts` — Test setup with fake-indexeddb
- [x] `tests/pwa.test.ts` — PWA smoke test scaffold (todos)
- [x] `tests/db/crud.test.ts` — CRUD test scaffold (todos)
- [x] `tests/persistence.test.ts` — Persistence test scaffold (todos)
- [x] `tests/offline.test.ts` — Offline test scaffold (todos)
- [x] Framework install: `npm install -D vitest fake-indexeddb @vitest/coverage-v8 jsdom`

Wave 0 (Plan 01-00) creates all test scaffolds with `.todo` markers. Subsequent plans replace todos with real tests as they implement features.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PWA installability | DATA-01 | Requires Android device interaction | Chrome DevTools > Lighthouse > PWA audit; must score 90+ |
| Offline mode | DATA-01 | Requires network manipulation | DevTools > Network > Offline; app should display cached content |
| Home screen icon | DATA-01 | Visual verification | Install PWA; verify "NHr" icon displays correctly on home screen |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all test file scaffolds
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready
