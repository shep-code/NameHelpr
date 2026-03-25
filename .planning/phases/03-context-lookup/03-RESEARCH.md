# Phase 3: Context Lookup - Research

**Researched:** 2026-03-06
**Domain:** Client-side search, fuzzy matching, instant filtering, grouped result display
**Confidence:** HIGH

## Summary

Phase 3 enables context-driven name lookup through instant search (keystroke-by-keystroke filtering) and browseable context lists. The research identifies proven patterns for client-side fuzzy search using Fuse.js, instant filtering with controlled inputs, and grouped result display for mobile UX.

**Key findings:**
- Fuse.js provides lightweight (3KB gzipped) fuzzy search ideal for client-side datasets under 1000 records
- Threshold of 0.3-0.4 balances typo tolerance with result relevance
- Instant search (<100ms response) requires controlled inputs with optional debouncing only for rendering optimizations
- Grouped results by context improve mobile UX by providing visual hierarchy and reducing cognitive load
- Dexie's distinct pattern (load all, deduplicate in JS) is optimal for small datasets like context lists
- No external search service needed - entire dataset fits in memory (<1MB for 200 people)

**Primary recommendation:** Implement client-side instant search with Fuse.js (threshold: 0.4, search both name and context fields), group results by context using JavaScript array grouping, display contexts as browseable list sorted alphabetically with person counts.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LOOK-01 | User can search by typing context to find associated names instantly (under 100ms) | Fuse.js client-side search, controlled input pattern, no debouncing for small datasets, performance threshold research |
| LOOK-02 | User can browse a list of all contexts | Dexie distinct pattern for contexts, alphabetical sorting, mobile list UI patterns |
| LOOK-03 | User can tap a context to see all names from that context | Dexie filtered query by context, list view component reuse |
| LOOK-04 | User can search multiple contexts and see results grouped by context | Fuse.js multi-field search, JavaScript groupBy pattern, grouped list mobile UI |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.4 | UI framework | Already in project, controlled inputs for instant search |
| Dexie | 4.3.0 | IndexedDB wrapper | Already in project, query and filter people by context |
| dexie-react-hooks | 4.2.0 | React integration | Already in project, useLiveQuery for reactive context list |
| Fuse.js | 7.x | Client-side fuzzy search | Industry standard (438K weekly downloads), 3KB gzipped, handles typos and fuzzy matching |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None required | - | - | All functionality achievable with core stack |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Fuse.js | Native string.includes() | Exact match only, no typo tolerance; save 3KB but lose fuzzy matching |
| Fuse.js | Algolia InstantSearch | Server-side search adds latency, costs, complexity; only needed for 10K+ records |
| JavaScript groupBy | lodash.groupBy | 20KB dependency vs 5 lines of native code |
| Alphabetical sort | No sort (insertion order) | Harder to find contexts in long lists; sorting is trivial |

**Installation:**
```bash
# Only new dependency for Phase 3
npm install fuse.js
```

## Architecture Patterns

### Recommended Component Structure
```
src/
├── components/
│   ├── SearchInput.tsx          # New: search input with instant filtering
│   ├── ContextList.tsx           # New: browseable list of all contexts
│   ├── GroupedResults.tsx        # New: search results grouped by context
│   └── PersonList.tsx            # Existing: reuse for context detail view
├── hooks/
│   ├── useSearch.ts              # New: Fuse.js wrapper with search state
│   └── useContexts.ts            # New: distinct contexts from Dexie
├── db/
│   ├── schema.ts                 # Existing: Person schema
│   └── hooks.ts                  # Add: searchPeople, getContexts queries
├── views/
│   ├── SearchView.tsx            # New: main search interface
│   └── ContextBrowseView.tsx     # New: browse all contexts
└── types/
    └── Person.ts                 # Existing: Person type
```

### Pattern 1: Client-Side Instant Search with Fuse.js
**What:** User types in search input, results filter instantly (<100ms) with fuzzy matching for typos
**When to use:** Datasets under 1000 records that fit in memory, need typo tolerance

