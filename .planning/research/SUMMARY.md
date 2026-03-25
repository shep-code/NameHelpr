# Project Research Summary

**Project:** NameHelpr
**Domain:** Mobile-first PWA for personal name/contact memory
**Researched:** 2026-03-05
**Confidence:** HIGH

## Executive Summary

NameHelpr is a mobile-first personal utility app for remembering names by context—organizing contacts by where you met them rather than alphabetically. Based on research, this domain is best built as a local-first Progressive Web App with React 19 + Vite + Dexie.js (IndexedDB), optimized for offline-first operation at social events. The recommended approach prioritizes rapid mobile data entry (sub-15-second capture), context-based organization, and optional quiz functionality, avoiding the photo/facial recognition and gamification pitfalls common in competitor apps.

The most critical technical risk is iOS Safari's storage eviction policy, which can delete IndexedDB data after 7 days of inactivity unless the app implements persistent storage API and aggressively promotes home screen installation. Other significant risks include poor mobile keyboard UX (wrong input types), over-engineering quiz mode into an obligation rather than optional enhancement, and service worker update problems that trap users on stale versions. These risks are mitigated through specific technical implementations in early phases: Persistent Storage API in Phase 1, proper input attributes and single-screen forms for quick entry, and user-controlled update notifications for PWA versioning.

The research reveals strong consensus on architecture (local-first with Dexie.js), clear feature boundaries (context-first organization is differentiator, photos are anti-feature), and well-documented pitfalls (iOS storage eviction, quota errors, slow entry forms). Confidence is high across all research areas, with recommended stack versions verified from official sources and feature expectations validated against competitor analysis and mobile UX best practices.

## Key Findings

### Recommended Stack

React 19 + Vite + TypeScript provides the optimal foundation for this mobile-first PWA. React 19 (latest stable, Dec 2025) brings the Actions API for simplified form handling and 25-40% fewer re-renders via React Compiler—critical for battery life and responsiveness on mobile. Vite 7.3.1 delivers cold start under 2 seconds and microsecond HMR, with a lightweight 42KB bundle versus Next.js's 92KB. Since this app has no backend and no SEO requirements (personal utility, not public content), Vite's simplicity beats Next.js's server-side rendering overhead.

**Core technologies:**
- **React 19.2.1 + TypeScript 5.9.3:** Latest stable with Actions API for form handling, type safety critical for solo dev catching routing/data errors at compile time
- **Vite 7.3.1:** Build tool with cold start under 2 seconds, microsecond HMR, 42KB bundle versus Next.js 92KB—no backend means no need for SSR
- **Dexie.js 4.3.0:** Industry-standard IndexedDB wrapper with 438K weekly downloads, promise-based API, versioning, and complex queries—essential for offline-first contact storage
- **Tailwind CSS 4.0:** Utility-first styling with mobile-first breakpoints, 5x faster builds, perfect for rapid mobile UI development without component library bloat
- **vite-plugin-pwa 1.2.0:** Zero-config PWA with Workbox integration for service workers, offline support, caching strategies, installability
- **React Router 7.13.1:** Client-side routing with simplified package structure, maturity beats TanStack Router's complexity for 5-route app
- **react-hook-form 7.x + Fuse.js 7.x:** Form state management with minimal re-renders, lightweight fuzzy search (2KB gzipped) for low-volume data

### Expected Features

Context-first organization is the core differentiator—browsing by "Paul's Party" rather than alphabetically aligns with how memory actually works. All competitor apps organize alphabetically or by photo, missing the mental model users need for recall. Quick mobile entry must be sub-15 seconds (name + context + optional notes) on a single screen with no dropdowns or multi-step wizards. Quiz mode should be completely optional and user-controlled (no daily goals, no streaks, no guilt) to avoid retention problems seen in over-gamified flashcard apps.

