import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './schema';
import { Person } from '../types/Person';

export function useContextActions() {
  const addContext = async (name: string): Promise<void> => {
    await db.contexts.add({ name: name.trim(), createdAt: new Date() });
  };

  const deleteContext = async (name: string): Promise<void> => {
    await db.contexts.where('name').equals(name).delete();
  };

  const renameContext = async (oldName: string, newName: string): Promise<void> => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;

    await db.transaction('rw', db.persons, db.contextLinks, db.contexts, async () => {
      const now = new Date();

      // Update primary context on persons
      const primaryPersons = await db.persons.where('context').equals(oldName).toArray();
      for (const p of primaryPersons) {
        await db.persons.update(p.id!, { context: trimmed, updatedAt: now });
      }

      // Update contextTags on persons
      const taggedPersons = await db.persons.where('contextTags').equals(oldName).toArray();
      for (const p of taggedPersons) {
        await db.persons.update(p.id!, {
          contextTags: p.contextTags!.map(t => t === oldName ? trimmed : t),
          updatedAt: now
        });
      }

      // Update contextLinks (contextA side)
      const linksA = await db.contextLinks.where('contextA').equals(oldName).toArray();
      for (const l of linksA) {
        await db.contextLinks.update(l.id!, { contextA: trimmed });
      }

      // Update contextLinks (contextB side)
      const linksB = await db.contextLinks.where('contextB').equals(oldName).toArray();
      for (const l of linksB) {
        await db.contextLinks.update(l.id!, { contextB: trimmed });
      }

      // Update standalone context record if it exists
      await db.contexts.where('name').equals(oldName).modify({ name: trimmed });

      // Update parentContext references on child contexts
      await db.contexts.where('parentContext').equals(oldName).modify({ parentContext: trimmed });
    });
  };

  const setParentContext = async (contextName: string, parentName: string | null): Promise<void> => {
    const existing = await db.contexts.where('name').equals(contextName).first();
    if (existing) {
      await db.contexts.where('name').equals(contextName).modify({
        parentContext: parentName ?? undefined
      });
    } else {
      await db.contexts.add({
        name: contextName,
        parentContext: parentName ?? undefined,
        createdAt: new Date()
      });
    }
  };

  return { addContext, deleteContext, renameContext, setParentContext };
}

export function usePersons() {
  const persons = useLiveQuery(
    () => db.persons.orderBy('createdAt').reverse().toArray()
  );

  const addPerson = async (
    name: string,
    context: string,
    notes?: string,
    contextTags?: string[]
  ): Promise<number> => {
    const now = new Date();
    return await db.persons.add({
      name,
      context,
      contextTags: contextTags || [],
      notes,
      createdAt: now,
      updatedAt: now
    });
  };

  const updatePerson = async (id: number, updates: Partial<Person>): Promise<void> => {
    const existing = await db.persons.get(id);
    if (!existing) throw new Error('Person not found');

    await db.persons.put({
      ...existing,
      ...updates,
      updatedAt: new Date()
    });
  };

  const deletePerson = async (id: number): Promise<void> => {
    await db.persons.delete(id);
  };

  return {
    persons,
    addPerson,
    updatePerson,
    deletePerson
  };
}
