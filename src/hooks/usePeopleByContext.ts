import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { Person } from '../types/Person';

export interface PeopleByContextResult {
  primary: Person[];    // People where this is their primary context
  secondary: Person[];  // People where this is a secondary tag
}

export function usePeopleByContext(context: string | null): PeopleByContextResult | undefined {
  return useLiveQuery(async () => {
    if (!context) return { primary: [], secondary: [] };

    const all = await db.persons.toArray();

    const byName = (a: Person, b: Person) => a.name.localeCompare(b.name);

    const primary = all.filter(p => p.context === context).sort(byName);
    const secondary = all.filter(p =>
      p.context !== context &&
      p.contextTags?.includes(context)
    ).sort(byName);

    return { primary, secondary };
  }, [context]);
}
