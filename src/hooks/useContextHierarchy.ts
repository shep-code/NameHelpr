import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { ContextWithCount } from './useContexts';

export function useSubContexts(parentContext: string): ContextWithCount[] | undefined {
  return useLiveQuery(async () => {
    const children = await db.contexts
      .where('parentContext')
      .equals(parentContext)
      .sortBy('name');

    if (children.length === 0) return [];

    const childNames = new Set(children.map(c => c.name));
    const people = await db.persons.toArray();
    const counts: Record<string, number> = {};
    const primaryCounts: Record<string, number> = {};

    people.forEach(person => {
      if (childNames.has(person.context)) {
        primaryCounts[person.context] = (primaryCounts[person.context] || 0) + 1;
        counts[person.context] = (counts[person.context] || 0) + 1;
      }
      person.contextTags?.forEach(tag => {
        if (childNames.has(tag)) {
          counts[tag] = (counts[tag] || 0) + 1;
        }
      });
    });

    return children.map(c => ({ context: c.name, count: counts[c.name] || 0, primaryCount: primaryCounts[c.name] || 0 }));
  }, [parentContext]);
}

export function useParentContext(contextName: string): string | null | undefined {
  return useLiveQuery(async () => {
    const sc = await db.contexts.where('name').equals(contextName).first();
    return sc?.parentContext ?? null;
  }, [contextName]);
}

export function useEligibleParents(contextName: string): string[] | undefined {
  return useLiveQuery(async () => {
    const [contextRecords, allPersons] = await Promise.all([
      db.contexts.toArray(),
      db.persons.toArray(),
    ]);

    // Full set of all known context names (persons + standalone records)
    const allContextNames = new Set<string>();
    allPersons.forEach(p => allContextNames.add(p.context));
    contextRecords.forEach(ctx => allContextNames.add(ctx.name));

    // Primary people count per context name
    const primaryCounts: Record<string, number> = {};
    allPersons.forEach(p => {
      primaryCounts[p.context] = (primaryCounts[p.context] || 0) + 1;
    });

    // Build children map for BFS (parent→child relationships from context records)
    const childrenOf: Record<string, string[]> = {};
    contextRecords.forEach(ctx => {
      if (ctx.parentContext) {
        if (!childrenOf[ctx.parentContext]) {
          childrenOf[ctx.parentContext] = [];
        }
        childrenOf[ctx.parentContext].push(ctx.name);
      }
    });

    // BFS — find all descendants of contextName (cycle prevention)
    const descendants = new Set<string>();
    const queue = childrenOf[contextName] ? [...childrenOf[contextName]] : [];
    while (queue.length > 0) {
      const name = queue.shift()!;
      if (!descendants.has(name)) {
        descendants.add(name);
        if (childrenOf[name]) {
          for (const child of childrenOf[name]) {
            queue.push(child);
          }
        }
      }
    }

    return Array.from(allContextNames)
      .filter(name =>
        name !== contextName &&
        !descendants.has(name) &&
        (primaryCounts[name] || 0) === 0
      )
      .sort((a, b) => a.localeCompare(b));
  }, [contextName]);
}
