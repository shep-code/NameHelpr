# Feature Research

**Domain:** Name-remembering/contact memory app
**Researched:** 2026-03-05
**Confidence:** MEDIUM-HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Quick name entry | All contact/memory apps have this | LOW | Must be phone-optimized with minimal typing; single-column layout, auto-focus, smart keyboard types |
| Search by context | Core use case - "where did I meet them?" | LOW-MEDIUM | Freeform text search across context field; must be fast (<100ms) |
| Basic list view | Standard in all contact apps | LOW | Simple scrollable list of names with context preview |
| Offline-first operation | Mobile apps fail without this | MEDIUM | Local storage (IndexedDB/SQLite) with background sync; users expect app to work at events with poor connectivity |
| Edit/delete entries | Users expect CRUD operations | LOW | Standard form operations |
| Data persistence | Users lose trust if data disappears | LOW-MEDIUM | Local-first with optional cloud backup; encrypt sensitive data |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Context-first organization | Unique: browse by "Paul's Party" not alphabetically | LOW | Aligns with core value; most apps organize by name/alphabet which doesn't match how memory works |
| Bidirectional quiz mode | Practice both directions: context→name AND name→context | LOW-MEDIUM | Most flashcard apps only do one direction; real world requires both |
| Learning status tracking | Know what you've internalized vs still need to practice | LOW | Manual toggle; simpler than spaced repetition algorithms but still effective |
| Multi-context search | Search multiple contexts simultaneously, group results | MEDIUM | Example: "Paul's Party OR Jim's Concert" - rare in contact apps |
| Context suggestions | Auto-suggest previously used contexts while typing | LOW | Reduces typing, ensures consistency (e.g., "Paul's party" vs "Paul's Party") |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Photo/face recognition | Many name apps have this | Privacy concerns, storage bloat, adds friction to entry, facial recognition raises civil liberty issues | Text-based description field for "brown hair, glasses" etc. |
| Spaced repetition algorithm | Flashcard apps use this | Over-engineering for low volume (1-10/month); complex to implement correctly; users know when they've learned a name | Manual "learned" toggle with optional "quiz me on unlearned only" filter |
| Social sharing/collaboration | "Share contacts with friends" | This is personal/private data; adds complexity; privacy nightmare | Export as text/CSV for manual sharing if needed |
| Complex tagging system | Users think more organization = better | Creates maintenance burden; freeform context works better for memory anchoring | Stick with single freeform context field |
| Automatic contact syncing | "Import from phone contacts" | Different mental models; phone contacts are for calling, this is for memory practice; creates clutter | Manual entry only - keeps focused on names you want to remember |
| Real-time sync across devices | Users expect this from cloud apps | Adds complexity for low-value (most usage is single device); conflict resolution overhead | Local-first with manual export/import if needed |
| Gamification (scores, streaks, achievements) | Makes practice "fun" | Creates pressure/guilt; this is utility not entertainment; feature fatigue | Simple progress indicator (X learned of Y total) |

## Feature Dependencies

```
[Quick Name Entry]
    └──requires──> [Offline-first operation]
    └──requires──> [Data persistence]

[Quiz Mode]
    └──requires──> [Basic list view]
    └──enhances──> [Learning status tracking]

[Learning Status Tracking]
    └──enhances──> [Quiz Mode] (enable "unlearned only" filter)

[Context Suggestions]
    └──requires──> [Search by context] (shares text indexing infrastructure)

[Multi-context Search]
    └──requires──> [Search by context] (extends single search)

[Offline-first operation]
    └──conflicts──> [Real-time sync] (architectural mismatch)
```

### Dependency Notes

