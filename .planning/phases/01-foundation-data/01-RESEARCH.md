# Phase 1: Foundation & Data - Research

**Researched:** 2026-03-05
**Domain:** IndexedDB local storage, PWA implementation, offline-first architecture
**Confidence:** HIGH

## Summary

Phase 1 establishes the foundation for NameHelpr as an offline-first PWA targeting Android Chrome. The standard stack consists of Vite 7 + React for the build system and UI, Dexie.js for IndexedDB management, and vite-plugin-pwa with Workbox 7 for service worker generation and PWA capabilities.

The research confirms that as of 2026, PWA technologies have fully matured with universal browser support for core APIs (service workers, Web App Manifest, Web Push). Tooling has significantly improved with Workbox 7 integrating natively into Vite build pipelines, making zero-config PWA setups practical for production use.

**Primary recommendation:** Use Dexie.js as the IndexedDB wrapper (not raw IndexedDB or idb) because this phase will grow to include complex queries in Phase 3 (search/lookup), and Dexie provides reactive hooks for React integration, robust schema versioning, and a fluent API that prevents common IndexedDB pitfalls.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Platform:** Android-only initially — no iOS Safari storage handling needed
- **Target browser:** Chrome on Android
- **PWA Install Experience:** Browser default install prompt — no custom UI for v1
- **Install prompt behavior:** Let Chrome show its standard "Add to Home Screen" banner
- **Future enhancement:** Can add custom install button in future if users aren't discovering install
- **App Icon:** Text-based icon: "NHr" (N and H uppercase, r lowercase)
- **Icon style:** Clean, recognizable, easy to generate
- **Splash Screen:** NHr icon centered with "NameHelpr" text below
- **Splash approach:** Standard PWA approach

### Claude's Discretion
- **Color scheme:** Color scheme for icon and splash screen (pick something modern that works well on home screens)
- **Empty state design:** What shows when app first opens with no data
- **Offline indicator approach:** Whether/how to show offline status
- **Loading states and transitions**

