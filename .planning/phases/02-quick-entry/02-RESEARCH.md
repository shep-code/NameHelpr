# Phase 2: Quick Entry - Research

**Researched:** 2026-03-06
**Domain:** Mobile-first form UX, React auto-save patterns, autocomplete UI
**Confidence:** HIGH

## Summary

Phase 2 optimizes the entry experience for mobile users by implementing single-screen forms with mobile-optimized keyboards, auto-save functionality, and context autocomplete. The research identifies proven patterns for debounced writes to IndexedDB, HTML5 mobile input attributes, and accessible autocomplete using native datalist elements.

**Key findings:**
- Native HTML attributes (autocapitalize, inputmode) provide optimal mobile keyboard behavior without libraries
- useDebounce hook pattern (300-500ms delay) is the standard for auto-save to prevent excessive writes
- HTML5 datalist offers 88% browser support with better accessibility than custom autocomplete widgets
- Debounced IndexedDB writes should batch updates to avoid transaction overhead
- Visual Viewport API handles mobile keyboard appearance without layout shifts

**Primary recommendation:** Build auto-save with useDebounce + Dexie's useLiveQuery for reactive updates. Use native HTML5 datalist for context suggestions. Apply autocapitalize="words" on name input and inputmode="text" with autocapitalize="none" on context input.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ENTR-01 | Entry form is single-screen (name + context + notes visible together) | Mobile-first design patterns, viewport units (svh), single-column layout |
| ENTR-02 | Form uses proper mobile keyboards (autocapitalize for names, text for context) | HTML autocapitalize attribute, inputmode attribute, mobile keyboard types |
| ENTR-03 | Data auto-saves as user types (no explicit Save button) | useDebounce hook, debounced IndexedDB writes, optimistic updates pattern |
| ENTR-04 | Context field suggests from existing contexts as user types | HTML5 datalist, accessible autocomplete patterns, Dexie queries for distinct contexts |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.4 | UI framework | Already in project, controlled inputs for auto-save |
| Dexie | 4.3.0 | IndexedDB wrapper | Already in project, reactive queries with useLiveQuery |
| dexie-react-hooks | 4.2.0 | React integration | Already in project, provides useLiveQuery for auto-updates |
| Vitest | 4.0.18 | Test framework | Already in project, fake timers for debounce testing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| use-debounce | 10.x (optional) | Production debounce hook | If custom useDebounce needs more features (leading/trailing) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| HTML5 datalist | Downshift, Material-UI Autocomplete | Custom libs add 20-50KB, require ARIA management, but offer more styling control |
| Custom useDebounce | lodash.debounce in useEffect | Package dependency vs 10 lines of code; custom hook is idiomatic React |
| useLiveQuery | Manual useEffect + db queries | Lose automatic re-render on data changes from other tabs/components |

**Installation:**
```bash
# All dependencies already installed in Phase 1
# Optional production debounce library if needed:
npm install use-debounce
```

## Architecture Patterns

### Recommended Component Structure
```
src/
├── components/
│   ├── PersonForm.tsx           # Existing form, refactor for auto-save
│   └── ContextAutocomplete.tsx  # New: datalist-based autocomplete
├── hooks/
│   ├── useDebounce.ts          # New: debounce hook for auto-save
│   └── useAutoSave.ts          # New: combines debounce + Dexie update
├── db/
│   ├── schema.ts               # Existing Dexie schema
│   └── hooks.ts                # Add getDistinctContexts query
└── types/
    └── Person.ts               # Existing type definitions
```

### Pattern 1: Auto-Save with Debounce
**What:** Delay writing to IndexedDB until user stops typing for 300-500ms
**When to use:** Any form field that saves automatically without explicit submit button

**Example:**
```typescript
// Source: https://usehooks.com/usedebounce
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage in auto-save:
const [name, setName] = useState('');
const debouncedName = useDebounce(name, 300);

useEffect(() => {
  if (personId && debouncedName) {
    db.persons.update(personId, { name: debouncedName, updatedAt: new Date() });
  }
}, [debouncedName, personId]);
```