- **Quick Name Entry requires Offline-first operation:** Entry happens at events with poor connectivity; must work without network
- **Quick Name Entry requires Data persistence:** Users enter data expecting it to be saved immediately
- **Quiz Mode requires Basic list view:** Needs to pull from stored entries for quizzing
- **Quiz Mode enhances Learning status tracking:** Quiz filtering by learned/unlearned status makes practice efficient
- **Context Suggestions requires Search infrastructure:** Both need text indexing/searching capabilities
- **Multi-context Search requires Search by context:** Extends single-context search with OR logic
- **Offline-first conflicts with Real-time sync:** Local-first architecture makes real-time sync complex; better to choose one approach

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] Quick name entry (name + context + optional notes) — Core value: capture context when meeting someone
- [ ] Basic list view (all entries) — Must be able to see what you've captured
- [ ] Search by context — Core use case: "I met them at Paul's party"
- [ ] Browse by context (grouped view) — Alternative to search; see all contexts, tap to see associated names
- [ ] Offline-first operation — Works at events with poor connectivity
- [ ] Data persistence (local storage) — Users trust the app only if data persists
- [ ] Edit/delete entries — Basic CRUD operations
- [ ] Quiz mode: context→name — Practice recalling names from contexts

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Quiz mode: name→context — Add if users request bidirectional practice (likely after using context→name mode)
- [ ] Learning status tracking — Add when users say "I want to focus on names I don't know yet"
- [ ] Filter quiz by unlearned — Natural follow-up to learning status tracking
- [ ] Context suggestions (autocomplete) — Add when users have enough contexts that typing becomes repetitive
- [ ] Multi-context search — Add if users request "find everyone from these 3 events"

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Cloud backup/sync — Defer until single-device usage is validated; adds complexity
- [ ] Export/import (CSV/JSON) — Defer until users request data portability
- [ ] Advanced quiz options (shuffle, limit count) — Defer until quiz modes are proven valuable
- [ ] Statistics/analytics (how many learned, practice frequency) — Defer; nice to have but not essential
- [ ] Dark mode — Defer until usage patterns validated (nice UX polish)

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Quick name entry | HIGH | LOW | P1 |
| Search by context | HIGH | LOW-MEDIUM | P1 |
| Browse by context | HIGH | LOW-MEDIUM | P1 |
| Offline-first operation | HIGH | MEDIUM | P1 |
| Data persistence | HIGH | LOW-MEDIUM | P1 |
| Basic list view | HIGH | LOW | P1 |
| Edit/delete entries | HIGH | LOW | P1 |
| Quiz mode (context→name) | HIGH | MEDIUM | P1 |
| Quiz mode (name→context) | MEDIUM | LOW | P2 |
| Learning status tracking | MEDIUM | LOW | P2 |
| Filter quiz by unlearned | MEDIUM | LOW | P2 |
| Context suggestions | MEDIUM | LOW-MEDIUM | P2 |
| Multi-context search | MEDIUM | MEDIUM | P2 |
| Cloud backup/sync | LOW | HIGH | P3 |
| Export/import | LOW | MEDIUM | P3 |
| Advanced quiz options | LOW | LOW-MEDIUM | P3 |
| Statistics/analytics | LOW | MEDIUM | P3 |
| Dark mode | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch (validates core value)
- P2: Should have, add when possible (enhances core value)
- P3: Nice to have, future consideration (polish/convenience)

## Competitor Feature Analysis

| Feature | Name Reminder (iOS) | Rememorate | NameKeeper | Our Approach |
|---------|---------------------|------------|------------|--------------|
| Organization | Groups (Golf Buddies, Soccer Team) | Social media integration | Photo-based | Context-first (event/place where met) |
| Photo support | Yes (with face recognition) | Yes (photo search) | Yes (primary feature) | NO - text only for simplicity and privacy |
| Entry method | Manual forms | Business card scanning + social media | Manual with photos | Quick mobile form (name + context + notes) |
| Practice/Quiz | Not prominent | Memory game with contacts | Quiz mode (name/face) | Bidirectional quiz (context↔name) |
| Learning tracking | No | No | No | Manual "learned" status (differentiator) |
| Context capture | Via group categorization | Location + date/time + keywords | No context focus | Primary organizing principle |
| Social integration | No | LinkedIn, Twitter, Facebook | No | NO - privacy-first approach |
| Offline support | Unknown | Requires initial sync | Unknown | Full offline-first (differentiator) |

**Key Competitive Insights:**

1. **Most competitors focus on photos/faces** - we differentiate by being text/context-first
2. **Social media integration is common** - we avoid this for privacy and simplicity
3. **Organization by categories/groups is standard** - we organize by contexts (where you met)
4. **Learning/practice modes are rare** - quiz mode is a differentiator for us
5. **Nobody emphasizes offline-first explicitly** - opportunity to differentiate for mobile use at events

## Feature Complexity Notes