### Deferred Ideas (OUT OF SCOPE)
- **iOS support:** May add later but not for v1
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | User data persists in IndexedDB across sessions | Dexie.js with schema versioning provides robust persistence; browser storage quotas confirmed adequate (10GB+ typical) |
| DATA-02 | User can add a new person with name, context, and optional notes | Dexie transaction patterns support ACID-compliant adds; React hooks enable reactive UI updates |
| DATA-03 | User can edit an existing person's details | Dexie `.put()` with complete object replacement pattern; must include all fields to avoid data loss |
| DATA-04 | User can delete a person | Dexie `.delete()` by primary key; transaction-based with automatic rollback on error |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Vite** | 7.x | Build tool and dev server | Industry standard for modern web apps in 2026; fast HMR, native ES modules, production-ready |
| **React** | 18.x | UI framework | Mature, widely adopted, excellent TypeScript support, hooks-based state management |
| **TypeScript** | 5.x | Type safety | Production requirement for maintainability; prevents runtime errors |
| **Dexie.js** | 4.x | IndexedDB wrapper | Fluent API, schema versioning, React hooks (`dexie-react-hooks`), prevents common pitfalls |
| **vite-plugin-pwa** | Latest | PWA generation | Zero-config Workbox 7 integration, automatic manifest/SW generation, Vite-native |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@vite-pwa/assets-generator** | Latest | Generate PWA icons/splash screens | One-time setup to create all icon sizes from single SVG |
| **fake-indexeddb** | Latest | IndexedDB testing mock | Unit tests in Node.js; avoids browser environment requirement |
| **Vitest** | 4.x | Test runner | Modern, Vite-native testing; browser mode for integration tests |
| **workbox-window** | 7.x | Service worker registration | If implementing custom update prompts (deferred for v1) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dexie.js | **idb** (jakearchibald) | Lighter (1KB vs Dexie's larger size) but minimal abstraction; choose if ONLY doing simple key-value storage with no complex queries |
| Dexie.js | **Raw IndexedDB** | Zero dependencies but verbose, error-prone, requires manual schema versioning; avoid unless optimizing bundle size to extreme |
| vite-plugin-pwa | **Manual Workbox setup** | Full control over service worker but requires deep Workbox knowledge; plugin handles 95% of use cases |
| Vitest | **Jest** | More mature ecosystem but slower, less Vite integration; Vitest is 2026 standard for Vite projects |

**Installation:**
```bash
npm create @vite-pwa/pwa@latest
# During interactive setup:
# - Framework: React
# - Variant: TypeScript
# - Register type: autoUpdate
```

Then add:
```bash
npm install dexie dexie-react-hooks
npm install -D fake-indexeddb vitest @vitest/browser @vitest/browser-webdriverio
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── db/                  # IndexedDB schemas and hooks
│   ├── schema.ts        # Dexie database schema definition
│   ├── hooks.ts         # React hooks wrapping Dexie queries (useLiveQuery)
│   └── migrations.ts    # Version upgrade handlers (if needed)
├── components/          # React components
│   ├── PersonForm.tsx   # Add/edit person
│   ├── PersonList.tsx   # Display all people
│   └── EmptyState.tsx   # No data fallback
├── types/               # TypeScript interfaces
│   └── Person.ts        # Person data model
├── utils/               # Utility functions
│   └── storage.ts       # Storage quota checks (navigator.storage.estimate)
├── App.tsx              # Root component
├── main.tsx             # Entry point with SW registration
└── vite-env.d.ts        # Vite type declarations
public/
├── manifest.webmanifest # PWA manifest (generated by plugin)
└── icons/               # PWA icons (generated from SVG)
```

### Pattern 1: Dexie Schema with Versioning
**What:** Define IndexedDB schema using Dexie's declarative syntax with version management
**When to use:** Initial database setup and all future schema changes
**Example:**
```typescript
// Source: https://dexie.org/docs/Tutorial/Migrating-existing-DB-to-Dexie
import Dexie, { Table } from 'dexie';

interface Person {
  id?: number;          // Auto-increment primary key
  name: string;
  context: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

class NameHelprDB extends Dexie {
  persons!: Table<Person>;

  constructor() {
    super('NameHelprDB');
    this.version(1).stores({
      persons: '++id, name, context, createdAt'
      // ++id = auto-increment primary key
      // name, context, createdAt = indexed columns
    });
  }
}

export const db = new NameHelprDB();
```

### Pattern 2: React Integration with useLiveQuery
**What:** Use Dexie's `useLiveQuery` hook to reactively query IndexedDB and auto-update UI
**When to use:** Any component that displays IndexedDB data
**Example:**
```typescript
// Source: https://dexie.org/docs/libs/dexie-react-hooks
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/schema';

export function PersonList() {
  const persons = useLiveQuery(
    () => db.persons.orderBy('createdAt').reverse().toArray()
  );

  if (!persons) return <div>Loading...</div>;
  if (persons.length === 0) return <EmptyState />;

  return (
    <ul>
      {persons.map(p => (
        <li key={p.id}>{p.name} - {p.context}</li>
      ))}
    </ul>
  );
}
```

### Pattern 3: CRUD Operations with Transactions
**What:** Wrap database writes in Dexie methods that automatically handle transactions
**When to use:** All create, update, delete operations
**Example:**
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
import { db } from './db/schema';

// Add (auto-generates ID)
async function addPerson(name: string, context: string, notes?: string) {
  const id = await db.persons.add({
    name,
    context,
    notes,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return id;
}

// Update (IMPORTANT: include ALL fields to avoid data loss)
async function updatePerson(id: number, updates: Partial<Person>) {
  const existing = await db.persons.get(id);
  if (!existing) throw new Error('Person not found');

  await db.persons.put({
    ...existing,        // Critical: merge with existing data
    ...updates,
    updatedAt: new Date()
  });
}

// Delete
async function deletePerson(id: number) {
  await db.persons.delete(id);
}
```

### Pattern 4: PWA Manifest Configuration
**What:** Configure web app manifest with required properties for Android Chrome installability
**When to use:** Initial PWA setup in vite.config.ts
**Example:**
```typescript
// Source: https://vite-pwa-org.netlify.app/guide/
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'NameHelpr',
        short_name: 'NameHelpr',
        description: 'Remember people by the context you met them',
        theme_color: '#4A90E2',  // Choose in Wave 0
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icons/192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'  // Android adaptive icons
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      }
    })
  ]
});
```

### Pattern 5: Storage Quota Monitoring
**What:** Check available storage and warn users before quota issues
**When to use:** App initialization and periodically during heavy writes
**Example:**
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
async function checkStorageQuota() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const { usage, quota } = await navigator.storage.estimate();
    const percentUsed = (usage! / quota!) * 100;

    console.log(`Storage: ${usage} bytes used of ${quota} bytes (${percentUsed.toFixed(2)}%)`);

    if (percentUsed > 80) {
      // Warn user: approaching storage limit
      return { warning: true, percentUsed };
    }
  }
  return { warning: false, percentUsed: 0 };
}
```