### Pattern 2: HTML5 Datalist for Context Suggestions
**What:** Native autocomplete using datalist element connected to input via list attribute
**When to use:** Suggesting existing values for freeform text input (5-15 items optimal)

**Example:**
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/datalist
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';

function ContextAutocomplete({ value, onChange }: Props) {
  // Get distinct contexts from existing persons
  const contexts = useLiveQuery(async () => {
    const persons = await db.persons.toArray();
    return [...new Set(persons.map(p => p.context))].sort();
  }, []);

  return (
    <>
      <input
        type="text"
        list="contexts"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoCapitalize="none"
      />
      <datalist id="contexts">
        {contexts?.map((ctx) => (
          <option key={ctx} value={ctx} />
        ))}
      </datalist>
    </>
  );
}
```

### Pattern 3: Mobile Keyboard Optimization
**What:** Use autocapitalize and inputmode attributes to invoke appropriate mobile keyboards
**When to use:** All text inputs on mobile-first forms

**Example:**
```tsx
// Source: https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/autocapitalize
// Name field: capitalize each word, standard text keyboard
<input
  type="text"
  autoCapitalize="words"
  inputMode="text"
  placeholder="Sarah Chen"
/>

// Context field: no capitalization (user may type "meeting at Paul's")
<input
  type="text"
  autoCapitalize="none"
  inputMode="text"
  placeholder="Paul's Party"
/>

// Notes field: capitalize sentences
<textarea
  autoCapitalize="sentences"
  placeholder="Any additional details..."
/>
```

### Pattern 4: Optimistic Updates with Error Recovery
**What:** Update UI immediately while database write happens asynchronously
**When to use:** Auto-save scenarios where user expects instant feedback

**Example:**
```typescript
// Source: https://www.synthace.com/blog/autosave-with-react-hooks
const [name, setName] = useState('');
const [saveError, setSaveError] = useState<string | null>(null);
const debouncedName = useDebounce(name, 300);

useEffect(() => {
  if (!personId || !debouncedName) return;

  // Optimistic update already reflected in UI via name state
  db.persons.update(personId, {
    name: debouncedName,
    updatedAt: new Date()
  })
  .then(() => setSaveError(null))
  .catch((err) => {
    setSaveError('Failed to save');
    // Optionally: retry logic or revert UI state
  });
}, [debouncedName, personId]);
```

### Pattern 5: Single-Screen Mobile Layout
**What:** Fit all form fields above the fold using viewport units and single-column layout
**When to use:** Mobile-first forms where scrolling adds friction

**Example:**
```css
/* Source: https://medium.com/@alekswebnet/fix-mobile-100vh-bug-in-one-line-of-css-dynamic-viewport-units-in-action-102231e2ed56 */
.form-container {
  /* Use svh (small viewport height) to account for mobile browser UI */
  height: 100svh; /* Fallback: 100vh */
  display: flex;
  flex-direction: column;
  padding: 1rem;
  gap: 1rem;
}

.form-field {
  /* Minimum touch target size for mobile */
  min-height: 44px;
}

