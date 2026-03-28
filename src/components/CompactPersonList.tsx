import { Person } from '../types/Person';

interface CompactPersonListProps {
  people: Person[];
  onPersonTap: (person: Person) => void;
  showDate?: boolean;
  selectionMode?: boolean;
  selectedIds?: Set<number>;
  onToggleSelect?: (person: Person) => void;
}

function formatDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`;
}

export function CompactPersonList({ people, onPersonTap, showDate, selectionMode, selectedIds, onToggleSelect }: CompactPersonListProps) {
  if (people.length === 0) {
    return null;
  }

  return (
    <ul className="compact-person-list">
      {people.map(person => {
        const isSelected = selectionMode && selectedIds?.has(person.id!);
        return (
          <li
            key={person.id}
            onClick={() => selectionMode ? onToggleSelect?.(person) : onPersonTap(person)}
            className={isSelected ? 'selected' : ''}
          >
            {selectionMode && (
              <span className={`selection-check${isSelected ? ' checked' : ''}`} />
            )}
            <span className="name">{person.name}</span>
            {!selectionMode && (showDate
              ? <span className="person-date">{formatDate(person.createdAt)}</span>
              : person.notes && <span className="note">{person.notes}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