### LOW Complexity Features
- Basic CRUD operations (create, read, update, delete)
- Simple list views with filtering
- Text-based search (using browser's built-in IndexedDB full-text capabilities)
- Manual toggles (learned/unlearned status)
- Context suggestions (based on existing context list)

### MEDIUM Complexity Features
- Offline-first architecture (service workers, background sync)
- Quiz mode with randomization and state management
- Multi-context search (OR logic across multiple fields)
- Data persistence with encryption
- Context grouping/browsing UI

### HIGH Complexity Features (Deliberately Avoided)
- Photo storage and facial recognition (privacy + storage + complexity)
- Spaced repetition algorithms (over-engineering for this use case)
- Real-time sync with conflict resolution
- Social media integration and OAuth flows
- Automatic contact syncing with complex deduplication

## User Workflow Analysis

### Primary Workflows

**1. Capture (at event, on phone)**
```
Open app → Tap "Add" → Enter name → Enter context → (Optional) Add notes → Save
```
Critical: Must be <30 seconds total; minimal typing; works offline

**2. Lookup (before/during event)**
```
Open app → Search "Paul's party" → See list of names from that event
OR
Open app → Browse contexts → Tap "Paul's party" → See list of names
```
Critical: Fast search (<100ms); works offline; results clearly grouped

**3. Practice (periodic quizzing)**
```
Open app → Tap "Quiz" → See context → Recall name → Tap to reveal → Mark if correct
```
Critical: Low friction; quick iterations; optional "unlearned only" filter

### Anti-Patterns Observed in Research

1. **Form overload** - apps asking for too many fields (phone, email, birthday, social media, etc.)
   - **Our approach:** Name + Context + Notes only

2. **Complex categorization** - forcing users to choose categories/tags upfront
   - **Our approach:** Freeform context text; no taxonomy to maintain

3. **Feature fatigue** - too many features creating cluttered interfaces
   - **Our approach:** Ruthlessly minimal; focus on core value only

4. **Unnecessary permissions** - requesting contact access, camera, location when not needed
   - **Our approach:** No special permissions required; text input only

5. **Social pressure** - gamification creating guilt/pressure
   - **Our approach:** Simple progress tracking without streaks/scores

## Sources

### Name-Remembering Apps
- [Name Reminder: Remember Names - App Store](https://apps.apple.com/us/app/name-reminder-remember-names/id6450018987)
- [NameKeeper - Remember Names App - App Store](https://apps.apple.com/us/app/namekeeper-remember-names/id1148776555)
- [Revere App – Remember names and details about people](https://www.revereapp.com/)
- [Remember Names: Name Reminder App - App Store](https://apps.apple.com/us/app/remember-names-name-reminder/id6504533632)
- [Rememorate | The Mobile App for Remembering Names](https://rememorate.com/)
- [Who's Who: Remembering Names and Faces App](https://shiresmith.github.io/projects/whos-who/)

### Flashcard/Learning Apps
- [5 Best Flashcard Apps for Students in 2026 | Laxu AI](https://laxuai.com/blog/best-flashcard-apps-for-students-2026)
- [3 Best Free Flashcard Apps for Memory & Retention in 2026](https://onewebcare.com/blog/free-flashcard-apps/)
- [Gizmo AI: Smart Flashcards with Spaced Repetition](https://gizmo.ai)
- [Active Recall and Spaced Repetition: Science-Backed Study Methods 2026](https://www.reviewjane.com/blog/active-recall-spaced-repetition)

### Personal CRM/Contact Management
- [Best Personal CRM Software: Top 9 Tools for Networking & Relationship Management](https://crm.org/crmland/personal-crm)
- [Personal CRM Software: 10 Best Tools For 2026 Compared](https://monday.com/blog/crm-and-sales/personal-crm-software/)
- [Top 10 Personal CRM Tools for 2026: Features & Pricing](https://www.folk.app/articles/best-personal-crm)

### Mobile UX Best Practices
- [How to Design UI Forms in 2026: Your Best Guide | IxDF](https://ixdf.org/literature/article/ui-form-design)
- [13 Mobile Form Design Best Practices for Beginners](https://www.formsonfire.com/blog/mobile-form-design)
- [Mobile-First UX Design: Best Practices for 2026](https://www.trinergydigital.com/news/mobile-first-ux-design-best-practices-in-2026)
- [How to Avoid Feature Fatigue in Mobile App Development](https://spiralscout.com/blog/how-to-avoid-feature-fatigue-in-mobile-app-development)

### Offline-First Architecture
- [Build an offline-first app | Android Developers](https://developer.android.com/topic/architecture/data-layer/offline-first)
- [Building Offline Apps: A Fullstack Approach to Mobile Resilience](https://think-it.io/insights/offline-apps)
- [5 critical components for implementing a successful offline-first strategy in mobile applications](https://medium.com/@therahulpahuja/5-critical-components-for-implementing-a-successful-offline-first-strategy-in-mobile-applications-849a6e1c5d57)

### Privacy Concerns
- [How facial-recognition app poses threat to privacy, civil liberties — Harvard Gazette](https://news.harvard.edu/gazette/story/2023/10/how-facial-recognition-app-poses-threat-to-privacy-civil-liberties/)
- [7 Biggest Privacy Concerns Around Facial Recognition Technology](https://www.liberties.eu/en/stories/facial-recognition-privacy-concerns/44518)

### User Behavior & Anti-Patterns
- [Why Mobile Apps Fail: Decoding 8 Most Common Complaints of Users](https://imaginovation.net/blog/why-mobile-apps-fail-decoding-complaints-app-users/)
- [How to Get Better at Remembering Names | Psychology Today](https://www.psychologytoday.com/us/blog/communications-that-matter/202502/how-are-you-at-remembering-names-you-should-know-this)

---
*Feature research for: Name-remembering/contact memory app*
*Researched: 2026-03-05*
