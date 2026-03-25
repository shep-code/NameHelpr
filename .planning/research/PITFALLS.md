# Pitfalls Research

**Domain:** Mobile-first PWA for personal name/contact memory
**Researched:** 2026-03-05
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: iOS Safari Storage Eviction

**What goes wrong:**
User data disappears after 7 days of inactivity on iOS Safari, or earlier under storage pressure. Users lose all their saved names and contexts without warning, destroying trust in the app.

**Why it happens:**
iOS Safari enforces a 7-day cap on script-writable storage (IndexedDB, localStorage) for web apps not added to home screen. Even home-screen apps can lose data under storage pressure through LRU (least-recently-used) eviction policies.

**How to avoid:**
1. Implement Safari 17+ Persistent Storage API (`navigator.storage.persist()`) which requires notification permission
2. Aggressively prompt users to add PWA to home screen (home screen apps have separate storage counters and aren't subject to 7-day ITP limits)
3. Implement automatic cloud backup/sync as primary strategy, treating local storage as cache only
4. Display prominent warning if persistent storage permission denied

**Warning signs:**
- User reports "my data disappeared"
- Analytics show sudden drop in data retrieval success rates
- High percentage of iOS Safari users (not home screen)

**Phase to address:**
Phase 1 (Data Storage) — This is foundational; storage strategy must be right from the start or data loss will kill user trust immediately.

---

### Pitfall 2: Storage Quota Exceeded Without Graceful Degradation

**What goes wrong:**
App crashes or fails silently when storage quota is exceeded. Chrome evicts entire origin storage (all IndexedDB databases, Cache API, localStorage) when quota exceeded, not just old data. Users lose everything with no warning.

**Why it happens:**
Developers don't wrap storage writes in try-catch blocks to handle `QuotaExceededError`. Browser quota varies wildly (Safari ~15-60% disk space, Firefox ~10GB max or 10% disk, Chrome ~60% free space) and isn't checked before writes.

**How to avoid:**
1. Wrap all storage writes in try-catch blocks
2. Monitor quota using `StorageManager.estimate()` and warn users at 80% capacity
3. Implement data pruning strategy (e.g., delete oldest quiz history first, preserve names/contexts)
4. Test with low storage scenarios (full disk simulation)
5. Provide export functionality before attempting large operations

**Warning signs:**
- `QuotaExceededError` exceptions in error logs
- User complaints about app "stopping working"
- No monitoring of storage.estimate() values

**Phase to address:**
Phase 1 (Data Storage) — Must handle quota errors from day one. Phase 3 (Quiz Mode) increases data volume and makes this more critical.

---

### Pitfall 3: Wrong Mobile Keyboard Types

**What goes wrong:**
Users see full QWERTY keyboard for name entry instead of context-appropriate keyboards. Increases cognitive load, slows entry, and raises abandonment rates during the critical "just met someone" capture moment.

**Why it happens:**
Developers don't set `inputmode` attributes or rely on browser heuristics that fail. Missing `autocomplete` attributes prevent iOS Safari from showing autocomplete options even with correct input types.

**How to avoid:**
1. Use `inputmode="text"` with `autocapitalize="words"` for name fields (capitalizes each word)
2. Use `autocomplete="name"` for name fields to trigger browser autofill
3. Use `inputmode="search"` for context search (shows search-optimized keyboard)
4. Test on actual iOS and Android devices, not just desktop Chrome DevTools
5. Avoid triggering keyboards on page load (no autofocus) — user may not be ready

**Warning signs:**
- Users report "slow to add names"
- High time-to-completion on entry form
- Low same-day capture rates (users defer entry rather than fight the UI)

**Phase to address:**
Phase 1 (Quick Entry) — Entry speed is a core requirement and keyboard friction kills it.

---

### Pitfall 4: Search That's Too Slow or Over-Engineered

**What goes wrong:**
For a dataset of 50-200 people, implementing complex search infrastructure (Algolia, Elasticsearch) adds latency, costs, and complexity. Or, search feels laggy because results don't appear instantly on each keystroke.

**Why it happens:**
Developers over-engineer for scale that will never exist, or use server-side search when client-side is sufficient. "More than a few seconds to load" causes abandoned sessions on mobile, but this dataset fits entirely in memory.

**How to avoid:**
1. Use client-side search with simple string matching — entire dataset is <1MB
2. Implement instant results (keystroke-by-keystroke filtering) with debouncing only if performance issues appear
3. No external search services needed for 200 records
4. Cache filtered results between keystrokes if filtering proves slow

**Warning signs:**
- Network requests for every search keystroke
- Search latency >100ms
- External search service in architecture diagram
- Debouncing set to >50ms without performance reason

**Phase to address:**
Phase 2 (Context Search/Browse) — Simple implementation here prevents unnecessary complexity.

---

### Pitfall 5: Quiz Mode Creates Retention Problems Instead of Solving Them

**What goes wrong:**
Quiz becomes a chore instead of helpful practice. Users feel obligated to quiz daily, get overwhelmed by review backlog, or see quiz as busywork. App becomes guilt-inducing rather than useful, leading to abandonment.

**Why it happens:**
Copying spaced repetition apps (Anki, Duolingo) without understanding this is a low-volume personal utility, not a learning platform. Typical usage is 1-10 new people per month, not 100 flashcards per day. Adding "streaks" or "daily goals" creates pressure inappropriate for this use case.

**How to avoid:**
1. Make quiz completely optional — lookup/browse is primary value, quiz is enhancement
2. No daily goals, no streaks, no guilt-inducing notifications
3. Manual "mark as learned" rather than algorithm-driven review schedules
4. Quiz session should be 5-10 cards maximum (not 50+)
5. User controls when quiz happens, app never demands it

**Warning signs:**
- Quiz features dominate UI/UX
- Push notifications about "review due today"
- Streak counters or daily goals
- Automatic scheduling of reviews

**Phase to address:**
Phase 3 (Quiz Mode) — Design quiz as optional enhancement, not core obligation.

---

### Pitfall 6: Data Entry Too Slow for Event Context

**What goes wrong:**
Multi-screen wizard, complex forms, or mandatory fields make capturing a name take 30+ seconds. Users are at social events, often juggling drinks/conversations — they need sub-10-second capture or they defer (and forget).

**Why it happens:**
Form design treats entry like desktop data entry instead of quick mobile capture. Multiple screens, validation dialogs, confirmation prompts, dropdown selectors instead of free text.

**How to avoid:**
1. Single-screen entry: Name + Context + (optional) Notes
2. No dropdowns — all freeform text entry
3. Auto-save on typing (no "Save" button required)
4. Use bottom-aligned buttons/actions (easier thumb reach)
5. Allow dismissing with just name+context (notes optional)
6. Test capture time: if >15 seconds, it's too slow

**Warning signs:**
- Multiple screens for basic entry
- Required field beyond name+context
- Dropdowns for context selection
- "Save" button instead of auto-save
- Time-to-first-capture metric >20 seconds

**Phase to address:**
Phase 1 (Quick Entry) — This is the MVP; if capture is slow, the whole app fails.

---

### Pitfall 7: No Data Export = Data Hostage

**What goes wrong:**
Users accumulate months of personal contact data with no way to export it. If app shuts down, developer abandons it, or user wants to switch, all data is lost. Regulatory risk with GDPR/California Consumer Privacy Act requiring data portability.

**Why it happens:**
Developer doesn't prioritize export because it seems like edge case. No immediate user demand pre-launch, so it gets deferred indefinitely.

**How to avoid:**
1. Implement CSV/JSON export in Phase 1 or 2
2. Export should include: names, contexts, notes, learning status, date added
3. Export button in settings, no rate limiting
4. Use standard format (CSV preferred for user portability to spreadsheet)
5. Consider auto-export to user's Google Drive/iCloud as backup option

**Warning signs:**
- No export functionality after MVP
- Data only stored in app-specific format
- "Coming soon" on export feature for multiple releases

**Phase to address:**
Phase 2 (Post-MVP) — Not critical for MVP but should be early priority. Required for trust and regulatory compliance.

---

### Pitfall 8: Service Worker Doesn't Update Properly

**What goes wrong:**
Users get stuck on old app version indefinitely. Bug fixes and new features don't reach users. Service worker caches old version and never updates, or updates without telling user, causing confusion when UI changes mid-session.

**Why it happens:**
Default service worker behavior is to install updates in background but not activate until all tabs closed. On mobile, users rarely "close" PWAs — they just switch away. Update sits waiting forever.

**How to avoid:**
1. Detect service worker update available
2. Show toast/banner: "New version available — tap to refresh"
3. Let user trigger update with button click (calls `skipWaiting()`)
4. Don't force update silently — jarring UX if user is mid-task
5. Use cache-first for app shell, network-first for data

**Warning signs:**
- No update notification mechanism
- Users report not seeing bug fixes
- Multiple versions in production simultaneously
- Cache strategy is all cache-first without network fallback

**Phase to address:**
Phase 1 (PWA Infrastructure) — Service worker strategy must be correct from start or updates become impossible.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| localStorage instead of IndexedDB | Simpler API, faster initial dev | iOS 7-day deletion, synchronous blocking, 5-10MB limit, can't handle structured data | Never — IndexedDB required for PWA persistence |
| No cloud sync, local-only storage | Faster MVP, no backend costs | Users can't access across devices, data loss on device loss/upgrade, no backup | Only for throw-away prototypes |
| Generic text input for everything | Faster implementation | Wrong keyboards, no autocomplete, slow entry | Never — proper input types are trivial to implement |
| Cache-first for all resources | Faster perceived performance | Users get stuck on stale data/bugs indefinitely | Only for static assets, never for data or app shell updates |
| No error handling on storage writes | Cleaner code, faster dev | Silent failures, data loss when quota exceeded | Never — QuotaExceededError is common on mobile |
| Autofocus on entry form | "Helpful" auto-open keyboard | Keyboard appears before user ready, covers content, jarring on page load | Never on mobile — user controls when to type |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Push Notifications | Requesting permission on first launch | Only request when user wants feature (quiz reminders, etc.) — unsolicited permission requests feel invasive |
| Google/Apple Sign-In | Assuming user wants third-party auth | Offer no-auth mode first (local-only data), auth optional for cloud sync |
| Cloud Storage Sync | Syncing on every data change | Batch syncs (e.g., on close/background), show sync status, allow offline operation |
| Analytics | Sending PII (names/contexts) to analytics | Anonymize all data — only send counts/metrics, never personal content |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all records into memory on startup | Slow app startup | Lazy load — only load what's needed for current view | >500 records or <1GB device memory |
| Linear search through all records for filtering | Search feels laggy as dataset grows | Indexed search or client-side search library (Fuse.js) | >200 records or complex queries |
| Rendering entire list instead of virtualization | Scroll jank with many results | Virtual scrolling (react-window, etc.) for lists >50 items | >100 visible items |
| Storing quiz history for every quiz ever | Growing storage consumption | Prune history older than 6 months, aggregate to stats | >1000 quiz sessions |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| No data encryption at rest | Names/contexts readable if device compromised | Use Web Crypto API for sensitive notes, or accept risk (names alone aren't high-sensitivity) |
| Sending unencrypted data to cloud sync | PII exposed if cloud service compromised | HTTPS required (baseline), encrypt sensitive fields client-side before sync |
| No rate limiting on export | User could script data exfiltration of all users if multi-tenant | Single-user app makes this non-issue, but rate-limit if adding sharing |
| Storing data in localStorage (not just security, also persistence) | Accessible to all scripts, no same-origin isolation | Use IndexedDB with structured data, limits exposure |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing too many autocomplete suggestions | Choice paralysis, harder to find right option | Limit to 8 suggestions on mobile (10 on desktop) |
| Search results not grouped by context | Hard to find person when multiple contexts match | Group results by context, show context name prominently |
| Keyboard covers search input/results | Can't see what you're typing or results | Position search input at top, results below, never sandwich between input and keyboard |
| Modal dialogs requiring two-handed operation | Frustrating on phone, slows workflow | Use bottom sheets for mobile, keep actions in thumb reach |
| Mystery meat navigation (icons without labels) | Users don't understand navigation | Use labeled bottom nav: Browse, Search, Add, Quiz, Settings |
| Treating quiz like obligation (streaks, daily goals) | Guilt, pressure, abandonment | Quiz is optional enhancement, user-initiated only |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **PWA Installation:** Works on Android Chrome but not iOS Safari — verify home screen add flow works on both
- [ ] **Offline Mode:** App loads but shows blank screen offline — verify service worker caches all critical assets
- [ ] **Storage Persistence:** Data persists in testing but not production iOS — verify Persistent Storage API implementation and fallback warnings
- [ ] **Search:** Works with 10 test records but lags with 200 — verify performance testing with realistic dataset
- [ ] **Entry Form:** Works on desktop but keyboard covers buttons on mobile — verify mobile testing on actual devices
- [ ] **Quiz Mode:** Quizzes 5 cards fine but overwhelming with 50 unlearned — verify session size limits and filtering
- [ ] **Data Loss:** Never tested storage quota exceeded — verify try-catch on all writes and quota monitoring
- [ ] **Updates:** New version deployed but users still see old version — verify service worker update notification

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| iOS storage eviction | LOW (if cloud sync exists) | Restore from cloud backup; if no backup, data lost — educate user on home screen installation |
| Quota exceeded | LOW | Implement pruning flow, export data for user, clear old quiz history, re-import essential data |
| Wrong keyboard types | LOW | Update input attributes, push update, notify users update available |
| Search too slow | MEDIUM | Migrate to better search library (Fuse.js), add indexes, or simplify query complexity |
| Quiz retention problems | MEDIUM | Redesign quiz as optional, remove pressure features, make skipping easy |
| Slow data entry | HIGH | Requires UX redesign — collapse multi-screen to single screen, reduce required fields |
| No data export | MEDIUM | Add export feature retroactively, announce to users via update notification |
| Service worker stuck | LOW | Force update with skipWaiting(), add update notification for future |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| iOS Safari storage eviction | Phase 1 (Data Storage) | Test on iOS Safari not added to home screen, verify data persists after 8 days inactive |
| Storage quota exceeded | Phase 1 (Data Storage) | Simulate full disk, verify graceful error handling and user notification |
| Wrong keyboard types | Phase 1 (Quick Entry) | Test on iOS and Android devices, verify correct keyboards appear for each field |
| Search too slow | Phase 2 (Search/Browse) | Load 200 test records, measure search response time <100ms per keystroke |
| Quiz retention problems | Phase 3 (Quiz Mode) | User testing: does quiz feel helpful or obligatory? Skip rate >50% indicates problems |
| Slow data entry | Phase 1 (Quick Entry) | Time from "Add" tap to dismissal <15 seconds for name+context entry |
| No data export | Phase 2 (Post-MVP) | Export button works, CSV contains all user data in readable format |
| Service worker doesn't update | Phase 1 (PWA Infrastructure) | Deploy update, verify users see notification within 24 hours, tap updates immediately |

## Sources

- [Offline data | web.dev](https://web.dev/learn/pwa/offline-data)
- [PWA Offline Capabilities: How the Technologies Work | GoMage](https://www.gomage.com/blog/pwa-offline/)
- [Progressive Web Apps 2026: PWA Performance Guide](https://www.digitalapplied.com/blog/progressive-web-apps-2026-pwa-performance-guide)
- [Navigating Safari/iOS PWA Limitations - Vinova](https://vinova.sg/navigating-safari-ios-pwa-limitations/)
- [Offline storage for PWAs - LogRocket Blog](https://blog.logrocket.com/offline-storage-for-pwas/)
- [Mobile-First UX Design: Best Practices for 2026](https://www.trinergydigital.com/news/mobile-first-ux-design-best-practices-in-2026)
- [7 UI/UX Mistakes That SCREAM You're a Beginner in 2026](https://medium.com/@dollyborade07/7-ui-ux-mistakes-that-scream-youre-a-beginner-in-2026-and-exactly-how-to-fix-each-one-4e629ca716aa)
- [Mobile App UX: The 7 Biggest Mistakes First-Time Founders Make](https://mindsea.com/blog/mobile-app-ux-mistakes/)
- [Spaced Repetition App Guide: Remember What You Read [2025–2026]](https://makeheadway.com/blog/spaced-repetition-app/)
- [5 Best Flashcard Apps for Students in 2026 | Laxu AI](https://laxuai.com/blog/best-flashcard-apps-for-students-2026)
- [From Data Loss to Data Misuse: Privacy Threats in 2026](https://www.eccu.edu/blog/data-misuse-new-privacy-threat-model/)
- [Data Privacy Week 2026 - Optery](https://www.optery.com/data-privacy-week-2026/)
- [Understanding Data Privacy in Mobile Apps](https://natively.dev/blog/understanding-data-privacy-in-mobile-apps)
- [Storage quotas and eviction criteria - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [IndexedDB Max Storage Size Limit - RxDB](https://rxdb.info/articles/indexeddb-max-storage-limit.html)
- [Why Your IndexedDB Data Keeps Disappearing - DEV](https://dev.to/denyherianto/why-your-indexeddb-data-keeps-disappearing-1m0a)
- [Updates to Storage Policy | WebKit](https://webkit.org/blog/14403/updates-to-storage-policy/)
- [PWA iOS Limitations and Safari Support: Complete Guide](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [Do Progressive Web Apps Work on iOS? Complete Guide for 2026](https://www.mobiloud.com/blog/progressive-web-apps-ios)
- [9 UX Best Practice Design Patterns for Autocomplete Suggestions – Baymard](https://baymard.com/blog/autocomplete-design)
- [UX And HTML5: Let's Help Users Fill In Your Mobile Form (Part 2) — Smashing Magazine](https://www.smashingmagazine.com/2018/08/ux-html5-mobile-form-part-2/)
- [UX Tip #16: Trigger the right keyboard on mobile](https://blog.designary.com/p/ux-tip-16-trigger-the-right-keyboard)
- [Common Mobile UX Mistakes I See in Almost Every Project - DEV](https://dev.to/dinko7/common-mobile-ux-mistakes-i-see-in-almost-every-project-djb)
- [Mobile App Engagement in 2026: From Metrics to Working Strategies](https://watchers.io/post/mobile-app-engagement-strategies)
- [Increase app retention 2026: Benchmarks, strategies & examples](https://www.pushwoosh.com/blog/increase-user-retention-rate/)
- [Mobile Search UX & Design | Best Practices](https://evinent.com/blog/mobile-search-ux-ui)
- [Mobile search UX best practices, part 1: Understanding the challenges](https://www.algolia.com/blog/ux/mobile-search-ux-8-obstacles)
- [Health Data Integration Guide: App Switching, Export & Migration 2026](https://lifetrails.ai/blog/health-data-integration-app-switching-export-guide)
- [Predictions for the 2026 edition of data portability unwrapped | Data Transfer Initiative](https://dtinit.org/blog/2026/01/13/portability-predictions-2026)

---
*Pitfalls research for: Mobile-first PWA for personal name/contact memory*
*Researched: 2026-03-05*
