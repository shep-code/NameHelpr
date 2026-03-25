import { describe, it, expect } from 'vitest';
import { groupByContext } from '../../src/utils/groupByContext';
import type { Person } from '../../src/types/Person';

describe('groupByContext', () => {
  it('groups people array by context field', () => {
    const people: Person[] = [
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
        name: 'Mike Jones',
        context: "Paul's Party",
        createdAt: new Date('2026-01-03'),
        updatedAt: new Date('2026-01-03')
      }
    ];

    const result = groupByContext(people);

    expect(result["Paul's Party"]).toHaveLength(2);
    expect(result["Paul's Party"][0].name).toBe('Paul Smith');
    expect(result["Paul's Party"][1].name).toBe('Mike Jones');
    expect(result['Tech Conference']).toHaveLength(1);
    expect(result['Tech Conference'][0].name).toBe('Sara Chen');
  });

  it('handles empty array', () => {
    const result = groupByContext([]);

    expect(result).toEqual({});
  });

  it('handles single context with multiple people', () => {
    const people: Person[] = [
      {
        id: 1,
        name: 'Alice',
        context: 'Concert 2024',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      },
      {
        id: 2,
        name: 'Bob',
        context: 'Concert 2024',
        createdAt: new Date('2026-01-02'),
        updatedAt: new Date('2026-01-02')
      }
    ];

    const result = groupByContext(people);

    expect(Object.keys(result)).toHaveLength(1);
    expect(result['Concert 2024']).toHaveLength(2);
    expect(result['Concert 2024'][0].name).toBe('Alice');
    expect(result['Concert 2024'][1].name).toBe('Bob');
  });
});
