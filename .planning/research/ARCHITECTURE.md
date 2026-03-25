# Architecture Research

**Domain:** Mobile-first personal utility app (flashcard/lookup with local storage)
**Researched:** 2026-03-05
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      UI Layer (Views)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  Entry  │  │ Lookup  │  │  Quiz   │  │ Browse  │        │
│  │  Form   │  │  View   │  │  View   │  │  View   │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │              │
├───────┴────────────┴────────────┴────────────┴──────────────┤
│                   State Management Layer                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │    Hooks (useState/useReducer/useContext)           │    │
│  │    - People state                                   │    │
│  │    - Quiz state                                     │    │
│  │    - Filter state                                   │    │
│  └───────────────────┬─────────────────────────────────┘    │
│                      ↓                                       │
├─────────────────────────────────────────────────────────────┤
│                     Data Layer                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │             IndexedDB (via Dexie.js)                 │   │
│  │  - People table (name, context, notes, learned)     │   │
│  │  - Metadata table (settings, app state)             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **UI Views** | Render pages, capture user input, display data | React functional components with hooks |
| **State Management** | Hold current app state, handle user actions | Custom hooks + Context API or simple useState |
| **Data Layer** | Persist data locally, query/filter records | IndexedDB wrapper (Dexie.js) with async API |
| **Service Worker** | Enable offline-first, cache static assets | PWA service worker with cache-first strategy |
| **Router** | Navigate between views | React Router (or framework built-in) |

## Recommended Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── PersonForm.tsx    # Entry form for adding names
│   ├── PersonCard.tsx    # Display person details
│   ├── QuizCard.tsx      # Flashcard display for quiz mode
│   └── ContextList.tsx   # List of contexts for browsing
├── views/                # Page-level components
│   ├── EntryView.tsx     # Quick entry page
│   ├── LookupView.tsx    # Search/browse page
│   ├── QuizView.tsx      # Quiz mode page
│   └── SettingsView.tsx  # App settings (optional)
├── hooks/                # Custom React hooks
│   ├── usePeople.ts      # CRUD operations for people
│   ├── useQuiz.ts        # Quiz logic and state
│   └── useContexts.ts    # Context browsing/filtering
├── db/                   # Database layer
│   ├── schema.ts         # Dexie.js schema definition
│   ├── database.ts       # Database instance
│   └── migrations.ts     # Schema migrations (if needed)
├── types/                # TypeScript types
│   └── index.ts          # Person, Context, Quiz types
├── utils/                # Helper functions
│   └── search.ts         # Search/filter logic
├── App.tsx               # Root component with routing
└── main.tsx              # Entry point
```

### Structure Rationale

- **components/:** Presentational components that receive data via props. Reusable, testable, no direct database access.
- **views/:** Page-level components that compose multiple components and connect to state/data hooks. Each view represents a route.
- **hooks/:** Custom hooks encapsulate business logic and data operations, keeping views simple. Follows React's "composition over inheritance" principle.
- **db/:** Centralized database layer. Dexie.js provides a Promise-based wrapper around IndexedDB, making it easier to work with than raw IndexedDB API.
- **types/:** TypeScript definitions for domain objects ensure type safety across the app.

## Architectural Patterns

### Pattern 1: Local-First Architecture

**What:** The local device (browser IndexedDB) is the authoritative data source. No backend required. All operations happen instantly on-device.

**When to use:** Personal utility apps with low data volume (this app: ~10-50 people per month), no collaboration needs, and single-user usage.

**Trade-offs:**
- Pros: Zero latency, works offline, no server costs, immediate UX, simple architecture
- Cons: Data not portable across devices (unless you add sync later), storage limited to device capacity

**Example:**
```typescript
// db/database.ts
import Dexie, { Table } from 'dexie';

export interface Person {
  id?: number;
  name: string;
  context: string;
  notes?: string;
  learned: boolean;
  createdAt: Date;
}

export class NameHelprDatabase extends Dexie {
  people!: Table<Person>;

  constructor() {
    super('NameHelprDB');
    this.version(1).stores({
      people: '++id, name, context, learned, createdAt'
    });
  }
}

export const db = new NameHelprDatabase();
```

### Pattern 2: Custom Hooks for Data Operations

**What:** Encapsulate database operations in custom hooks that return data and CRUD functions. Components use hooks to access data without knowing about IndexedDB.

**When to use:** React apps where you want to separate data logic from UI rendering. Follows React's composition model.

**Trade-offs:**
- Pros: Testable in isolation, reusable across components, easy to swap data layer later
- Cons: Slightly more boilerplate than direct database calls in components

**Example:**
```typescript
// hooks/usePeople.ts
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Person } from '../db/database';

