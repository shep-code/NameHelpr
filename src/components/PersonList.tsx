import { Person } from '../types/Person';

interface PersonListProps {
  persons: Person[];
  onEdit: (person: Person) => void;
  onDelete: (id: number) => void;
}

export function PersonList({ persons, onEdit, onDelete }: PersonListProps) {
  const handleDelete = (person: Person) => {
    if (window.confirm(`Delete ${person.name}?`)) {
      onDelete(person.id!);
    }
  };

  return (
    <div className="person-list">
      {persons.map((person) => (
        <div key={person.id} className="person-card">
          <div className="person-info">
            <h3>{person.name}</h3>
            <p className="context">{person.context}</p>
            {person.notes && <p className="notes">{person.notes}</p>}
          </div>
          <div className="person-actions">
            <button className="btn-icon" onClick={() => onEdit(person)} title="Edit">
              ✏️
            </button>
            <button className="btn-icon" onClick={() => handleDelete(person)} title="Delete">
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