### Anti-Patterns to Avoid
- **Don't use localStorage for person records:** 5MB limit, synchronous API blocks UI, no complex queries, no transactions
- **Don't partially update objects with `.put()`:** Omitting fields erases them; always merge with existing data
- **Don't cache everything:** Over-caching slows app load; cache static assets (JS, CSS, fonts) but not API responses for this local-only app
- **Don't ignore QuotaExceededError:** Wrap writes in try/catch and handle gracefully
- **Don't skip `tx.done` checks:** Waiting for transaction completion prevents race conditions

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IndexedDB abstraction | Custom promise wrapper around IDBDatabase | **Dexie.js** | Schema versioning is deceptively complex; handling version conflicts across tabs requires blocked/versionchange events; Dexie handles this |
| Service worker caching | Manual fetch interceptors with Cache API | **vite-plugin-pwa + Workbox** | Cache invalidation strategies (stale-while-revalidate, network-first) are hard to get right; Workbox provides battle-tested strategies |
| PWA icon generation | Manual resizing in Photoshop/GIMP | **@vite-pwa/assets-generator** | Android requires 7+ icon sizes (48, 72, 96, 144, 192, 384, 512) plus maskable variants; generator creates all from one SVG |
| IndexedDB schema migration | Custom version checking logic | **Dexie version().stores()** | Cascading migrations (v1→v2→v3 for user on v1) require fall-through logic; easy to corrupt data with custom code |
| Offline detection | `navigator.onLine` event listeners | Built-in service worker behavior | `navigator.onLine` is unreliable (reports online even if server unreachable); SW fetch failures are true offline indicator |

**Key insight:** IndexedDB and service workers have many edge cases (multi-tab synchronization, version conflicts, quota errors, cache invalidation). Mature libraries like Dexie and Workbox have solved these; custom solutions will rediscover the same bugs.

## Common Pitfalls

### Pitfall 1: Partial Object Updates with `.put()`
**What goes wrong:** Developer calls `db.persons.put({ id: 1, name: 'New Name' })` to update name, but all other fields (context, notes, dates) are erased.
**Why it happens:** IndexedDB's `.put()` performs full record replacement, not field-level merging. It's not like SQL `UPDATE SET name = 'x'`.
**How to avoid:** Always fetch existing object first, merge changes, then put:
```typescript
const existing = await db.persons.get(id);
await db.persons.put({ ...existing, name: 'New Name', updatedAt: new Date() });
```
**Warning signs:** User reports data loss after editing; fields mysteriously become undefined.

### Pitfall 2: IndexedDB Version Conflicts (Multi-Tab)
**What goes wrong:** User has app open in two tabs. Tab 1 triggers a schema upgrade (new version). Tab 2's database connection blocks indefinitely, and app freezes.
**Why it happens:** IndexedDB prevents schema changes while other connections are open. The `onblocked` event fires but isn't handled.
**How to avoid:** Dexie handles this automatically, but if using raw IndexedDB, always implement `onblocked` and `onversionchange` handlers. Best practice: show "Please close other tabs" message.
**Warning signs:** App works perfectly in single tab but hangs when multiple tabs are open; Dexie shields you from this in most cases.

