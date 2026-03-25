# Requirements: NameHelpr

**Defined:** 2026-03-05
**Core Value:** Look up someone's name when you remember the context you met them

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Data & Storage

- [x] **DATA-01**: User data persists in IndexedDB across sessions
- [x] **DATA-02**: User can add a new person with name, context, and optional notes
- [x] **DATA-03**: User can edit an existing person's details
- [x] **DATA-04**: User can delete a person

### Entry

- [x] **ENTR-01**: Entry form is single-screen (name + context + notes visible together)
- [x] **ENTR-02**: Form uses proper mobile keyboards (autocapitalize for names, text for context)
- [x] **ENTR-03**: Data auto-saves as user types (no explicit Save button)
- [x] **ENTR-04**: Context field suggests from existing contexts as user types

### Lookup

- [x] **LOOK-01**: User can search by typing context to find associated names
- [x] **LOOK-02**: User can browse a list of all contexts
- [x] **LOOK-03**: User can tap a context to see all names from that context
- [x] **LOOK-04**: User can search multiple contexts and see results grouped by context

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Quiz

- **QUIZ-01**: User can quiz themselves: shown context, recall names
- **QUIZ-02**: User can quiz themselves: shown name, recall context
- **QUIZ-03**: User can mark names as "learned" when confident
- **QUIZ-04**: User can filter quiz to unlearned names only

### PWA

- **PWA-01**: App works offline without internet connection
- **PWA-02**: App is installable to home screen
- **PWA-03**: App notifies user when update is available

### Platform

- **PLAT-01**: iOS storage persistence (Persistent Storage API for Safari)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Photos/face recognition | Privacy concerns, storage bloat, adds friction to entry |
| Date tracking | Context is the memory anchor, not time |
| Multiple contexts per person | Keeps data model simple; original meeting context is what you remember |
| Complex categorization/tagging | Freeform text contexts work better than taxonomies |
| Spaced repetition algorithms | Over-engineering for 1-10 names/month; manual toggle sufficient |
| Gamification (streaks, daily goals) | Creates pressure/guilt instead of utility |
| Cloud sync | Adds complexity; single-device usage is fine for personal utility |
| Real-time collaboration | Personal app, not social |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 1 | Complete |
| DATA-03 | Phase 1 | Complete |
| DATA-04 | Phase 1 | Complete |
| ENTR-01 | Phase 2 | Complete |
| ENTR-02 | Phase 2 | Complete |
| ENTR-03 | Phase 2 | Complete |
| ENTR-04 | Phase 2 | Complete |
| LOOK-01 | Phase 3 | Complete |
| LOOK-02 | Phase 3 | Complete |
| LOOK-03 | Phase 3 | Complete |
| LOOK-04 | Phase 3 | Complete |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-05*
*Last updated: 2026-03-06 after Phase 2 completion*
