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

    people.forEach(person => {
      if (childNames.has(person.context)) {
        counts[person.context] = (counts[person.context] || 0) + 1;
      }
      person.contextTags?.forEach(tag => {
        if (childNames.has(tag)) {
          counts[tag] = (counts[tag] || 0) + 1;
        }
      });
    });

    return children.map(c => ({ context: c.name, count: counts[c.name] || 0 }));
  }, [parentContext]);
}

export function useParentContext(contextName: string): string | null | undefined {
  return useLiveQuery(async () => {
    const sc = await db.contexts.where('name').equals(contextName).first();
    return sc?.parentContext ?? null;
  }, [contextName]);
}
