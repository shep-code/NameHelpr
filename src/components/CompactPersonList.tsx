import { Person } from '../types/Person';

interface CompactPersonListProps {
  people: Person[];
  showDate?: boolean;
  selectionMode?: boolean;
  selectedIds?: Set<number>;
  onToggleSelect?: (person: Person) => void;
  expandedPersonId?: number | null;
  onExpand?: (id: number | null) => void;
  editingPersonId?: number | null;
  editName?: string;
  editNotes?: string;
  onEditNameChange?: (v: string) => void;
  onEditNotesChange?: (v: string) => void;
  onEditSave?: () => void;
  onEditCancel?: () => void;
  editSaving?: boolean;
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

const checkIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const xIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const trashIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
    <path d="M10 11v6"></path>
    <path d="M14 11v6"></path>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
  </svg>
);

export function CompactPersonList({
  people, showDate, selectionMode, selectedIds, onToggleSelect,
  expandedPersonId, onExpand,
  editingPersonId, editName, editNotes, onEditNameChange, onEditNotesChange,
  onEditSave, onEditCancel, editSaving, onEdit, onDelete,
}: CompactPersonListProps) {
  if (people.length === 0) return null;

  return (
    <ul className="compact-person-list">
      {people.map(person => {
        // Edit mode
        if (editingPersonId === person.id) {
          return (
            <li key={person.id} className="person-inline-edit">
              <input
                className="inline-new-context-input"
                value={editName}
                onChange={e => onEditNameChange?.(e.target.value)}
                autoFocus
                autoCapitalize="words"
                placeholder="Name..."
              />
              <input
                className="inline-new-context-input"
                value={editNotes}
                onChange={e => onEditNotesChange?.(e.target.value)}
                autoCapitalize="sentences"
                placeholder="Notes (optional)..."
              />
              <div className="person-edit-actions">
                <button
                  className="person-edit-confirm-btn"
                  onClick={onEditSave}
                  disabled={!editName?.trim() || editSaving}
                  aria-label="Save"
                >
                  {editSaving ? '...' : checkIcon}
                </button>
                <button className="person-edit-cancel-btn" onClick={onEditCancel} aria-label="Cancel">
                  {xIcon}
                </button>
                <button className="trash-btn person-edit-delete" onClick={() => onDelete?.(person)} aria-label="Delete">
                  {trashIcon}
                </button>
              </div>
            </li>
          );
        }

        // Selection mode
        if (selectionMode) {
          const isSelected = selectedIds?.has(person.id!);
          return (
            <li key={person.id} onClick={() => onToggleSelect?.(person)} className={isSelected ? 'selected' : ''}>
              <span className={`selection-check${isSelected ? ' checked' : ''}`} />
              <span className="name">{person.name}</span>
            </li>
          );
        }

        // Expanded
        if (expandedPersonId === person.id) {
          return (
            <li key={person.id} className="person-expanded">
              <div className="person-expanded-name-row">
                <span
                  className="name"
                  onClick={() => onExpand?.(null)}
                >
                  {person.name}
                </span>
                <button
                  className="pencil-btn"
                  onClick={() => onEdit?.(person)}
                  aria-label="Edit"
                >
                  {pencilIcon}
                </button>
              </div>
              {person.notes && (
                <div className="person-expanded-notes">{person.notes}</div>
              )}
            </li>
          );
        }

        // Collapsed (default)
        return (
          <li key={person.id} onClick={() => onExpand?.(person.id!)}>
            <span className="name">{person.name}</span>
            {showDate
              ? <span className="person-date">{formatDate(person.createdAt)}</span>
              : person.notes && <span className="note">{person.notes}</span>
            }
          </li>
        );
      })}
    </ul>
  );
}
