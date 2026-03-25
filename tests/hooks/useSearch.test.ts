import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearch } from '../../src/hooks/useSearch';
import { Person } from '../../src/types/Person';

describe('useSearch', () => {
  const mockPeople: Person[] = [
    {
      id: 1,
      name: 'Paul Smith',
      context: "Paul's Party",
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01')
    },
    {
      id: 2,
      name: 'Sara Chen',
      context: 'Tech Conference',
      createdAt: new Date('2026-01-02'),
      updatedAt: new Date('2026-01-02')
    },
    {
      id: 3,
      name: 'Mike Johnson',
      context: "Paul's Party",
      createdAt: new Date('2026-01-03'),
      updatedAt: new Date('2026-01-03')
    },
    {
      id: 4,
      name: 'Emily Davis',
      context: 'Book Club',
      createdAt: new Date('2026-01-04'),
      updatedAt: new Date('2026-01-04')
    }
  ];

  it('returns all people when query is empty', () => {
    const { result } = renderHook(() => useSearch(mockPeople));

    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual(mockPeople);
  });

  it('filters people by fuzzy matching on name only', () => {
    const { result } = renderHook(() => useSearch(mockPeople));

    act(() => {
      result.current.setQuery('paul');
    });

    // Should find Paul Smith (by name only - context search removed)
    expect(result.current.results).toHaveLength(1);
    expect(result.current.results).toContainEqual(expect.objectContaining({ name: 'Paul Smith' }));
  });

  it('handles typos with threshold 0.4', () => {
    const { result } = renderHook(() => useSearch(mockPeople));

    // Search for name with wrong case
    act(() => {
      result.current.setQuery('SARA');
    });

    expect(result.current.results).toContainEqual(expect.objectContaining({ name: 'Sara Chen' }));
  });

  it('does not match on context (name-only search)', () => {
    const { result } = renderHook(() => useSearch(mockPeople));

    act(() => {
      result.current.setQuery('party');
    });

    // Should NOT find people by context - only name search is supported
    expect(result.current.results).toHaveLength(0);
  });

  it('returns results in under 100ms for 200 people', () => {
    // Generate 200 mock people
    const largeMockPeople: Person[] = Array.from({ length: 200 }, (_, i) => ({
      id: i + 1,
      name: `Person ${i + 1}`,
      context: `Context ${Math.floor(i / 10)}`,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01')
    }));

    const { result } = renderHook(() => useSearch(largeMockPeople));

    const startTime = performance.now();
    act(() => {
      result.current.setQuery('person 50');
    });
    const endTime = performance.now();

    const duration = endTime - startTime;
    expect(duration).toBeLessThan(100);
  });
});