**Example:**
```typescript
// Source: https://www.fusejs.io/api/options.html
import Fuse from 'fuse.js';
import { useMemo, useState } from 'react';
import { Person } from '../types/Person';

export function useSearch(people: Person[]) {
  const [query, setQuery] = useState('');

  // Memoize Fuse instance (expensive to create)
  const fuse = useMemo(() => {
    return new Fuse(people, {
      keys: [
        { name: 'context', weight: 2 },  // Prioritize context matches
        { name: 'name', weight: 1 }      // Also search names
      ],
      threshold: 0.4,        // Balance between typo tolerance and relevance
      ignoreLocation: true,  // Match anywhere in string, not just beginning
      minMatchCharLength: 2  // Require at least 2 characters to match
    });
  }, [people]);

  // Instant search - no debouncing needed for small datasets
  const results = useMemo(() => {
    if (!query.trim()) return people;
    return fuse.search(query).map(result => result.item);
  }, [query, fuse, people]);

  return { query, setQuery, results };
}
```

### Pattern 2: Grouped Results Display
**What:** Search results grouped by context, each group showing context name and matching people
**When to use:** Multiple contexts in results, need visual hierarchy on mobile

**Example:**
```typescript
// Source: Mobile search UX patterns research
import { Person } from '../types/Person';

interface GroupedResults {
  [context: string]: Person[];
}

export function groupByContext(people: Person[]): GroupedResults {
  return people.reduce((groups, person) => {
    const context = person.context;
    if (!groups[context]) {
      groups[context] = [];
    }
    groups[context].push(person);
    return groups;
  }, {} as GroupedResults);
}

// Usage in component:
function GroupedResultsView({ results }: { results: Person[] }) {
  const grouped = groupByContext(results);
  const contexts = Object.keys(grouped).sort();

  return (
    <div>
      {contexts.map(context => (
        <section key={context}>
          <h3>{context}</h3>
          <ul>
            {grouped[context].map(person => (
              <li key={person.id}>{person.name}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
```

### Pattern 3: Distinct Contexts with Counts
**What:** Get list of all unique contexts with person counts for browsing
**When to use:** Small dataset where loading all records is fast (<50ms)

**Example:**
```typescript
// Source: Dexie documentation + JavaScript array patterns
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';

interface ContextWithCount {
  context: string;
  count: number;
}

export function useContexts(): ContextWithCount[] | undefined {
  return useLiveQuery(async () => {
    const people = await db.people.toArray();

    // Count people per context
    const counts = people.reduce((acc, person) => {
      acc[person.context] = (acc[person.context] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Convert to array and sort alphabetically
    return Object.entries(counts)
      .map(([context, count]) => ({ context, count }))
      .sort((a, b) => a.context.localeCompare(b.context));
  }, []);
}
```

### Pattern 4: Controlled Search Input (No Debouncing)
**What:** Search input updates state immediately on every keystroke, filtering happens synchronously
**When to use:** Client-side search with small datasets (under 1000 records)

**Example:**
```typescript
// Source: React controlled component patterns
import { useState } from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <input
      type="search"
      inputMode="search"  // Mobile keyboard with search button
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || 'Search by name or context...'}
      autoCapitalize="none"
      className="search-input"
    />
  );
}
```

### Pattern 5: Mobile-Optimized Result List
**What:** Touch-friendly list items with clear visual hierarchy and tap targets
**When to use:** Any mobile-first list display

**Example:**
```css
/* Source: Mobile UX best practices research */
.context-group {
  margin-bottom: 1.5rem;
}

.context-header {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #666;
  padding: 0.5rem 1rem;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
  position: sticky;
  top: 0;
  z-index: 1;
}

.person-list-item {
  min-height: 44px;  /* Apple HIG minimum touch target */
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
}

.person-list-item:active {
  background: #f0f0f0;  /* Touch feedback */
}
```

