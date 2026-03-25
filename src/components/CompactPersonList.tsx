import { Person } from '../types/Person';

interface CompactPersonListProps {
  people: Person[];
  onPersonTap: (person: Person) => void;
}

export function CompactPersonList({ people, onPersonTap }: CompactPersonListProps) {
  if (people.length === 0) {
    return null;
  }

  return (
    <ul className="compact-person-list">
      {people.map(person => (
        <li key={person.id} onClick={() => onPersonTap(person)}>
          <span className="name">{person.name}</span>
          {person.notes && <span className="note">{person.notes}</span>}
        </li>
      ))}
    </ul>
  );
}
