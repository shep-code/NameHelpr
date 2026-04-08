import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { usePersons } from '../db/hooks';
import { ViewType } from '../types/Navigation';

interface PersonDetailViewProps {
  personId: number;
  onBack: () => void;
  onNavigate: (view: ViewType) => void;
}

export function PersonDetailView({ personId, onBack, onNavigate }: PersonDetailViewProps) {
  const person = useLiveQuery(() => db.persons.get(personId), [personId]);
  const { deletePerson } = usePersons();

  if (!person) {
    return (
      <div className="person-detail-view">
        <p>Loading...</p>
      </div>
    );
  }

  const handleDelete = async () => {
    if (window.confirm(`Delete ${person.name}?`)) {
      await deletePerson(personId);
      onNavigate({ type: 'main' });
    }
  };

  return (
    <div className="person-detail-view">
      <div className="back-nav">
        <button className="back-btn" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          back
        </button>
      </div>

      <main className="person-content">
        <div className="person-name-row">
          <h1>{person.name}</h1>
          <div className="person-name-actions">
            <button
              className="pencil-btn"
              onClick={() => onNavigate({ type: 'edit-person', personId })}
              aria-label="Edit"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button className="trash-btn" onClick={handleDelete} aria-label="Delete">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
        <div className="parent-context-indicator person-member-of">
          <span className="parent-label">Member of:</span>
          <button
            className="parent-context-link"
            onClick={() => onNavigate({ type: 'context-detail', context: person.context })}
          >
            {person.context}
          </button>
        </div>

        {person.contextTags && person.contextTags.length > 0 && (
          <section className="field">
            <label>Also seen at</label>
            <div className="tag-chips">
              {person.contextTags.map(tag => (
                <button
                  key={tag}
                  className="tag-chip"
                  onClick={() => onNavigate({ type: 'context-detail', context: tag })}
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>
        )}

        {person.notes && (
          <section className="field">
            <label>Notes</label>
            <p className="notes">{person.notes}</p>
          </section>
        )}
      </main>
    </div>
  );
}