/* Input fields adapt to available space */
input, textarea {
  width: 100%;
  font-size: 16px; /* Prevents iOS zoom on focus */
}
```

### Anti-Patterns to Avoid
- **Saving on every keystroke without debounce:** Creates excessive IndexedDB transactions, blocks main thread. Always debounce 300-500ms.
- **Using 100vh for mobile layouts:** Keyboard appearance causes layout shifts. Use 100svh (small viewport height) instead.
- **Custom autocomplete without ARIA:** Screen reader support is complex. Use native datalist when possible (88% browser support).
- **Controlled inputs without performance optimization:** Large forms can lag. Use component isolation and React.memo for form fields.
- **Debouncing optimistic updates:** If you debounce the entire update function, UI becomes laggy. Separate UI update (immediate) from DB write (debounced).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Debounce hook | Custom setTimeout logic scattered in components | useDebounce hook (10 lines) or use-debounce package | Easy to create memory leaks with unmounted components, forget cleanup, or mishandle dependency arrays |
| Autocomplete UI | Custom dropdown with keyboard navigation and ARIA | HTML5 datalist element | Accessibility is hard (focus management, screen reader announcements, keyboard nav). Datalist handles it natively. |
| Mobile keyboard hints | JavaScript to detect input type and show hints | HTML autocapitalize and inputmode attributes | Browser handles it natively, no JS needed, better UX |
| Viewport height calculation | JavaScript to measure window.innerHeight and adjust | CSS viewport units (svh, dvh, lvh) | Browser-native, no JS needed, handles keyboard appearance automatically |
| Distinct values query | Load all persons and deduplicate in React | Dexie query with distinct/toArray + Set | IndexedDB is optimized for queries. Client-side deduplication loads unnecessary data. |

**Key insight:** Mobile-first forms have been solved by web standards. Native HTML attributes (autocapitalize, inputmode, datalist) and modern CSS (viewport units) eliminate most custom JavaScript.

## Common Pitfalls

### Pitfall 1: Race Conditions in Auto-Save
**What goes wrong:** User types "A", then "B". Debounced save for "A" fires after debounced save for "B". Database ends up with stale value "A".
**Why it happens:** Multiple debounced saves can execute out of order due to async timing.
**How to avoid:**
- Use React's latest value in effect dependency - useEffect with debouncedValue ensures only latest runs
- For complex scenarios, use request cancellation or mutation queue pattern
- Dexie's useLiveQuery auto-reflects latest DB state even if race occurs
**Warning signs:** User reports "my changes disappeared" after typing quickly

**Prevention example:**
```typescript
// GOOD: Latest debouncedValue wins
const debouncedName = useDebounce(name, 300);
useEffect(() => {
  if (personId && debouncedName) {
    db.persons.update(personId, { name: debouncedName });
  }
}, [debouncedName]); // Only fires when debouncedName changes

// BAD: Multiple simultaneous saves
onChange={(e) => {
  const newName = e.target.value;
  setName(newName);
  debounce(() => db.persons.update(personId, { name: newName }), 300)(); // Creates new debounce each time!
}}
```

### Pitfall 2: Partial Object Updates in Dexie
**What goes wrong:** Using `db.table.update(id, { field })` only updates that field, but subsequent updates can overwrite entire object if using `.put()`.
**Why it happens:** Dexie's `.update()` does partial update, but `.put()` replaces entire record.
**How to avoid:**
- Use spread pattern: `db.table.put({ ...existing, ...updates })` for full control
- Or use `.update()` consistently for partial updates
- Phase 1 STATE.md documents this: "Use Dexie spread pattern for updates"
**Warning signs:** Some fields randomly reset to undefined or old values

**Prevention example:**
```typescript
// GOOD: Spread pattern preserves all fields
const existing = await db.persons.get(id);
await db.persons.put({
  ...existing!,
  name: newName,
  updatedAt: new Date()
});

// ALSO GOOD: Partial update
await db.persons.update(id, {
  name: newName,
  updatedAt: new Date()
});

// BAD: Overwrites entire record
await db.persons.put({
  id,
  name: newName,
  updatedAt: new Date()
  // context and notes are now undefined!
});
```

### Pitfall 3: Autocapitalize Not Working
**What goes wrong:** Setting autocapitalize on input has no effect on mobile keyboard.
**Why it happens:** Three common causes:
  1. Input type is email, url, or password (autocapitalize disabled for these)
  2. Browser doesn't support it (Firefox on Android)
  3. Physical keyboard being used (autocapitalize only affects virtual keyboards)
**How to avoid:**
- Use type="text" for name/context fields (not type="email")
- Test on actual mobile devices (Chrome/Safari on iOS/Android)
- Accept that it's progressive enhancement (doesn't work everywhere)
**Warning signs:** QA reports "keyboard doesn't capitalize names on Android Firefox"

### Pitfall 4: Datalist Not Accessible
**What goes wrong:** Screen reader doesn't announce available suggestions.
**Why it happens:** Some browser/screen reader combinations (NVDA + Firefox) don't support datalist announcements.
**How to avoid:**
- Use datalist as progressive enhancement, ensure form works without suggestions
- Add aria-label or label element to describe behavior
- For critical accessibility, fall back to ARIA combobox pattern (more complex)
**Warning signs:** Accessibility audit flags missing ARIA attributes on autocomplete

**Mitigation example:**
```tsx
// Progressive enhancement with clear labeling
<label htmlFor="context">
  Context (start typing for suggestions)