### Anti-Patterns to Avoid
- **Debouncing search input for small datasets:** Adds perceived lag, unnecessary for <1000 records. Only debounce if filtering takes >50ms.
- **Server-side search for local data:** Network latency kills "instant" feel. Keep search client-side.
- **Showing all results ungrouped:** Overwhelming on mobile. Group by context for visual hierarchy.
- **Custom fuzzy matching algorithms:** Fuse.js is 3KB and battle-tested. Don't hand-roll.
- **Loading contexts on every render:** Use useLiveQuery to cache and auto-update.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fuzzy search algorithm | Custom Levenshtein distance, substring matching logic | Fuse.js library | Edge cases: multi-word queries, scoring/ranking, threshold tuning. Battle-tested with 438K weekly downloads. |
| Array grouping utility | Custom reduce function in multiple places | Single groupByContext helper function | DRY principle, easier to test, consistent behavior |
| Distinct values query | Complex Dexie query to avoid duplicates | Load all, deduplicate in JS with Set | For small datasets (<500 records), simpler and faster. Dexie's distinct() is for multi-entry indexes. |
| Search result highlighting | Manual string replacement to bold matches | Fuse.js match indices or simple solution (Phase 3 doesn't require highlighting) | Complex to handle overlapping matches, word boundaries, HTML escaping |

**Key insight:** For datasets under 1000 records, client-side JavaScript array operations outperform complex database queries. Entire dataset loads in <50ms and fits in memory (<1MB). Optimize for code simplicity, not premature database optimization.

## Common Pitfalls

### Pitfall 1: Fuse.js Threshold Too Strict or Too Loose
**What goes wrong:** Threshold 0.1 misses valid matches with typos ("Pauls party" doesn't find "Paul's Party"). Threshold 0.8 returns irrelevant results.
**Why it happens:** Default threshold is 0.6 (too loose for small datasets), developers don't test with realistic typos.
**How to avoid:**
- Start with threshold 0.4 (good balance for names/contexts)
- Test with common typos: missing apostrophes, wrong capitalization, transposed letters
- If users report "can't find X", lower threshold to 0.5
- If too many irrelevant results, tighten to 0.3
**Warning signs:** User feedback "search doesn't work" or "too many wrong results"

**Prevention example:**
```typescript
// GOOD: Conservative threshold with testing
const fuse = new Fuse(people, {
  keys: ['context', 'name'],
  threshold: 0.4,  // Tested with typos: "Pauls party", "sara chen"
  minMatchCharLength: 2
});

// BAD: Default threshold, untested
const fuse = new Fuse(people, {
  keys: ['context', 'name']
  // threshold: 0.6 (default) - too loose
});
```

### Pitfall 2: Re-creating Fuse Instance on Every Render
**What goes wrong:** Search becomes sluggish because Fuse instance is recreated hundreds of times during typing.
**Why it happens:** Forgetting to memoize Fuse instance, or memoizing with wrong dependencies.
**How to avoid:**
- Use useMemo with people array as dependency
- Fuse instance creation is expensive (builds index), but search is fast
- Only recreate when underlying data changes
**Warning signs:** Performance profiler shows high CPU during search typing, lag between keystrokes

**Prevention example:**
```typescript
// GOOD: Memoized Fuse instance
const fuse = useMemo(() => {
  return new Fuse(people, options);
}, [people]); // Only recreate when people array changes

// BAD: New instance every render
function SearchComponent({ people }) {
  const fuse = new Fuse(people, options); // Recreated every keystroke!
  // ...
}
```

### Pitfall 3: Search on Every Keystroke Without Optimization
**What goes wrong:** For large datasets (500+ records), typing becomes laggy because search runs synchronously on main thread.
**Why it happens:** Assuming client-side search is always instant, not testing with realistic data volume.
**How to avoid:**
- For this project: 50-200 people = instant search works fine
- If search takes >50ms: add useMemo for results, consider debouncing
- If dataset grows to 1000+: use Web Worker for search or virtualize results
- Measure search performance with realistic dataset
**Warning signs:** Input lag during typing, browser freezes momentarily on keystroke

**Mitigation example:**
```typescript
// GOOD: Memoized results (avoid re-searching if query unchanged)
const results = useMemo(() => {
  if (!query.trim()) return people;
  return fuse.search(query).map(r => r.item);
}, [query, fuse, people]);

// For datasets >500, add debouncing:
const debouncedQuery = useDebounce(query, 150);
const results = useMemo(() => {
  if (!debouncedQuery.trim()) return people;
  return fuse.search(debouncedQuery).map(r => r.item);
}, [debouncedQuery, fuse, people]);
```

### Pitfall 4: Not Handling Empty Search State
**What goes wrong:** Blank search shows no results instead of all people, or shows "no results" message incorrectly.
**Why it happens:** Forgetting to check for empty query before filtering.
**How to avoid:**
- Empty query = show all results (or show context browse view)
- Trim whitespace before checking emptiness
- Distinguish between "empty query" and "no matches for query"
**Warning signs:** User reports "nothing shows when I clear search"

**Prevention example:**
```typescript
// GOOD: Handle empty query explicitly
const results = useMemo(() => {
  if (!query.trim()) {
    return people; // Show all when search is empty
  }
  const matches = fuse.search(query).map(r => r.item);
  return matches;
}, [query, fuse, people]);

// In component:
{results.length === 0 && query.trim() && (
  <p>No matches for "{query}"</p>
)}
{results.length === 0 && !query.trim() && (
  <p>Start typing to search...</p>
)}

// BAD: Doesn't distinguish empty query from no results
{results.length === 0 && <p>No results</p>}
```

### Pitfall 5: Context List Not Updating When People Added/Deleted
**What goes wrong:** User adds new person with new context, but context doesn't appear in browse list until page refresh.
**Why it happens:** Context list is computed once and never refreshes, or doesn't use useLiveQuery.
**How to avoid:**
- Use useLiveQuery for contexts (auto-updates when people table changes)
- If computing manually, include people array in dependencies
- Test by adding person with new context and verifying it appears immediately
**Warning signs:** Context list becomes stale, requires page refresh to update

**Prevention example:**
```typescript
// GOOD: useLiveQuery auto-updates
export function useContexts() {
  return useLiveQuery(async () => {
    const people = await db.people.toArray();
    const contexts = [...new Set(people.map(p => p.context))];
    return contexts.sort();
  }, []); // Empty deps - queries database reactively
}

// ALSO GOOD: Manual with proper dependencies
export function useContexts(people: Person[]) {
  return useMemo(() => {
    const contexts = [...new Set(people.map(p => p.context))];
    return contexts.sort();
  }, [people]); // Recomputes when people changes
}

// BAD: Computed once, never updates
const contexts = [...new Set(people.map(p => p.context))];
```

### Pitfall 6: Mobile Keyboard Covers Search Results
**What goes wrong:** User types in search input, keyboard appears and covers all results. Can't see what they're searching.
**Why it happens:** Search input positioned at bottom, or results positioned below keyboard line.
**How to avoid:**
- Position search input at top of screen (keyboard pushes content up, not covering)
- Use viewport units (svh) to account for keyboard
- Test on actual mobile devices (iOS Safari and Android Chrome)
- Never use position: fixed for search input on mobile
**Warning signs:** QA reports "can't see results while typing on mobile"

**Prevention example:**
```css
/* GOOD: Search at top, results below, keyboard pushes up */
.search-view {
  display: flex;
  flex-direction: column;
  height: 100svh;
}

.search-input-container {
  padding: 1rem;
  border-bottom: 1px solid #ddd;
  /* Not fixed - scrolls with content */
}

.results-container {
  flex: 1;
  overflow-y: auto;
}

/* BAD: Fixed positioning on mobile */
.search-input-container {
  position: fixed;
  bottom: 0;  /* Keyboard will cover this */
}
```

## Code Examples

Verified patterns from official sources:

### Complete Search Hook with Fuse.js
```typescript
// Source: Fuse.js official docs + React patterns
import Fuse from 'fuse.js';
import { useMemo, useState } from 'react';
import { Person } from '../types/Person';

export function useSearch(people: Person[]) {
  const [query, setQuery] = useState('');

  // Memoize Fuse instance (expensive to create)
  const fuse = useMemo(() => {
    return new Fuse(people, {
      keys: [
        { name: 'context', weight: 2 },  // Prioritize context matches
        { name: 'name', weight: 1 }
      ],
      threshold: 0.4,          // Balance typo tolerance and relevance
      ignoreLocation: true,    // Match anywhere in string
      minMatchCharLength: 2,   // Require 2+ characters
      shouldSort: true         // Sort by relevance score
    });
  }, [people]);

  // Search results - instant filtering
  const results = useMemo(() => {
    if (!query.trim()) return people;
    return fuse.search(query).map(result => result.item);
  }, [query, fuse, people]);

  return { query, setQuery, results };
}
```

### Context Browse Hook
```typescript
// Source: Dexie patterns + React hooks
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';

export interface ContextWithCount {
  context: string;
  count: number;
}

export function useContexts(): ContextWithCount[] | undefined {
  return useLiveQuery(async () => {
    const people = await db.people.toArray();

    // Count people per context
    const counts = people.reduce((acc, person) => {
      acc[person.context] = (acc[person.context] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Convert to sorted array
    return Object.entries(counts)
      .map(([context, count]) => ({ context, count }))
      .sort((a, b) => a.context.localeCompare(b.context));
  }, []);
}
```

### Grouped Results Component
```typescript
// Source: Mobile UX patterns + React
import { Person } from '../types/Person';

interface GroupedResultsProps {
  results: Person[];
  onPersonClick?: (person: Person) => void;
}

export function GroupedResults({ results, onPersonClick }: GroupedResultsProps) {
  // Group by context
  const grouped = results.reduce((acc, person) => {
    if (!acc[person.context]) {
      acc[person.context] = [];
    }
    acc[person.context].push(person);
    return acc;
  }, {} as Record<string, Person[]>);

  const contexts = Object.keys(grouped).sort();

  if (results.length === 0) {
    return <p className="empty-state">No results found</p>;
  }

  return (
    <div className="grouped-results">
      {contexts.map(context => (
        <section key={context} className="context-group">
          <h3 className="context-header">{context}</h3>
          <ul className="person-list">
            {grouped[context].map(person => (
              <li
                key={person.id}
                className="person-list-item"
                onClick={() => onPersonClick?.(person)}
              >
                <span className="person-name">{person.name}</span>
                {person.notes && (
                  <span className="person-notes">{person.notes}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
```

### Search View Component
```typescript
// Source: React patterns + mobile UX
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { useSearch } from '../hooks/useSearch';
import { SearchInput } from '../components/SearchInput';
import { GroupedResults } from '../components/GroupedResults';

export function SearchView() {
  const people = useLiveQuery(() => db.people.toArray());
  const { query, setQuery, results } = useSearch(people || []);

  if (!people) {
    return <div>Loading...</div>;
  }

  return (
    <div className="search-view">
      <div className="search-input-container">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search by name or context..."
        />
      </div>
      <div className="results-container">
        {query.trim() ? (
          <GroupedResults results={results} />
        ) : (
          <p className="hint">Start typing to search names and contexts</p>
        )}
      </div>
    </div>
  );
}
```

### Context Browse Component
```typescript
// Source: Mobile list patterns
import { useContexts } from '../hooks/useContexts';
import { useNavigate } from 'react-router'; // Assuming React Router for navigation

export function ContextBrowseView() {
  const contexts = useContexts();
  const navigate = useNavigate();

  if (!contexts) {
    return <div>Loading...</div>;
  }

  if (contexts.length === 0) {
    return (
      <div className="empty-state">
        <p>No contexts yet. Add your first person to get started!</p>
      </div>
    );
  }

  return (
    <div className="context-browse-view">
      <h2>Browse by Context</h2>
      <ul className="context-list">
        {contexts.map(({ context, count }) => (
          <li
            key={context}
            className="context-list-item"
            onClick={() => navigate(`/context/${encodeURIComponent(context)}`)}
          >
            <span className="context-name">{context}</span>
            <span className="context-count">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server-side search for small datasets | Client-side with Fuse.js | 2018+ (as browsers became faster) | Zero latency, works offline, no backend needed for <10K records |
| Exact string matching | Fuzzy search with typo tolerance | Always available, popularized 2015+ | Better UX, finds results despite typos, "Pauls party" finds "Paul's Party" |
| Debounce all search inputs | No debouncing for client-side <1000 records | 2020+ (modern device performance) | Instant feedback, simpler code, no perceived lag |
| Custom groupBy functions everywhere | Native Object.groupBy (ES2024) or simple reduce | ES2024 (Node 21+, Chrome 117+) | For this project: use reduce (wider support), upgrade to Object.groupBy when baseline |
| Algolia/Elasticsearch for everything | Use only when needed (10K+ records, advanced features) | Ongoing trend: right-size solutions | Simpler stack, no costs, faster for small datasets |

**Deprecated/outdated:**
- **Lunr.js for client-side search:** Still works but heavier than Fuse.js (9KB vs 3KB). Fuse.js has better TypeScript support and active maintenance.
- **Manual Levenshtein distance algorithms:** Fuse.js handles this internally with better scoring. Don't hand-roll.
- **IndexedDB full-text search:** Not standardized, browser support inconsistent. Client-side JS search is simpler and faster for small datasets.

## Open Questions

1. **Should search also include notes field?**
   - What we know: Fuse.js can search multiple fields with weights
   - What's unclear: Are notes useful for context lookup, or just noise?
   - Recommendation: Start with name + context only. Add notes in v2 if users request "can't find person by notes"

2. **Should context browse show most recent or most used contexts first?**
   - What we know: Alphabetical is easiest to scan on mobile
   - What's unclear: User mental model - recent events or frequency?
   - Recommendation: Start with alphabetical (predictable, easy to find). Add "sort by recent" option if users want it.

3. **Should empty search state show anything or just be blank?**
   - What we know: Mobile UX patterns suggest showing hint text or recent searches
   - What's unclear: What's most helpful for this use case?
   - Recommendation: Show hint text "Start typing to search..." and consider showing recently viewed people (tracks engagement).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + jsdom |
| Config file | vitest.config.ts (merged with vite.config.ts) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test -- --run --coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LOOK-01 | Search by context finds names instantly (<100ms) | integration | `npm test -- tests/hooks/useSearch.test.ts --run` | ❌ Wave 0 |
| LOOK-01 | Fuzzy matching handles typos (missing apostrophe, wrong case) | unit | `npm test -- tests/hooks/useSearch.test.ts --run` | ❌ Wave 0 |
| LOOK-02 | Browse shows distinct contexts sorted alphabetically | integration | `npm test -- tests/hooks/useContexts.test.ts --run` | ❌ Wave 0 |
| LOOK-02 | Context counts match actual people count | unit | `npm test -- tests/hooks/useContexts.test.ts --run` | ❌ Wave 0 |
| LOOK-03 | Tapping context filters to people from that context | integration | `npm test -- tests/views/ContextBrowseView.test.tsx --run` | ❌ Wave 0 |
| LOOK-04 | Search multiple contexts shows grouped results | integration | `npm test -- tests/components/GroupedResults.test.tsx --run` | ❌ Wave 0 |
| LOOK-04 | Grouped results sorted by context name | unit | `npm test -- tests/utils/groupByContext.test.ts --run` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run` (all tests, fast mode)
- **Per wave merge:** `npm test -- --run --coverage` (with coverage report)
- **Phase gate:** Full suite green + manual mobile device testing before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/hooks/useSearch.test.ts` — covers LOOK-01 (instant search, fuzzy matching, performance)
- [ ] `tests/hooks/useContexts.test.ts` — covers LOOK-02 (distinct contexts, counts, sorting)
- [ ] `tests/components/GroupedResults.test.tsx` — covers LOOK-04 (grouped display)
- [ ] `tests/views/SearchView.test.tsx` — covers LOOK-01 (search integration)
- [ ] `tests/views/ContextBrowseView.test.tsx` — covers LOOK-02, LOOK-03 (browse and filter)
- [ ] `tests/utils/groupByContext.test.ts` — unit tests for grouping utility
- [ ] Update `package.json` — add fuse.js dependency if not already present

## Sources

### Primary (HIGH confidence)
- [Fuse.js API Options](https://www.fusejs.io/api/options.html) - Official threshold, keys, and configuration documentation
- [Fuse.js Scoring Theory](https://www.fusejs.io/concepts/scoring-theory.html) - How fuzzy matching scores work
- [Dexie Collection.distinct()](https://dexie.org/docs/Collection/Collection.distinct()) - Distinct values method documentation
- [React controlled component patterns](https://react.wiki/components/controlled-vs-uncontrolled/) - Controlled input state management

### Secondary (MEDIUM confidence)
- [Implementing client-side search in React with Fuse.js](https://www.daily.co/blog/implementing-client-side-search-in-a-react-app-with-fuse-js/) - React integration patterns
- [Mastering Fuzzy Search with Fuse.js: A Comprehensive Guide](https://codestax.medium.com/mastering-fuzzy-search-with-fuse-js-a-comprehensive-guide-7c711cace162) - Threshold tuning and configuration
- [Using Fuse.js with React to build an advanced search](https://dev.to/noclat/using-fuse-js-with-react-to-build-an-advanced-search-with-highlighting-4b93) - React hooks pattern for Fuse.js
- [Master Search UX in 2026: Best Practices](https://www.designmonks.co/blog/search-ux-best-practices) - Mobile search UX patterns
- [Mobile search UX best practices, part 3: Optimizing display of search results](https://www.algolia.com/blog/ux/mobile-search-ux-part-three-seach-results-display) - Grouped results patterns
- [Building a Real-Time Search Filter in React](https://dev.to/alais29dev/building-a-real-time-search-filter-in-react-a-step-by-step-guide-3lmm) - Instant filtering implementation
- [React Performance Optimization: 15 Best Practices for 2025](https://dev.to/alex_bobes/react-performance-optimization-15-best-practices-for-2025-17l9) - Performance thresholds (100ms FID)
- [Syncfusion React ListView Grouping](https://ej2.syncfusion.com/react/documentation/listview/grouping) - Grouped list implementation patterns
- [Mobile Design Pattern Gallery: Search, Sort, and Filter](https://www.oreilly.com/library/view/mobile-design-pattern/9781449368586/ch04.html) - Mobile list navigation patterns

### Tertiary (LOW confidence)
- [React InstantSearch - Algolia](https://www.algolia.com/doc/guides/building-search-ui/what-is-instantsearch/react) - Alternative approach (server-side), validated for comparison only

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Fuse.js is industry standard (438K weekly downloads), verified official docs, patterns tested in project stack
- Architecture: HIGH - Patterns verified with official Fuse.js and Dexie docs, React patterns well-established
- Pitfalls: MEDIUM-HIGH - Threshold tuning is empirical (needs testing with real data), performance thresholds from multiple sources
- Mobile UX: MEDIUM - Grouped results pattern well-documented, but mobile keyboard interaction needs device testing
- Performance: HIGH - 100ms threshold verified in multiple 2026 sources, client-side search benchmarks consistent

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (30 days - stable domain, Fuse.js and React patterns change slowly)
