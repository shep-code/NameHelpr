import { Person } from '../types/Person';

export interface GroupedResults {
  [context: string]: Person[];
}

export function groupByContext(people: Person[]): GroupedResults {
  return people.reduce((groups, person) => {
    const context = person.context;
    if (!groups[context]) {
      groups[context] = [];
    }
    groups[context].push(person);
    return groups;
  }, {} as GroupedResults);
}
