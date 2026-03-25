import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../src/db/schema';

describe('Person CRUD', () => {
  beforeEach(async () => {
    await db.persons.clear();
  });

  describe('add person', () => {
    it('creates record with auto-generated id', async () => {
      const id = await db.persons.add({
        name: 'John Doe',
        context: 'Tech Conference 2026',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      expect(id).toBeGreaterThan(0);
      const person = await db.persons.get(id);
      expect(person?.name).toBe('John Doe');
    });

    it('stores optional notes field', async () => {
      const id = await db.persons.add({
        name: 'Jane Smith',
        context: 'Coffee Shop',
        notes: 'Works at Google',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const person = await db.persons.get(id);
      expect(person?.notes).toBe('Works at Google');
    });
  });

  describe('update person', () => {
    it('merges with existing data', async () => {
      const id = await db.persons.add({
        name: 'Original Name',
        context: 'Original Context',
        notes: 'Original Notes',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const existing = await db.persons.get(id);
      await db.persons.put({
        ...existing!,
        name: 'Updated Name',
        updatedAt: new Date()
      });

      const updated = await db.persons.get(id);
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.context).toBe('Original Context');
      expect(updated?.notes).toBe('Original Notes');
    });

    it('updates the updatedAt timestamp', async () => {
      const originalDate = new Date('2026-01-01');
      const id = await db.persons.add({
        name: 'Test',
        context: 'Test Context',
        createdAt: originalDate,
        updatedAt: originalDate
      });

      const existing = await db.persons.get(id);
      const newDate = new Date('2026-03-05');
      await db.persons.put({
        ...existing!,
        name: 'Updated',
        updatedAt: newDate
      });

      const updated = await db.persons.get(id);
      expect(updated?.updatedAt.getTime()).toBe(newDate.getTime());
      expect(updated?.createdAt.getTime()).toBe(originalDate.getTime());
    });
  });

  describe('delete person', () => {
    it('removes record by id', async () => {
      const id = await db.persons.add({
        name: 'To Delete',
        context: 'Temp',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await db.persons.delete(id);
      const person = await db.persons.get(id);
      expect(person).toBeUndefined();
    });

    it('does not throw on non-existent id', async () => {
      // Should not throw when deleting non-existent record
      await expect(db.persons.delete(99999)).resolves.not.toThrow();
    });
  });
});
