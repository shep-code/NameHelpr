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

  const homeButton = (
    <button className="home-btn" onClick={() => onNavigate({ type: 'main' })} aria-label="Home">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    </button>
  );

  if (!person) {
    return (
      <div className="person-detail-view">
        <header className="detail-header">
          {homeButton}
        </header>
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
      <header className="detail-header">
        {homeButton}
        <div className="header-actions">
          <button
            className="icon-btn edit-btn"
            onClick={() => onNavigate({ type: 'edit-person', personId })}
            aria-label="Edit"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button className="icon-btn delete-btn" onClick={handleDelete} aria-label="Delete">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </header>

      <main className="person-content">
        <h1>{person.name}</h1>

        <section className="field">
          <label>Met at</label>
          <button
            className="context-link"
            onClick={() => onNavigate({ type: 'context-detail', context: person.context })}
          >
            {person.context}
          </button>
        </section>

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
