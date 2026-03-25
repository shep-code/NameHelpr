import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';

export function useContextLinks(context: string) {
  const linkedContexts = useLiveQuery(async () => {
    const [asA, asB] = await Promise.all([
      db.contextLinks.where('contextA').equals(context).toArray(),
      db.contextLinks.where('contextB').equals(context).toArray(),
    ]);

    const names = [
      ...asA.map(link => link.contextB),
      ...asB.map(link => link.contextA),
    ];

    return [...new Set(names)].sort();
  }, [context]);

  const addLink = async (otherContext: string): Promise<void> => {
    if (otherContext === context) return;

    const [fwd, rev] = await Promise.all([
      db.contextLinks.where('contextA').equals(context).filter(l => l.contextB === otherContext).count(),
      db.contextLinks.where('contextA').equals(otherContext).filter(l => l.contextB === context).count(),
    ]);

    if (fwd + rev > 0) return;

    await db.contextLinks.add({
      contextA: context,
      contextB: otherContext,
      createdAt: new Date(),
    });
  };

  const removeLink = async (otherContext: string): Promise<void> => {
    const [links, reverseLinks] = await Promise.all([
      db.contextLinks.where('contextA').equals(context).filter(l => l.contextB === otherContext).toArray(),
      db.contextLinks.where('contextA').equals(otherContext).filter(l => l.contextB === context).toArray(),
    ]);

    const ids = [...links, ...reverseLinks]
      .map(l => l.id)
      .filter((id): id is number => id !== undefined);

    await db.contextLinks.bulkDelete(ids);
  };

  return { linkedContexts, addLink, removeLink };
}
