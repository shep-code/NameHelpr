import { Person } from '../types/Person';

interface CompactPersonListProps {
  people: Person[];
  showDate?: boolean;
  selectionMode?: boolean;
  selectedIds?: Set<number>;
  onToggleSelect?: (person: Person) => void;
  onEdit?: (person: Person) => void;
  onDelete?: (person: Person) => void;
}

function formatDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`;
}

const pencilIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const trashIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export function CompactPersonList({ people, showDate, selectionMode, selectedIds, onToggleSelect, onEdit, onDelete }: CompactPersonListProps) {
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
            onClick={() => selectionMode ? onToggleSelect?.(person) : undefined}
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
            {!selectionMode && (
              <div className="person-row-actions">
                <button
                  className="pencil-btn"
                  onClick={(e) => { e.stopPropagation(); onEdit?.(person); }}
                  aria-label="Edit"
                >
                  {pencilIcon}
                </button>
                <button
                  className="trash-btn"
                  onClick={(e) => { e.stopPropagation(); onDelete?.(person); }}
                  aria-label="Delete"
                >
                  {trashIcon}
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