### Pitfall 3: Ignoring Service Worker Lifecycle
**What goes wrong:** Developer updates service worker code, but users keep seeing old cached version. Update doesn't take effect until they close ALL tabs and reopen.
**Why it happens:** Service workers activate only when no tabs are using the old version. The new SW enters "waiting" state.
**How to avoid:** Use `vite-plugin-pwa` with `registerType: 'autoUpdate'` which calls `skipWaiting()` automatically. For v1, this is sufficient. For v2+, add custom "Update Available" prompt.
**Warning signs:** Bug fixes deployed but not appearing for users; "hard refresh" fixes it.

### Pitfall 4: Testing PWA in Dev Mode
**What goes wrong:** Developer tests `npm run dev` and PWA features don't work (no install prompt, no offline mode).
**Why it happens:** vite-plugin-pwa disables PWA in dev mode for performance; service workers only activate in production build.
**How to avoid:** Always test with `npm run build && npm run preview`. Use `devOptions: { enabled: true }` in plugin config if testing during dev (slows HMR).
**Warning signs:** Install prompt never appears; service worker shows as "Not registered" in DevTools.

### Pitfall 5: Insufficient IndexedDB Error Handling
**What goes wrong:** Write operation fails silently (quota exceeded, constraint violation) and user loses data without knowing.
**Why it happens:** Developers forget IndexedDB operations are promises that can reject; no try/catch around `.add()`, `.put()`, `.delete()`.
**How to avoid:** Wrap all write operations in try/catch and show user-friendly errors:
```typescript
try {
  await db.persons.add({ name, context });
} catch (err) {
  if (err.name === 'QuotaExceededError') {
    alert('Storage full. Please delete old entries.');
  } else {
    console.error('Save failed:', err);
    alert('Could not save. Please try again.');
  }
}
```
**Warning signs:** User reports "data didn't save" but no error message appeared.

### Pitfall 6: Wrong Caching Strategy
**What goes wrong:** Developer uses `CacheFirst` for all resources. App never updates even when new version deployed.
**Why it happens:** Misunderstanding Workbox caching strategies. `CacheFirst` serves cache without network check.
**How to avoid:**
  - Static assets (JS, CSS, fonts): `CacheFirst` ✅
  - HTML: `NetworkFirst` or precache with revision hashing ✅
  - API calls: Don't cache (this app is local-only) ✅
**Warning signs:** App stuck on old version; manifest changes not reflected.

### Pitfall 7: Not Handling Storage Eviction
**What goes wrong:** User runs low on disk space. Browser evicts IndexedDB data. User opens app and all their data is gone.
**Why it happens:** Best-effort storage (default) can be evicted under storage pressure. Developer didn't request persistent storage.
**How to avoid:**
  - For v1: Accept eviction risk (users on modern Android typically have 10GB+ quota, eviction is rare)
  - For future: Request persistent storage with `navigator.storage.persist()`
  - Always show storage status: `navigator.storage.estimate()`
**Warning signs:** User reports "all my data disappeared" (rare but catastrophic).

## Code Examples

Verified patterns from official sources:

### Complete Dexie Setup with TypeScript
```typescript
// src/db/schema.ts
// Source: https://dexie.org/docs/Tutorial/Migrating-existing-DB-to-Dexie
import Dexie, { Table } from 'dexie';

export interface Person {
  id?: number;
  name: string;
  context: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class NameHelprDB extends Dexie {
  persons!: Table<Person>;

  constructor() {
    super('NameHelprDB');
    this.version(1).stores({
      persons: '++id, name, context, createdAt'
    });
  }
}

export const db = new NameHelprDB();
```

### React Hook for Person CRUD
```typescript
// src/db/hooks.ts
// Source: https://dexie.org/docs/libs/dexie-react-hooks
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Person } from './schema';

export function usePersons() {
  const persons = useLiveQuery(
    () => db.persons.orderBy('createdAt').reverse().toArray()
  );

  return {
    persons,
    addPerson: async (name: string, context: string, notes?: string) => {
      return await db.persons.add({
        name,
        context,
        notes,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    },
    updatePerson: async (id: number, updates: Partial<Person>) => {
      const existing = await db.persons.get(id);
      if (!existing) throw new Error('Person not found');
      return await db.persons.put({
        ...existing,
        ...updates,
        updatedAt: new Date()
      });
    },
    deletePerson: async (id: number) => {
      return await db.persons.delete(id);
    }
  };
}
```