export function usePeople() {
  // useLiveQuery automatically re-renders when data changes
  const people = useLiveQuery(() => db.people.toArray());

  const addPerson = async (person: Omit<Person, 'id'>) => {
    await db.people.add({ ...person, createdAt: new Date() });
  };

  const updatePerson = async (id: number, updates: Partial<Person>) => {
    await db.people.update(id, updates);
  };

  const deletePerson = async (id: number) => {
    await db.people.delete(id);
  };

  const searchByContext = async (contextQuery: string) => {
    return db.people
      .filter(p => p.context.toLowerCase().includes(contextQuery.toLowerCase()))
      .toArray();
  };

  return { people, addPerson, updatePerson, deletePerson, searchByContext };
}
```

### Pattern 3: Unidirectional Data Flow

**What:** State flows down from hooks to components (via props/context), and events flow up (via callbacks). UI never modifies data directly.

**When to use:** All React apps following modern best practices. Ensures predictable state updates and easier debugging.

**Trade-offs:**
- Pros: Testable (UI and state separate), predictable behavior, easy to trace bugs
- Cons: Slightly more verbose than two-way binding

**Example:**
```typescript
// views/QuizView.tsx
import { useState } from 'react';
import { usePeople } from '../hooks/usePeople';
import { QuizCard } from '../components/QuizCard';

export function QuizView() {
  const { people } = usePeople();
  const [currentIndex, setCurrentIndex] = useState(0);

  // State flows down
  const unlearnedPeople = people?.filter(p => !p.learned) || [];
  const currentPerson = unlearnedPeople[currentIndex];

  // Events flow up
  const handleNext = () => {
    setCurrentIndex((currentIndex + 1) % unlearnedPeople.length);
  };

  return (
    <QuizCard
      person={currentPerson}
      onNext={handleNext}
    />
  );
}
```

### Pattern 4: Component Composition (Container/Presentational)

**What:** Separate "smart" components (views that connect to data) from "dumb" components (presentational components that only receive props).

**When to use:** Any React app. Promotes reusability and testability.

**Trade-offs:**
- Pros: Presentational components are pure, easily tested, reusable
- Cons: More files/components to manage

**Example:**
```typescript
// components/PersonCard.tsx (Presentational)
interface PersonCardProps {
  person: Person;
  onToggleLearned: (id: number) => void;
}

export function PersonCard({ person, onToggleLearned }: PersonCardProps) {
  return (
    <div className="person-card">
      <h3>{person.name}</h3>
      <p>Met at: {person.context}</p>
      {person.notes && <p>{person.notes}</p>}
      <button onClick={() => onToggleLearned(person.id!)}>
        {person.learned ? 'Mark Unlearned' : 'Mark Learned'}
      </button>
    </div>
  );
}

// views/LookupView.tsx (Container)
export function LookupView() {
  const { people, updatePerson } = usePeople();

  const handleToggleLearned = async (id: number) => {
    const person = people?.find(p => p.id === id);
    if (person) {
      await updatePerson(id, { learned: !person.learned });
    }
  };

  return (
    <div>
      {people?.map(person => (
        <PersonCard
          key={person.id}
          person={person}
          onToggleLearned={handleToggleLearned}
        />
      ))}
    </div>
  );
}
```

## Data Flow

### Request Flow (CRUD Operations)

```
[User Action: Add Person]
    ↓
[EntryView] → [Form Submit Handler] → [usePeople.addPerson()] → [db.people.add()]
                                                                        ↓
                                                                  [IndexedDB]
                                                                        ↓
                                                              [Dexie.js Observer]
                                                                        ↓
                                                                [useLiveQuery]
                                                                        ↓
                                                            [Component Re-renders]
```

### State Management

```
[IndexedDB (Source of Truth)]
         ↓
    [Dexie.js]
         ↓
  [useLiveQuery Hook] ← subscribes to changes
         ↓
   [Component State]
         ↓
    [UI Renders]
         ↑
   [User Action]
         ↓
  [CRUD Function]
         ↓
    [Dexie.js]
         ↓
