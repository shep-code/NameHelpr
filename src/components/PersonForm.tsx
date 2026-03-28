import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Person } from '../types/Person';
import { db } from '../db/schema';
import { buildGroupTree, groupOptionLabel } from '../utils/buildGroupTree';

interface PersonFormProps {
  onSave: (name: string, context: string, notes?: string, contextTags?: string[]) => Promise<void>;
  onCancel: () => void;
  person?: Person;
}

export function PersonForm({ onSave, onCancel, person }: PersonFormProps) {
  const [name, setName] = useState(person?.name || '');
  const [context, setContext] = useState(person?.context || '');
  const [notes, setNotes] = useState(person?.notes || '');

  const allGroups = useLiveQuery(async () => {
    const [contexts, persons] = await Promise.all([
      db.contexts.toArray(),
      db.persons.toArray(),
    ]);
    return buildGroupTree(contexts, persons.map(p => p.context));
  }, []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (person) {
      setName(person.name);
      setContext(person.context);
      setNotes(person.notes || '');
    }
  }, [person]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !context.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(name.trim(), context.trim(), notes.trim() || undefined);

      // Reset form only if adding new person (not editing)
      if (!person) {
        setName('');
        setContext('');
        setNotes('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-overlay">
      <div className="form-container">
        <h2>{person ? 'Edit Person' : 'Add Person'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sarah Chen"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="context">Member of *</label>
            <select
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              required
            >
              <option value="" disabled>Select group...</option>
              {allGroups?.map(({ name, depth }) => (
                <option key={name} value={name}>{groupOptionLabel(name, depth)}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes (optional)</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details..."
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {person ? 'Save' : 'Add Person'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