**Must have (table stakes):**
- Quick name entry (phone-optimized, single-column, auto-focus, smart keyboards) — all contact apps have this
- Search by context (freeform text, <100ms response) — core use case "where did I meet them?"
- Browse by context (grouped view) — alternative to search for discovering all names from an event
- Offline-first operation (local IndexedDB storage) — mobile apps fail without this at events with poor connectivity
- Edit/delete entries (standard CRUD) — users expect basic operations
- Data persistence with IndexedDB — users lose trust if data disappears

**Should have (competitive advantage):**
- Context-first organization — unique differentiator, browse by event/place not alphabet
- Bidirectional quiz mode (context→name AND name→context) — most flashcard apps only do one direction
- Learning status tracking (manual toggle) — simpler than spaced repetition algorithms but still effective
- Context suggestions (autocomplete from existing contexts) — reduces typing, ensures consistency
- Multi-context search (OR logic across contexts) — rare in contact apps

**Defer (v2+):**
- Photo/face recognition — privacy concerns, storage bloat, adds friction (ANTI-FEATURE based on research)
- Spaced repetition algorithm — over-engineering for 1-10 names/month, manual toggle is sufficient (ANTI-FEATURE)
- Real-time sync across devices — adds complexity for low value, conflicts with offline-first architecture
- Gamification (scores, streaks) — creates pressure/guilt instead of utility (ANTI-FEATURE)
- Cloud backup/sync — defer until single-device usage validated, adds architectural complexity
- Export/import (CSV/JSON) — needed for data portability, but Phase 2 priority not MVP

### Architecture Approach

Local-first architecture with IndexedDB as the authoritative data source delivers zero-latency CRUD operations without backend costs or deployment complexity. This pattern is optimal for personal utility apps with low data volume (10-50 people per month), no collaboration needs, and single-user usage. Custom hooks encapsulate database operations (usePeople, useQuiz, useContexts) following React's composition model, keeping UI components pure and testable. Unidirectional data flow ensures state flows down from hooks to components via props/context, with events flowing up via callbacks—UI never modifies data directly.

**Major components:**
1. **Data Layer (Dexie.js + IndexedDB)** — Local storage with People table (name, context, notes, learned, createdAt) and Metadata table (settings, app state), async Promise-based API
2. **State Management (Custom Hooks + Context API)** — usePeople for CRUD, useQuiz for quiz logic/state, useContexts for browsing/filtering, encapsulates business logic away from UI
3. **UI Layer (React Views + Components)** — EntryView (quick entry), LookupView (search/browse), QuizView (flashcard mode), presentational components receive data via props with no direct database access
4. **Service Worker (PWA with vite-plugin-pwa)** — Offline-first with cache-first strategy for static assets, enables installability and works-offline experience
5. **Router (React Router 7)** — Client-side navigation between views, simple 5-route structure (Entry, Lookup, Quiz, Browse, Settings)

**Recommended project structure:**
```
src/
├── components/      # Presentational: PersonForm, PersonCard, QuizCard, ContextList
├── views/           # Page-level: EntryView, LookupView, QuizView, SettingsView
├── hooks/           # Business logic: usePeople, useQuiz, useContexts
├── db/              # Data layer: schema.ts, database.ts, migrations.ts
├── types/           # TypeScript: Person, Context, Quiz types
├── utils/           # Helpers: search.ts
├── App.tsx          # Root with routing
└── main.tsx         # Entry point
```

### Critical Pitfalls

Research identified 8 critical pitfalls with clear prevention strategies. The top 5 that must be addressed in early phases:

1. **iOS Safari Storage Eviction** — IndexedDB data disappears after 7 days inactivity on iOS Safari (or earlier under storage pressure), destroying user trust. Prevention: Implement Persistent Storage API (`navigator.storage.persist()`), aggressively prompt users to add to home screen (separate storage counters), display warning if permission denied. This is Phase 1 foundational work—storage strategy must be right from start or data loss kills trust immediately.

2. **Storage Quota Exceeded Without Graceful Degradation** — Chrome evicts entire origin storage when quota exceeded with no warning, users lose everything. Prevention: Wrap all storage writes in try-catch for `QuotaExceededError`, monitor quota with `StorageManager.estimate()` and warn at 80%, implement data pruning strategy (delete old quiz history first). Must handle quota errors from day one in Phase 1.

