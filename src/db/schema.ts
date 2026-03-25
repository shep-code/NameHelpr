import Dexie, { Table } from 'dexie';
import { Person } from '../types/Person';
import { ContextLink } from '../types/ContextLink';
import { StandaloneContext } from '../types/StandaloneContext';

export class NameHelprDB extends Dexie {
  persons!: Table<Person>;
  contextLinks!: Table<ContextLink>;
  contexts!: Table<StandaloneContext>;

  constructor() {
    super('NameHelprDB');

    // Version 1 - original schema
    this.version(1).stores({
      persons: '++id, name, context, createdAt'
    });

    // Version 2 - add contextTags for secondary context tagging
    this.version(2).stores({
      persons: '++id, name, context, *contextTags, createdAt'
      // *contextTags = multi-entry index for array values
    }).upgrade(tx => {
      return tx.table('persons').toCollection().modify(person => {
        person.contextTags = person.contextTags || [];
      });
    });

    // Version 3 - add context-to-context associations
    this.version(3).stores({
      persons: '++id, name, context, *contextTags, createdAt',
      contextLinks: '++id, contextA, contextB'
    });

    // Version 4 - add standalone contexts table
    this.version(4).stores({
      persons: '++id, name, context, *contextTags, createdAt',
      contextLinks: '++id, contextA, contextB',
      contexts: '++id, &name, createdAt'
    });

    // Version 5 - add parentContext index to contexts
    this.version(5).stores({
      persons: '++id, name, context, *contextTags, createdAt',
      contextLinks: '++id, contextA, contextB',
      contexts: '++id, &name, parentContext, createdAt'
    });
  }
}

export const db = new NameHelprDB();
