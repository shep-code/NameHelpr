# Roadmap: NameHelpr

## Overview

NameHelpr delivers a mobile-first app for remembering names by context. The journey moves from establishing local-first data storage with PWA infrastructure (Phase 1), enabling fast mobile capture of names with context (Phase 2), to providing context-based search and browsing for recall (Phase 3). Each phase builds on the previous, ensuring storage persistence is solid before entry, and entry works before lookup needs data.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Data** - Establish local-first storage with IndexedDB and PWA infrastructure
- [x] **Phase 2: Quick Entry** - Enable fast mobile capture of names with context
- [x] **Phase 3: Context Lookup** - Provide search and browse by context for name recall

## Phase Details

### Phase 1: Foundation & Data
**Goal**: User data persists reliably across sessions with offline-first capability
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04
**Success Criteria** (what must be TRUE):
  1. User data persists in IndexedDB across browser sessions and app restarts
  2. User can add, edit, and delete person records without data loss
  3. App works offline without internet connection
  4. App is installable to home screen as PWA
  5. User receives clear warning if storage permission denied (iOS Safari)
**Plans**: 4 plans

Plans:
- [x] 01-00-PLAN.md — Wave 0: Test infrastructure setup (vitest, test scaffolds)
- [x] 01-01-PLAN.md — Project scaffolding with Vite, React, TypeScript, and PWA infrastructure
- [x] 01-02-PLAN.md — IndexedDB data layer with Dexie.js for Person CRUD operations
- [x] 01-03-PLAN.md — Basic UI for add/view/edit/delete with persistence tests

### Phase 2: Quick Entry
**Goal**: User can capture name+context in under 15 seconds on mobile device
**Depends on**: Phase 1
**Requirements**: ENTR-01, ENTR-02, ENTR-03, ENTR-04
**Success Criteria** (what must be TRUE):
  1. Entry form shows name, context, and notes on single screen (no scrolling required)
  2. Mobile keyboard adapts correctly (capitalization for names, text input for context)
  3. Data saves automatically as user types (no explicit Save button needed)
  4. Context field suggests existing contexts as user types
  5. User can capture a new person in under 15 seconds on phone
**Plans**: 4 plans

Plans:
- [x] 02-00-PLAN.md — Wave 0: Test scaffolds for useDebounce, AutoSaveForm, ContextAutocomplete
- [x] 02-01-PLAN.md — useDebounce hook for auto-save timing
- [x] 02-02-PLAN.md — AutoSaveForm and ContextAutocomplete components with mobile optimization
- [x] 02-03-PLAN.md — Manual verification checkpoint on mobile device

### Phase 3: Context Lookup
**Goal**: User can find names by searching or browsing contexts they remember
**Depends on**: Phase 2
**Requirements**: LOOK-01, LOOK-02, LOOK-03, LOOK-04
**Success Criteria** (what must be TRUE):
  1. User can type context and see associated names instantly (under 100ms)
  2. User can browse a list of all contexts they've used
  3. User can tap a context to see all names from that context
  4. User can search multiple contexts and see results grouped by context
  5. Search results appear as user types with fuzzy matching for typos
**Plans**: 5 plans

Plans:
- [x] 03-00-PLAN.md — Wave 0: Install Fuse.js and create test scaffolds
- [x] 03-01-PLAN.md — Instant search with fuzzy matching (useSearch hook + SearchView)
- [x] 03-02-PLAN.md — Context browsing with counts (useContexts hook + ContextBrowseView)
- [x] 03-03-PLAN.md — Grouped search results by context (GroupedResults component)
- [x] 03-04-PLAN.md — Manual mobile device verification checkpoint

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Data | 4/4 | Complete | 2026-03-05 |
| 2. Quick Entry | 4/4 | Complete | 2026-03-06 |
| 3. Context Lookup | 5/5 | Complete | 2026-03-06 |