3. **Wrong Mobile Keyboard Types** — Users see full QWERTY instead of context-appropriate keyboards, increasing cognitive load and slowing critical capture moment. Prevention: Use `inputmode="text"` with `autocapitalize="words"` for names, `autocomplete="name"` for autofill, `inputmode="search"` for context search, test on actual iOS/Android devices not just desktop Chrome. Entry speed is core requirement—keyboard friction kills it in Phase 1.

4. **Data Entry Too Slow for Event Context** — Multi-screen wizards or complex forms make capture take 30+ seconds, users defer entry and forget. Prevention: Single-screen entry (name + context + optional notes), no dropdowns (all freeform text), auto-save on typing (no "Save" button), bottom-aligned actions for thumb reach, allow dismissing with just name+context. Test capture time must be sub-15 seconds or MVP fails.

5. **Quiz Mode Creates Retention Problems** — Copying spaced repetition apps creates guilt/pressure instead of utility, users abandon app feeling it's a chore. Prevention: Make quiz completely optional (lookup/browse is primary value), no daily goals/streaks/notifications, manual "mark as learned" toggle, 5-10 card sessions maximum, user controls when quiz happens. Design quiz as optional enhancement in Phase 3, not core obligation.

Additional critical pitfalls to address in later phases: No data export creates data hostage situation (add CSV export in Phase 2 for trust and GDPR compliance), service worker doesn't update properly leaving users stuck on old versions (implement update notification toast in Phase 1 PWA setup), search over-engineered or too slow for 50-200 person dataset (use client-side Fuse.js with instant results in Phase 2).

## Implications for Roadmap

Based on research, suggested phase structure prioritizes data foundation first (storage persistence is critical), then quick entry (validates core value), then lookup/browse (primary use case), then quiz enhancement (optional, comes last).

### Phase 1: Foundation & Data Storage
**Rationale:** Storage persistence must be correct from the start—iOS eviction after 7 days will destroy user trust if not handled. PWA infrastructure and database schema are foundational dependencies for all other features.

**Delivers:**
- Dexie.js database schema with People table and CRUD operations
- Persistent Storage API implementation for iOS Safari
- PWA manifest and service worker setup with update notifications
- Basic error handling for quota exceeded scenarios
- Home screen installation prompts

**Addresses (from FEATURES.md):**
- Data persistence (table stakes)
- Offline-first operation (table stakes)

