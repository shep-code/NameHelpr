import Fuse from 'fuse.js';
import { useMemo, useState } from 'react';
import { Person } from '../types/Person';

export function useSearch(people: Person[]) {
  const [query, setQuery] = useState('');

  // Memoize Fuse instance (expensive to create)
  const fuse = useMemo(() => {
    return new Fuse(people, {
      keys: ['name'],          // Search names only (contexts browsed separately)
      threshold: 0.4,          // Balance typo tolerance and relevance
      ignoreLocation: true,    // Match anywhere in string
      minMatchCharLength: 2,   // Require 2+ characters
      shouldSort: true         // Sort by relevance score
    });
  }, [people]);

  // Search results - instant filtering
  const results = useMemo(() => {
    if (!query.trim()) return people;
    return fuse.search(query).map(result => result.item);
  }, [query, fuse, people]);

  return { query, setQuery, results };
}
