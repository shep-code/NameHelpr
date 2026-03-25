import { Person } from '../types/Person';

interface CompactPersonListProps {
  people: Person[];
  onPersonTap: (person: Person) => void;
  showDate?: boolean;
}

function formatDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`;
}

export function CompactPersonList({ people, onPersonTap, showDate }: CompactPersonListProps) {
  if (people.length === 0) {
    return null;
  }

  return (
    <ul className="compact-person-list">
      {people.map(person => (
        <li key={person.id} onClick={() => onPersonTap(person)}>
          <span className="name">{person.name}</span>
          {showDate
            ? <span className="person-date">{formatDate(person.createdAt)}</span>
            : person.notes && <span className="note">{person.notes}</span>
          }
        </li>
      ))}
    </ul>
  );
}
