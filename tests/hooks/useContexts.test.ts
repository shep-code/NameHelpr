import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useContexts } from '../../src/hooks/useContexts';
import { db } from '../../src/db/schema';

describe('useContexts', () => {
  beforeEach(async () => {
    await db.persons.clear();
  });

  it('returns distinct contexts from all people', async () => {
    // Add 3 people with 2 different contexts
    await db.persons.add({
      name: 'Alice',
      context: 'Book Club',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await db.persons.add({
      name: 'Bob',
      context: "Paul's Party",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await db.persons.add({
      name: 'Charlie',
      context: 'Book Club',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const { result } = renderHook(() => useContexts());

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    expect(result.current).toHaveLength(2);
    const contextNames = result.current!.map(c => c.context);
    expect(contextNames).toContain('Book Club');
    expect(contextNames).toContain("Paul's Party");
  });

  it('includes count of people per context', async () => {
    await db.persons.add({
      name: 'Alice',
      context: 'Book Club',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await db.persons.add({
      name: 'Bob',
      context: 'Book Club',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await db.persons.add({
      name: 'Charlie',
      context: "Paul's Party",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const { result } = renderHook(() => useContexts());

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    expect(result.current).toEqual([
      { context: 'Book Club', count: 2 },
      { context: "Paul's Party", count: 1 }
    ]);
  });

  it('sorts contexts alphabetically', async () => {
    // Add contexts in non-alphabetical order
    await db.persons.add({
      name: 'Alice',
      context: 'Zebra Conference',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await db.persons.add({
      name: 'Bob',
      context: 'Apple Meetup',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await db.persons.add({
      name: 'Charlie',
      context: 'Banana Party',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const { result } = renderHook(() => useContexts());

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    const contextNames = result.current!.map(c => c.context);
    expect(contextNames).toEqual(['Apple Meetup', 'Banana Party', 'Zebra Conference']);
  });

  it('updates reactively when person added with new context', async () => {
    await db.persons.add({
      name: 'Alice',
      context: 'Book Club',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const { result } = renderHook(() => useContexts());

    await waitFor(() => {
      expect(result.current).toHaveLength(1);
    });

    // Add a person with a new context
    await db.persons.add({
      name: 'Bob',
      context: 'Tech Conference',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // useLiveQuery should trigger re-render
    await waitFor(() => {
      expect(result.current).toHaveLength(2);
    });

    const contextNames = result.current!.map(c => c.context);
    expect(contextNames).toContain('Book Club');
    expect(contextNames).toContain('Tech Conference');
  });
});