### Vite PWA Configuration (Minimal)
```typescript
// vite.config.ts
// Source: https://vite-pwa-org.netlify.app/guide/
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'NameHelpr',
        short_name: 'NameHelpr',
        description: 'Remember people by the context you met them',
        theme_color: '#4A90E2',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icons/192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
});
```

### Testing IndexedDB with fake-indexeddb
```typescript
// tests/db.test.ts
// Source: https://github.com/dumbmatter/fakeIndexedDB
import 'fake-indexeddb/auto'; // Polyfills global IndexedDB
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../src/db/schema';

describe('Person CRUD', () => {
  beforeEach(async () => {
    await db.persons.clear(); // Reset before each test
  });

  it('should add a person', async () => {
    const id = await db.persons.add({
      name: 'John Doe',
      context: 'React Conference 2026',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const person = await db.persons.get(id);
    expect(person?.name).toBe('John Doe');
  });

  it('should delete a person', async () => {
    const id = await db.persons.add({
      name: 'Jane Smith',
      context: 'Coffee Shop',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await db.persons.delete(id);
    const person = await db.persons.get(id);
    expect(person).toBeUndefined();
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual Workbox config in separate file | vite-plugin-pwa with inline config | 2023-2024 | Zero-config PWA setup; Workbox 7 integrated into Vite |
| localStorage for small apps | IndexedDB even for simple use cases | 2022-2025 | Libraries like Dexie made IndexedDB as easy as localStorage; no 5MB limit |
| Custom service worker from scratch | Workbox generateSW strategy | 2021-2024 | Precaching, runtime caching, update strategies all automated |
| Jest for testing | Vitest with browser mode | 2024-2026 | Native Vite integration; browser mode for real IndexedDB testing |
| beforeinstallprompt custom UI | Let browser show default prompt | 2025-2026 | Browser install prompts improved; custom UI adds friction |
| react-indexed-db (deprecated) | Dexie + dexie-react-hooks | 2023-2025 | react-indexed-db unmaintained; Dexie actively developed |

**Deprecated/outdated:**
- **localForage**: Once popular for abstracting storage; now redundant with Dexie's simplicity
- **idb-keyval**: Too minimal for apps needing indexes/queries; use Dexie unless extreme bundle size constraint
- **SW Precache / SW Toolbox**: Deprecated in favor of Workbox (Google's official replacement)
- **Manual icon generation**: @vite-pwa/assets-generator automates this from single SVG

## Open Questions

1. **App Icon Color Scheme**
   - What we know: User wants "NHr" text-based icon; modern aesthetic
   - What's unclear: Specific color (blue, green, purple?)
   - Recommendation: Choose during Wave 0; suggest modern blue (#4A90E2) or teal (#20B2AA) for good visibility on Android home screens

2. **Empty State Design**
   - What we know: Should guide user to add first person
   - What's unclear: Detailed copy and visual design
   - Recommendation: Simple centered text + large "Add Person" button; design in Wave 0

3. **Storage Quota Warning Threshold**
   - What we know: Should warn before quota exceeded
   - What's unclear: At what percentage (80%? 90%?)
   - Recommendation: 80% warning (non-blocking), 95% error (prevent writes); typical quota is 10GB+ so unlikely to hit in v1

4. **Offline Indicator**
   - What we know: Claude has discretion on whether to show offline status
   - What's unclear: User preference
   - Recommendation: For local-only app, offline indicator is low priority; consider adding subtle indicator in header (deferred to Phase 2 or later)

## Validation Architecture

> nyquist_validation is enabled in .planning/config.json

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x with @vitest/browser-webdriverio |
| Config file | `vitest.config.ts` — Wave 0 creates this |
| Quick run command | `npm test -- --run --reporter=verbose` |
| Full suite command | `npm test -- --run --coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | Data persists across sessions | integration | `npm test tests/persistence.test.ts` | ❌ Wave 0 |
| DATA-02 | Add person with name, context, notes | unit | `npm test tests/db/crud.test.ts -t "add person"` | ❌ Wave 0 |
| DATA-03 | Edit person details | unit | `npm test tests/db/crud.test.ts -t "update person"` | ❌ Wave 0 |
| DATA-04 | Delete person | unit | `npm test tests/db/crud.test.ts -t "delete person"` | ❌ Wave 0 |