</label>
<input
  id="context"
  type="text"
  list="contexts"
  aria-describedby="context-hint"
/>
<span id="context-hint" className="sr-only">
  Suggestions will appear as you type
</span>
<datalist id="contexts">
  {/* options */}
</datalist>
```

### Pitfall 5: IndexedDB Transaction Overhead
**What goes wrong:** Auto-save becomes sluggish even with debouncing because each field update creates a separate transaction.
**Why it happens:** IndexedDB transaction handling is the performance bottleneck, not data throughput.
**How to avoid:**
- Batch multiple field updates into single transaction
- Use "mergebounce" pattern to merge multiple update calls within debounce window
- For this phase: single record updates are fine, but avoid per-character updates
**Warning signs:** Performance profiler shows many small IndexedDB transactions

**Prevention example:**
```typescript
// GOOD: Single debounced update with all changed fields
const debouncedFormData = useDebounce({ name, context, notes }, 300);
useEffect(() => {
  if (personId) {
    db.persons.update(personId, {
      ...debouncedFormData,
      updatedAt: new Date()
    });
  }
}, [debouncedFormData]);

// BAD: Three separate debounced updates
const debouncedName = useDebounce(name, 300);
const debouncedContext = useDebounce(context, 300);
const debouncedNotes = useDebounce(notes, 300);
// Each triggers separate IndexedDB transaction!
```

## Code Examples

Verified patterns from official sources:

### Complete Auto-Save Form Component
```typescript
// Source: React patterns + Dexie docs
import { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { db } from '../db/schema';
import { useLiveQuery } from 'dexie-react-hooks';

interface AutoSaveFormProps {
  personId?: number;
  onComplete?: () => void;
}

export function AutoSaveForm({ personId, onComplete }: AutoSaveFormProps) {
  const [name, setName] = useState('');
  const [context, setContext] = useState('');
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Load existing person if editing
  const person = useLiveQuery(
    () => personId ? db.persons.get(personId) : undefined,
    [personId]
  );

  useEffect(() => {
    if (person) {
      setName(person.name);
      setContext(person.context);
      setNotes(person.notes || '');
    }
  }, [person]);

  // Get distinct contexts for autocomplete
  const contexts = useLiveQuery(async () => {
    const persons = await db.persons.toArray();
    return [...new Set(persons.map(p => p.context))].sort();
  }, []);

  // Debounce all form data together
  const debouncedData = useDebounce({ name, context, notes }, 300);

  // Auto-save when debounced data changes
  useEffect(() => {
    const { name, context, notes } = debouncedData;
    if (!name.trim() || !context.trim()) return; // Skip invalid data

    setSaveStatus('saving');

    if (personId) {
      // Update existing person
      db.persons.update(personId, {
        name: name.trim(),
        context: context.trim(),
        notes: notes.trim() || undefined,
        updatedAt: new Date()
      })
      .then(() => setSaveStatus('saved'))
      .catch(() => setSaveStatus('error'));
    } else {
      // Create new person
      db.persons.add({
        name: name.trim(),
        context: context.trim(),
        notes: notes.trim() || undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .then((id) => {
        setSaveStatus('saved');
        onComplete?.();
      })
      .catch(() => setSaveStatus('error'));
    }
  }, [debouncedData, personId, onComplete]);

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <div className="form-field">
        <label htmlFor="name">Name *</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoCapitalize="words"
          inputMode="text"
          placeholder="Sarah Chen"
          autoFocus
        />
      </div>

      <div className="form-field">
        <label htmlFor="context">Context *</label>
        <input
          id="context"
          type="text"
          list="contexts"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          autoCapitalize="none"
          inputMode="text"
          placeholder="Paul's Party"
        />
        <datalist id="contexts">
          {contexts?.map((ctx) => (
            <option key={ctx} value={ctx} />
          ))}
        </datalist>
      </div>

      <div className="form-field">
        <label htmlFor="notes">Notes (optional)</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          autoCapitalize="sentences"
          placeholder="Any additional details..."
          rows={3}
        />
      </div>

      {saveStatus === 'error' && (
        <div className="error">Failed to save. Please try again.</div>
      )}

      {saveStatus === 'saving' && (
        <div className="status">Saving...</div>
      )}
    </form>
  );
}
```

### Mobile-Optimized CSS
```css
/* Source: Modern viewport units + mobile-first patterns */
.form-container {
  /* Use small viewport height to account for mobile browser UI */
  min-height: 100vh; /* Fallback */
  min-height: 100svh; /* Modern browsers */
  display: flex;
  flex-direction: column;
  padding: 1rem;
  gap: 1rem;
  box-sizing: border-box;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field input,
.form-field textarea {
  width: 100%;
  min-height: 44px; /* Apple HIG minimum touch target */
  padding: 0.75rem;
  font-size: 16px; /* Prevents iOS zoom on focus */
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-field label {
  font-weight: 600;
  font-size: 0.875rem;
}

/* Status indicators */
.status {
  font-size: 0.875rem;
  color: #666;
  padding: 0.5rem;
  text-align: center;
}

.error {
  font-size: 0.875rem;
  color: #d32f2f;
  padding: 0.5rem;
  background: #ffebee;
  border-radius: 4px;
}

/* Screen reader only text */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 100vh for mobile | 100svh, 100dvh, 100lvh viewport units | Chrome 108+, Safari 15.4+, Firefox 101+ (2022-2023) | Fixes mobile keyboard layout shifts, better browser UI handling |
| Custom autocomplete with ARIA | HTML5 datalist (when sufficient) | Always available, 88% support by 2025 | Simpler implementation, native accessibility, less code |
| type="number" for numeric inputs | inputmode="numeric" on type="text" | Baseline since 2021 | Better mobile UX (avoids spinner buttons), maintains text validation control |
| Debounce with lodash | Custom useDebounce hook | React Hooks era (2019+) | More idiomatic React, automatic cleanup, no external dependency |
| Manual IndexedDB | Dexie.js with hooks | Dexie 3.0+ (2021), dexie-react-hooks 1.0+ | Reactive queries, auto-updates across tabs, simpler API |

**Deprecated/outdated:**
- **inputmode values removed:** inputmode="verbatim", "latin", "latin-name", "latin-prose", "full-width-latin", "kana", "katakana" were removed from spec. Use "text" instead.
- **autoCapitalize camelCase in HTML:** Use lowercase `autocapitalize` in HTML attributes (autoCapitalize with capital C is for React/JSX only)
- **100vh on mobile:** Still works but causes layout shifts when keyboard appears. Use 100svh.

## Open Questions

1. **Should we use optimistic UI updates or show loading state?**
   - What we know: Optimistic updates feel faster (instant feedback), but can confuse users if save fails
   - What's unclear: User expectation for this app (trust instant vs visual confirmation)
   - Recommendation: Start with optimistic (no loading spinner), add error toast if save fails. Measure in usage.

2. **Debounce delay: 300ms or 500ms?**
   - What we know: 300ms is common for search, 500ms for auto-save to reduce writes
   - What's unclear: User typing speed vs database write frequency tradeoff
   - Recommendation: Start with 300ms (feels responsive), increase to 500ms if IndexedDB performance issues appear

3. **Should context autocomplete be case-sensitive?**
   - What we know: Datalist matching is case-insensitive in most browsers
   - What's unclear: User expectation ("paul's party" vs "Paul's Party")
   - Recommendation: Store as-entered, datalist handles case-insensitive matching automatically

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
| ENTR-01 | Single-screen layout (name + context + notes visible) | integration | `npm test -- tests/components/AutoSaveForm.test.tsx --run` | ❌ Wave 0 |
| ENTR-02 | Mobile keyboard attributes (autocapitalize, inputmode) | unit | `npm test -- tests/components/FormInputs.test.tsx --run` | ❌ Wave 0 |
| ENTR-03 | Auto-save with debounce (300ms delay) | integration | `npm test -- tests/auto-save.test.tsx --run` | ❌ Wave 0 |
| ENTR-04 | Context autocomplete from existing entries | integration | `npm test -- tests/components/ContextAutocomplete.test.tsx --run` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run` (all tests, fast mode)
- **Per wave merge:** `npm test -- --run --coverage` (with coverage report)
- **Phase gate:** Full suite green + manual mobile device testing before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/components/AutoSaveForm.test.tsx` — covers ENTR-01 (single-screen layout), ENTR-03 (auto-save)
- [ ] `tests/components/FormInputs.test.tsx` — covers ENTR-02 (mobile keyboard attributes)
- [ ] `tests/components/ContextAutocomplete.test.tsx` — covers ENTR-04 (context suggestions)
- [ ] `tests/hooks/useDebounce.test.ts` — unit tests for debounce hook (supports ENTR-03)
- [ ] Update `tests/setup.ts` — add fake-indexeddb import if not already present

## Sources

### Primary (HIGH confidence)
- [MDN: autocapitalize](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/autocapitalize) - Attribute values, browser support, which input types it works with
- [MDN: inputmode](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode) - All inputmode values, mobile keyboard hints, baseline support
- [Dexie.js React Tutorial](https://dexie.org/docs/Tutorial/React) - useLiveQuery patterns, mutations, auto-updates
- [useHooks: useDebounce](https://usehooks.com/usedebounce) - Standard useDebounce implementation pattern
- [Vitest: Timers](https://vitest.dev/guide/mocking/timers) - Fake timers for testing debounced functions

### Secondary (MEDIUM confidence)
- [Mobile-First Design 2026](https://www.trinergydigital.com/news/mobile-first-ux-design-best-practices-in-2026) - Touch targets, single-screen optimization, 44px minimum
- [Fix 100vh on Mobile](https://medium.com/@alekswebnet/fix-mobile-100vh-bug-in-one-line-of-css-dynamic-viewport-units-in-action-102231e2ed56) - svh/dvh/lvh viewport units
- [React Auto-Save Hook](https://darius-marlowe.medium.com/smarter-forms-in-react-building-a-useautosave-hook-with-debounce-and-react-query-d4d7f9bb052e) - useAutoSave pattern with debounce
- [Accessibility Support: Datalist](https://a11ysupport.io/tech/html/datalist_element) - 88% browser support, screen reader compatibility
- [IndexedDB Performance](https://opkode.com/blog/2021-05-05-mergebounce-indexeddb/) - Mergebounce pattern, transaction batching
- [React Testing Library 2026](https://oneuptime.com/blog/post/2026-02-02-react-testing-library/view) - userEvent.setup(), form interaction patterns
- [Vitest Fake Timers with Debounce](https://dev.to/brunosabot/mastering-time-using-fake-timers-with-vitest-390b) - advanceTimersByTimeAsync pattern

### Tertiary (LOW confidence)
- [Baymard: Touch Keyboard Types](https://baymard.com/labs/touch-keyboard-types) - Mobile keyboard cheat sheet (not dated, marked for validation)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already in project from Phase 1, native HTML features
- Architecture: HIGH - Patterns verified with official docs (MDN, Dexie, Vitest), recent 2025-2026 sources
- Pitfalls: MEDIUM-HIGH - Race conditions and partial updates verified in multiple sources, datalist accessibility partially documented
- Mobile keyboard: MEDIUM - MDN docs are authoritative but browser support varies (Firefox Android lacks autocapitalize)
- Auto-save testing: HIGH - Vitest fake timers well-documented, recent 2025 patterns found

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (30 days - stable domain, HTML/CSS/React patterns change slowly)