[IndexedDB Updated] → triggers useLiveQuery → re-render
```

### Key Data Flows

1. **Entry Flow:** User fills form → submit handler calls `addPerson()` → Dexie inserts to IndexedDB → `useLiveQuery` detects change → all subscribed components re-render with new data.

2. **Search Flow:** User types in search field → debounced onChange calls `searchByContext()` → Dexie queries IndexedDB with filter → results returned → UI updates.

3. **Quiz Flow:** Quiz view loads unlearned people from `usePeople()` → displays one at a time → user marks learned → `updatePerson()` called → IndexedDB updated → quiz list refreshes.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k people | Current architecture is perfect. IndexedDB can easily handle this. No optimization needed. |
| 1k-10k people | Consider indexing frequently-searched fields (context already indexed). Add pagination for browse view. Query performance still excellent. |
| 10k+ people | Unlikely for personal use case, but if needed: implement virtual scrolling for lists, optimize search with fuzzy matching library, consider full-text search index. |

### Scaling Priorities

1. **First bottleneck:** UI rendering long lists (1000+ items). Fix with virtualization (react-window) to only render visible items.
2. **Second bottleneck:** Search performance on large datasets. Fix with full-text search index or move to a more powerful local database like SQLite (via sql.js or absurd-sql).

**Note:** This app's use case (1-10 new people per month) means these bottlenecks are theoretical. Premature optimization unnecessary.

## Anti-Patterns

### Anti-Pattern 1: Prop Drilling

**What people do:** Pass data through many component layers to reach deeply nested components.

**Why it's wrong:** Makes components rigid, hard to refactor, and tightly couples parent-child relationships.

**Do this instead:** Use Context API for app-level state (like current user settings) or keep component trees shallow. For this simple app, shallow trees are sufficient.

### Anti-Pattern 2: Using LocalStorage for Structured Data

**What people do:** Store person objects as JSON strings in localStorage.

**Why it's wrong:** localStorage is synchronous (blocks UI), limited to ~5-10MB, no query capabilities, JSON serialization overhead.

**Do this instead:** Use IndexedDB (via Dexie.js) which is async, can store 100s of MB, supports indexes for fast queries, and handles structured data natively.

### Anti-Pattern 3: Building a Backend Too Early

**What people do:** Set up Express/Firebase/Supabase before validating the app works locally.

**Why it's wrong:** Adds complexity, deployment overhead, and costs before knowing if the app is useful. Most personal utility apps don't need sync.

**Do this instead:** Start local-first. Add backend sync only if user explicitly requests multi-device support after validating the core experience.

### Anti-Pattern 4: Over-Engineering State Management

**What people do:** Install Redux/MobX/Zustand for a simple CRUD app.

**Why it's wrong:** Unnecessary abstraction for apps with straightforward data flows. Adds learning curve and boilerplate.

**Do this instead:** Use `useState` for component state, custom hooks for shared logic, and Context API if you need global state (like theme/settings). Dexie's `useLiveQuery` handles reactive data updates automatically.

### Anti-Pattern 5: Not Using PWA Capabilities

**What people do:** Build a plain web app without PWA features (manifest, service worker).

**Why it's wrong:** Loses "mobile-first" benefits: installability, offline support, app-like feel, home screen icon.

**Do this instead:** Add a web app manifest (name, icons, theme) and a service worker with cache-first strategy for static assets. Most frameworks (Vite, Next.js) have PWA plugins that handle this.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| None (initially) | Local-first, no external dependencies | Keep it simple. Add sync later if needed. |
| Optional: Cloud sync | Implement CRDTs or last-write-wins strategy | Only if users request multi-device support. Use PouchDB + CouchDB or Firebase for easy setup. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| UI ↔ State | Props down, events up (unidirectional) | Standard React pattern. Components call hook functions, receive data via props/return values. |
| State ↔ Database | Async functions (Promise-based API) | Dexie.js wraps IndexedDB's transaction API. Custom hooks abstract this from UI. |
| Service Worker ↔ App | Message passing (postMessage API) | Service worker caches static assets. App doesn't need to interact with it directly in most cases. |

## Build Order Recommendations

Based on component dependencies, build in this order:

1. **Data Layer First:** Set up Dexie.js schema and basic CRUD operations. Test in browser console.
2. **Core Hooks:** Build `usePeople` hook with add/update/delete/query functions.
3. **Entry View:** Build the simplest view (add person form) to validate data layer works.
4. **Lookup View:** Build search/browse to validate queries work.
5. **Quiz View:** Build quiz logic once CRUD is solid.
6. **PWA Features:** Add manifest and service worker last (easy with Vite PWA plugin).

**Rationale:** Data layer is foundation. Entry view validates end-to-end flow early. Quiz is most complex, build it last when other pieces are stable.

## Sources

### High Confidence (Official Documentation + Recent Industry Articles)

- [Local-first web application architecture](https://plainvanillaweb.com/blog/articles/2025-07-16-local-first-architecture/) - Comprehensive guide to local-first patterns
- [Offline-first frontend apps in 2025: IndexedDB and SQLite](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/) - Current best practices for local storage
- [Dexie.js - Build Offline-First Apps with IndexedDB](https://dexie.org/) - Official IndexedDB wrapper documentation
- [React Architecture Patterns and Best Practices for 2026](https://www.bacancytechnology.com/blog/react-architecture-patterns-and-best-practices) - Current React patterns
- [Progressive Web Apps (PWA) Best Practices for 2026](https://wirefuture.com/post/progressive-web-apps-pwa-best-practices-for-2026) - Modern PWA architecture
- [Guide to app architecture | Android Developers](https://developer.android.com/topic/architecture) - Official unidirectional data flow documentation
- [React Folder Structure in 5 Steps [2025]](https://www.robinwieruch.de/react-folder-structure/) - Project organization best practices

### Medium Confidence (Community Consensus)

- [Build a Flashcard Quiz with React](https://nabendu82.medium.com/build-a-flashcard-quiz-with-react-c1cb96e3a1e8) - Flashcard app patterns
- [React Design Patterns | Refine](https://refine.dev/blog/react-design-patterns/) - Component composition patterns
- [How to Structure and Organize a React Application](https://www.taniarascia.com/react-architecture-directory-structure/) - Practical folder structure guide

---
*Architecture research for: NameHelpr - Mobile-first personal name-remembering app*
*Researched: 2026-03-05*