**Additional Coverage:**
- PWA installability: manual (Lighthouse PWA audit in Chrome DevTools)
- Offline functionality: integration (`npm test tests/offline.test.ts` — Wave 0)
- Service worker registration: smoke (`npm test tests/pwa.test.ts` — Wave 0)

### Sampling Rate
- **Per task commit:** `npm test -- --run` (fast mode, < 30 seconds)
- **Per wave merge:** `npm test -- --run --coverage` (full suite with coverage report)
- **Phase gate:** Full suite green + manual Lighthouse PWA score ≥ 90

### Wave 0 Gaps
- [ ] `tests/db/crud.test.ts` — covers DATA-02, DATA-03, DATA-04 (unit tests with fake-indexeddb)
- [ ] `tests/persistence.test.ts` — covers DATA-01 (browser mode integration test)
- [ ] `tests/offline.test.ts` — verifies service worker caching and offline functionality
- [ ] `tests/pwa.test.ts` — smoke test for manifest and SW registration
- [ ] `vitest.config.ts` — Vitest configuration with browser mode setup
- [ ] Framework install: `npm install -D vitest @vitest/browser @vitest/browser-webdriverio fake-indexeddb`

**Testing Strategy:**
- **Unit tests (fake-indexeddb):** Fast, run in Node.js, validate CRUD logic
- **Integration tests (browser mode):** Real IndexedDB, validate persistence across "sessions"
- **Manual tests:** PWA installability (Chrome DevTools Lighthouse), offline mode (Network tab throttling)

## Sources

### Primary (HIGH confidence)
- [MDN: Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB) - Core API patterns, transaction management (last updated Feb 8, 2026)
- [MDN: Making PWAs Installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) - Installability requirements, Android specifics
- [web.dev: IndexedDB Best Practices](https://web.dev/articles/indexeddb) - Performance, pitfalls, migration strategies
- [Dexie.js Documentation](https://dexie.org/docs/Tutorial/Migrating-existing-DB-to-Dexie) - Schema definition, versioning, React hooks
- [Vite PWA Plugin Docs](https://vite-pwa-org.netlify.app/workbox/) - Configuration patterns, Workbox integration
- [MDN: Storage Quotas and Eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) - Browser-specific limits, eviction policies

### Secondary (MEDIUM confidence)
- [Digital Applied: PWA Performance Guide 2026](https://www.digitalapplied.com/blog/progressive-web-apps-2026-pwa-performance-guide) - 2026 state of PWA tooling maturity
- [npm: fake-indexeddb](https://www.npmjs.com/package/fake-indexeddb) - Testing approach for IndexedDB
- [RxDB: IndexedDB Storage Limits](https://rxdb.info/articles/indexeddb-max-storage-limit.html) - Quota management details
- [Vite PWA create-pwa](https://github.com/vite-pwa/create-pwa) - Official Vite PWA starter templates (v1.0.0 updated for Vite 7)
- [LogRocket: Next.js PWA Offline Support](https://blog.logrocket.com/nextjs-16-pwa-offline-support/) - Common pitfalls in offline-first implementation

### Tertiary (LOW confidence - marked for validation)
- [Vitest vs Jest 2026](https://dev.to/dataformathub/vitest-vs-jest-30-why-2026-is-the-year-of-browser-native-testing-2fgb) - Claims about Vitest adoption; validate with official Vitest docs
- [Medium: React IndexedDB Patterns](https://medium.com/@webelightsolutions/effortless-client-side-storage-using-indexeddb-with-react-hooks-87ae6ee3cffe) - Code examples look correct but not from official source

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries are mature, actively maintained (2026), with official documentation confirming compatibility
- Architecture: HIGH - Patterns verified against MDN, Dexie official docs, and Vite PWA documentation
- Pitfalls: HIGH - Extracted from official MDN IndexedDB guide, web.dev best practices, and 2026-dated PWA guides
- Testing: MEDIUM - Vitest browser mode is recently stabilized (v4.0, Dec 2025); integration patterns still emerging

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (30 days) - PWA/IndexedDB standards are stable; tooling (Vite, Workbox) evolves slowly
