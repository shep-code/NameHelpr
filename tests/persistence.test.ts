import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NameHelprDB, db } from '../src/db/schema';

describe('Data Persistence', () => {
  beforeEach(async () => {
    // Ensure db is open before clearing
    if (!db.isOpen()) {
      await db.open();
    }
    await db.persons.clear();
  });

  afterEach(async () => {
    // Ensure db is reopened after tests that close it
    if (!db.isOpen()) {
      await db.open();
    }
  });

  it('persists data across database reconnection', async () => {
    // Add a person
    const id = await db.persons.add({
      name: 'Persistent Person',
      context: 'Memory Test',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Close and reopen the database (simulates app restart)
    db.close();

    // Create new connection
    const db2 = new NameHelprDB();
    await db2.open();

    // Verify data persists
    const person = await db2.persons.get(id);
    expect(person?.name).toBe('Persistent Person');
    expect(person?.context).toBe('Memory Test');

    db2.close();
  });

  it('persists multiple records', async () => {
    await db.persons.add({
      name: 'Person 1',
      context: 'Event A',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await db.persons.add({
      name: 'Person 2',
      context: 'Event B',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const count = await db.persons.count();
    expect(count).toBe(2);
  });

  it('updates persist correctly', async () => {
    const id = await db.persons.add({
      name: 'Original',
      context: 'Test',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const existing = await db.persons.get(id);
    await db.persons.put({
      ...existing!,
      name: 'Updated',
      updatedAt: new Date()
    });

    db.close();
    const db2 = new NameHelprDB();
    await db2.open();

    const person = await db2.persons.get(id);
    expect(person?.name).toBe('Updated');
    db2.close();
  });

  it('deletes persist correctly', async () => {
    const id = await db.persons.add({
      name: 'To Delete',
      context: 'Test',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await db.persons.delete(id);

    db.close();
    const db2 = new NameHelprDB();
    await db2.open();

    const person = await db2.persons.get(id);
    expect(person).toBeUndefined();
    db2.close();
  });
});
