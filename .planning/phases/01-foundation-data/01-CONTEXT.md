# Phase 1: Foundation & Data - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish local-first storage with IndexedDB and PWA infrastructure. User data persists reliably across sessions with offline-first capability. Covers add, edit, and delete operations for person records.

</domain>

<decisions>
## Implementation Decisions

### Platform
- Android-only initially — no iOS Safari storage handling needed
- Chrome on Android is the target browser

### PWA Install Experience
- Browser default install prompt — no custom UI for v1
- Let Chrome show its standard "Add to Home Screen" banner
- Can add custom install button in future if users aren't discovering install

### App Icon
- Text-based icon: "NHr" (N and H uppercase, r lowercase)
- Clean, recognizable, easy to generate

### Splash Screen
- NHr icon centered with "NameHelpr" text below
- Standard PWA approach

### Claude's Discretion
- Color scheme for icon and splash screen (pick something modern that works well on home screens)
- Empty state design (what shows when app first opens with no data)
- Offline indicator approach (whether/how to show offline status)
- Loading states and transitions

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project

### Established Patterns
- None yet — this phase establishes the foundation

### Integration Points
- IndexedDB for local storage
- Service Worker for offline capability
- Web App Manifest for PWA installability

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for PWA implementation.

</specifics>

<deferred>
## Deferred Ideas

- iOS support — may add later but not for v1

</deferred>

---

*Phase: 01-foundation-data*
*Context gathered: 2026-03-05*