**Avoids (from PITFALLS.md):**
- iOS Safari storage eviction (Critical Pitfall #1)
- Storage quota exceeded without graceful degradation (Critical Pitfall #2)
- Service worker doesn't update properly (Critical Pitfall #8)

**Research flag:** Standard patterns—IndexedDB with Dexie.js and PWA with vite-plugin-pwa are well-documented, skip deeper research.

### Phase 2: Quick Entry
**Rationale:** Entry speed validates core value proposition. If capture is slow (>15 seconds), users defer entry and forget, making the entire app useless. Mobile keyboard optimization prevents the most common UX mistake in form-heavy mobile apps.

**Delivers:**
- Single-screen entry form (name + context + optional notes)
- Proper mobile keyboard types (inputmode, autocapitalize, autocomplete attributes)
- Auto-save on typing (no explicit Save button)
- Bottom-aligned actions for thumb reach
- Validation that capture time is sub-15 seconds

**Addresses (from FEATURES.md):**
- Quick name entry (table stakes, must be phone-optimized)
- Edit/delete entries (table stakes, CRUD operations)

**Uses (from STACK.md):**
- react-hook-form for minimal re-renders and built-in validation
- React 19 Actions API for simplified form handling

**Avoids (from PITFALLS.md):**
- Wrong mobile keyboard types (Critical Pitfall #3)
- Data entry too slow for event context (Critical Pitfall #6)

**Research flag:** Standard patterns—mobile form best practices are well-documented in UX research, skip deeper research.

### Phase 3: Context Search & Browse
**Rationale:** Primary use case is "who did I meet at Paul's party?"—lookup by context. Browse mode provides alternative to search for discovering all names from specific events. This validates the context-first organization differentiator.

**Delivers:**
- Search by context with instant results (<100ms)
- Browse by context (grouped view showing all contexts)
- Client-side fuzzy search with Fuse.js
- Filter/sort options (by date added, learned status)
- Context suggestions/autocomplete from existing contexts

**Addresses (from FEATURES.md):**
- Search by context (table stakes)
- Browse by context (table stakes)
- Context-first organization (differentiator)
- Context suggestions (differentiator)
- Basic list view (table stakes)

**Uses (from STACK.md):**
- Fuse.js for lightweight fuzzy search (2KB gzipped)
- Dexie.js indexed queries for fast filtering

**Avoids (from PITFALLS.md):**
- Search that's too slow or over-engineered (Critical Pitfall #4)
- Keyboard covers search input/results (UX pitfall)

**Research flag:** Standard patterns—client-side search for small datasets (<500 records) has established patterns, skip deeper research.

### Phase 4: Quiz Mode (Optional Enhancement)
**Rationale:** Quiz is enhancement, not core value—lookup/browse is primary. Building this last ensures it's truly optional and doesn't hijack the product. Low-pressure design avoids retention problems from gamified flashcard apps.

**Delivers:**
- Bidirectional quiz (context→name AND name→context)
- Learning status tracking (manual toggle)
- Filter quiz by unlearned only
- Session size limit (5-10 cards maximum)
- No streaks, no daily goals, no guilt-inducing notifications
- User-initiated quiz only (no automatic scheduling)

**Addresses (from FEATURES.md):**
- Quiz mode context→name (table stakes)
- Quiz mode name→context (differentiator)
- Learning status tracking (differentiator)
- Filter quiz by unlearned (differentiator)

**Implements (from ARCHITECTURE.md):**
- useQuiz custom hook for quiz logic and state management
- QuizCard presentational component
- QuizView container component

**Avoids (from PITFALLS.md):**
- Quiz mode creates retention problems instead of solving them (Critical Pitfall #5)
- Treating quiz like obligation (UX pitfall)

**Research flag:** Standard patterns—flashcard quiz UI is well-understood, skip deeper research. However, user testing during this phase is critical to validate quiz feels helpful not obligatory.

### Phase 5: Polish & Data Portability
**Rationale:** Data export is needed for trust and regulatory compliance (GDPR/CCPA require data portability) but not critical for MVP validation. Dark mode and advanced features add polish after core value is proven.

**Delivers:**
- CSV/JSON export functionality
- Import data (restore from export)
- Dark mode support
- Multi-context search (OR logic)
- Statistics/analytics (how many learned, practice frequency)
- Advanced quiz options (shuffle, limit count)

**Addresses (from FEATURES.md):**
- Export/import (deferred v2+)
- Multi-context search (differentiator)
- Dark mode (deferred v2+)
- Statistics/analytics (deferred v2+)

**Avoids (from PITFALLS.md):**
- No data export = data hostage (Critical Pitfall #7)

**Research flag:** Needs research—GDPR/CCPA compliance requirements for data export format, CSV schema design for portability to other apps. Also research multi-context search UX patterns (how to present OR logic to users).

### Phase Ordering Rationale

- **Phase 1 first:** Storage persistence is foundational—if iOS evicts data after 7 days, no other features matter. PWA infrastructure enables offline-first operation required by all subsequent phases.

- **Phase 2 second:** Entry validates core value quickly. If capture is slow, product fails regardless of other features. Single-screen mobile form is straightforward to build and unblocks data creation for testing later phases.

- **Phase 3 third:** Lookup/browse is the primary use case (more frequent than quiz). Building this before quiz ensures product works as contact lookup tool even if quiz is never used. Context-first organization differentiates from competitors and validates product positioning.

- **Phase 4 fourth:** Quiz is optional enhancement, built last to avoid hijacking product direction. By this point, user testing can validate whether quiz mode is actually valuable or if it's over-engineering. Low-pressure design (no streaks/goals) prevents retention problems.

- **Phase 5 last:** Polish and data portability are important but not blocking for MVP validation. Export can be added retroactively (though regulatory compliance creates some urgency). Dark mode and advanced features are nice-to-have after core value proven.

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 5 (Data Portability):** GDPR/CCPA compliance requirements for data export, CSV schema design for portability to other apps, multi-context search UX patterns (how to present OR logic to non-technical users). Regulatory compliance is niche domain with specific requirements.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation):** IndexedDB with Dexie.js and PWA with vite-plugin-pwa have extensive official documentation and community examples. Storage eviction prevention strategies are well-documented.
- **Phase 2 (Quick Entry):** Mobile form best practices and keyboard optimization are thoroughly covered in UX research. React Hook Form has extensive docs.
- **Phase 3 (Search/Browse):** Client-side search for small datasets (<500 records) has established patterns. Fuse.js documentation is comprehensive.
- **Phase 4 (Quiz Mode):** Flashcard quiz UI patterns are well-understood. However, **user testing** during this phase is critical to validate quiz design (not technical research, but validation).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official documentation verified for React 19.2.1, Vite 7.3.1, TypeScript 5.9.3, Tailwind CSS 4.0, Dexie.js 4.3.0, React Router 7.13.1. Version compatibility confirmed across stack. |
| Features | HIGH | Validated against 6+ competitor apps (Name Reminder, Rememorate, NameKeeper), multiple flashcard app analyses, personal CRM research, mobile UX best practices. Clear consensus on table stakes vs differentiators. |
| Architecture | HIGH | Local-first patterns documented in official sources (MDN, web.dev, Android Developers). React architecture patterns verified from official React docs and community consensus. Dexie.js patterns from official documentation. |
| Pitfalls | MEDIUM-HIGH | iOS storage eviction well-documented in WebKit blog and community reports. Mobile UX pitfalls validated across multiple UX research sources. Quiz retention problems inferred from flashcard app user complaints and engagement research. |

**Overall confidence:** HIGH

Research across all four areas shows strong consensus from official sources and community best practices. Stack recommendations verified from official release notes and documentation. Feature expectations validated against competitor analysis and mobile UX research. Architecture patterns documented in official MDN/web.dev guides. Pitfalls drawn from documented iOS/Chrome storage policies and mobile UX studies.

### Gaps to Address

Minor gaps that need validation during implementation:

- **iOS Persistent Storage API adoption:** Safari 17+ supports `navigator.storage.persist()` but requires notification permission. Research shows this is the correct approach, but actual adoption rate on user devices (how many run iOS 17+?) needs validation during Phase 1. Fallback strategy: display prominent warning if permission denied, promote home screen installation aggressively.

- **Quiz session optimal size:** Research suggests 5-10 cards maximum to avoid retention problems, but this is inferred from flashcard app engagement research rather than specific to name-memory use case. User testing in Phase 4 should validate whether 5, 10, or different number feels right. Adjust based on user feedback.

- **Data export schema design:** CSV format is standard for portability, but exact schema (what fields to export, how to handle multi-line notes, date formatting) needs design during Phase 5. Research GDPR/CCPA requirements for what constitutes "complete export" of personal data.

- **Fuzzy search threshold tuning:** Fuse.js has configurable fuzzy matching thresholds. Research doesn't specify optimal settings for name/context search. Phase 3 implementation should test various threshold settings with realistic data to find balance between "too loose" (irrelevant results) and "too strict" (misses typos).

These gaps are implementation details rather than architectural unknowns—they don't change the recommended approach, just need tuning during respective phases.

## Sources

### Primary (HIGH confidence)

**Stack Research:**
- [React Versions](https://react.dev/versions) — Verified React 19.2.1 latest stable
- [Vite Releases](https://vite.dev/releases) — Confirmed Vite 7.3.1 current version
- [vite-plugin-pwa GitHub](https://github.com/vite-pwa/vite-plugin-pwa) — Version 1.2.0 requirements
- [Tailwind CSS v4.0 Blog](https://tailwindcss.com/blog/tailwindcss-v4) — v4 stable release Jan 2025
- [TypeScript Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html) — TypeScript 5.9 features
- [Dexie.js](https://dexie.org/) — Official IndexedDB wrapper documentation

**Architecture Research:**
- [Local-first web application architecture](https://plainvanillaweb.com/blog/articles/2025-07-16-local-first-architecture/) — Comprehensive guide to local-first patterns
- [Offline-first frontend apps in 2025: IndexedDB and SQLite](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/) — Current best practices for local storage
- [Progressive Web Apps (PWA) Best Practices for 2026](https://wirefuture.com/post/progressive-web-apps-pwa-best-practices-for-2026) — Modern PWA architecture
- [Guide to app architecture | Android Developers](https://developer.android.com/topic/architecture) — Official unidirectional data flow documentation
- [React Folder Structure in 5 Steps [2025]](https://www.robinwieruch.de/react-folder-structure/) — Project organization best practices

**Pitfalls Research:**
- [Offline data | web.dev](https://web.dev/learn/pwa/offline-data) — PWA offline capabilities
- [Updates to Storage Policy | WebKit](https://webkit.org/blog/14403/updates-to-storage-policy/) — iOS Safari storage eviction policy
- [Storage quotas and eviction criteria - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) — Browser storage quota documentation
- [PWA iOS Limitations and Safari Support: Complete Guide](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) — iOS PWA limitations
- [Mobile-First UX Design: Best Practices for 2026](https://www.trinergydigital.com/news/mobile-first-ux-design-best-practices-in-2026) — Mobile form design patterns

### Secondary (MEDIUM confidence)

**Features Research:**
- [Name Reminder: Remember Names - App Store](https://apps.apple.com/us/app/name-reminder-remember-names/id6450018987) — Competitor analysis
- [Rememorate | The Mobile App for Remembering Names](https://rememorate.com/) — Competitor analysis
- [NameKeeper - Remember Names App - App Store](https://apps.apple.com/us/app/namekeeper-remember-names/id1148776555) — Competitor analysis
- [5 Best Flashcard Apps for Students in 2026 | Laxu AI](https://laxuai.com/blog/best-flashcard-apps-for-students-2026) — Quiz mode patterns
- [Best Personal CRM Software: Top 9 Tools for Networking & Relationship Management](https://crm.org/crmland/personal-crm) — Contact management patterns
- [Mobile Form Design Best Practices](https://www.formsonfire.com/blog/mobile-form-design) — Mobile entry UX

**Stack Research:**
- [Vite vs Next.js 2025 Comparison](https://strapi.io/blog/vite-vs-nextjs-2025-developer-framework-comparison) — Performance benchmarks
- [React Router vs TanStack Router Comparison](https://betterstack.com/community/comparisons/tanstack-router-vs-react-router/) — Routing library comparison
- [IndexedDB Libraries Comparison](https://npm-compare.com/dexie,idb,localforage) — Download stats and feature comparison

**Pitfalls Research:**
- [Why Your IndexedDB Data Keeps Disappearing - DEV](https://dev.to/denyherianto/why-your-indexeddb-data-keeps-disappearing-1m0a) — Storage eviction community reports
- [UX Tip #16: Trigger the right keyboard on mobile](https://blog.designary.com/p/ux-tip-16-trigger-the-right-keyboard) — Mobile keyboard best practices
- [Mobile App Engagement in 2026: From Metrics to Working Strategies](https://watchers.io/post/mobile-app-engagement-strategies) — Retention and engagement research
- [How facial-recognition app poses threat to privacy, civil liberties — Harvard Gazette](https://news.harvard.edu/gazette/story/2023/10/how-facial-recognition-app-poses-threat-to-privacy-civil-liberties/) — Privacy concerns with photo features

### Tertiary (LOW confidence)

- Community blog posts on React 19 performance improvements — Needs validation with production testing
- Flashcard app user reviews for retention problems — Anecdotal evidence, needs validation with user testing

---
*Research completed: 2026-03-05*
*Ready for roadmap: yes*
