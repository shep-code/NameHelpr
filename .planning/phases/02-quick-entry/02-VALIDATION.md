---
phase: 02
slug: quick-entry
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-06
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + jsdom |
| **Config file** | vitest.config.ts (merged with vite.config.ts) |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run --coverage` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test -- --run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-00-01 | 00 | 0 | ENTR-03 | scaffold | `npm test -- tests/hooks/useDebounce.test.ts --run` | W0 creates | pending |
| 02-00-02 | 00 | 0 | ENTR-01,02,03 | scaffold | `npm test -- tests/components/AutoSaveForm.test.tsx --run` | W0 creates | pending |
| 02-00-03 | 00 | 0 | ENTR-04 | scaffold | `npm test -- tests/components/ContextAutocomplete.test.tsx --run` | W0 creates | pending |
| 02-01-01 | 01 | 1 | ENTR-03 | unit | `npm test -- tests/hooks/useDebounce.test.ts --run` | W0 | pending |
| 02-02-01 | 02 | 2 | ENTR-04 | integration | `npm test -- tests/components/ContextAutocomplete.test.tsx --run` | W0 | pending |
| 02-02-02 | 02 | 2 | ENTR-01,02,03 | integration | `npm test -- tests/components/AutoSaveForm.test.tsx --run` | W0 | pending |
| 02-02-03 | 02 | 2 | all | build | `npm run build` | N/A | pending |
| 02-03-01 | 03 | 3 | all | manual | Mobile device verification checkpoint | N/A | pending |

*Status: pending | green | red | flaky*

---

## Wave 0 Requirements

- [ ] `tests/hooks/useDebounce.test.ts` — unit tests for debounce hook (supports ENTR-03)
- [ ] `tests/components/AutoSaveForm.test.tsx` — covers ENTR-01 (single-screen layout), ENTR-02 (mobile keyboards), ENTR-03 (auto-save)
- [ ] `tests/components/ContextAutocomplete.test.tsx` — covers ENTR-04 (context suggestions)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mobile keyboard shows correct capitalization | ENTR-02 | autocapitalize only affects virtual keyboards on real mobile devices | Open on mobile, tap name field, verify keyboard capitalizes words |
| Context datalist shows suggestions | ENTR-04 | Datalist styling/behavior varies by browser | Type partial context on mobile, verify dropdown appears |
| Form fits above keyboard | ENTR-01 | Viewport behavior with keyboard requires real device | Open add form on mobile, tap field, verify no scrolling needed |
| 15-second capture time | Phase goal | Human timing test | Time from tapping "Add" to form having valid data saved |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready for execution

---

## Requirement Coverage

| Requirement | Description | Plans | Covered By |
|-------------|-------------|-------|------------|
| ENTR-01 | Single-screen layout | 00, 02, 03 | AutoSaveForm.test.tsx, mobile checkpoint |
| ENTR-02 | Mobile keyboard attributes | 00, 02, 03 | AutoSaveForm.test.tsx, mobile checkpoint |
| ENTR-03 | Auto-save with debounce | 00, 01, 02 | useDebounce.test.ts, AutoSaveForm.test.tsx |
| ENTR-04 | Context autocomplete | 00, 02, 03 | ContextAutocomplete.test.tsx, mobile checkpoint |
