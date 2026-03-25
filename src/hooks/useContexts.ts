import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';

export interface ContextWithCount {
  context: string;
  count: number;
  primaryCount: number;
  isParent?: boolean;
}

export function useContexts(): ContextWithCount[] | undefined {
  return useLiveQuery(async () => {
    const [people, standaloneContexts] = await Promise.all([
      db.persons.toArray(),
      db.contexts.toArray(),
    ]);

    const contextCounts: Record<string, number> = {};
    const primaryCounts: Record<string, number> = {};

    // Count from both primary context and secondary contextTags
    people.forEach(person => {
      primaryCounts[person.context] = (primaryCounts[person.context] || 0) + 1;
      contextCounts[person.context] = (contextCounts[person.context] || 0) + 1;
      if (person.contextTags) {
        person.contextTags.forEach(tag => {
          contextCounts[tag] = (contextCounts[tag] || 0) + 1;
        });
      }
    });

    // Track which contexts are children (hidden from main list)
    const childContextNames = new Set(
      standaloneContexts
        .filter(sc => sc.parentContext)
        .map(sc => sc.name)
    );

    // Track which contexts are parents (have at least one child)
    const parentContextNames = new Set(
      standaloneContexts
        .filter(sc => sc.parentContext)
        .map(sc => sc.parentContext!)
    );

    // Add standalone contexts with count 0 if not already present
    standaloneContexts.forEach(sc => {
      if (!(sc.name in contextCounts)) {
        contextCounts[sc.name] = 0;
      }
    });

    return Object.entries(contextCounts)
      .filter(([name]) => !childContextNames.has(name))
      .map(([context, count]) => ({ context, count, primaryCount: primaryCounts[context] ?? 0, isParent: parentContextNames.has(context) }))
      .sort((a, b) => a.context.localeCompare(b.context));
  }, []);
}
