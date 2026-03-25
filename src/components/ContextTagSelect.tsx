import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';

interface ContextTagSelectProps {
  selected: string[];
  onChange: (tags: string[]) => void;
  excludeContext?: string;  // Primary context to exclude from options
  allowCreate?: boolean;    // Allow creating new contexts
}

export function ContextTagSelect({ selected, onChange, excludeContext, allowCreate = false }: ContextTagSelectProps) {
  const [newContext, setNewContext] = useState('');

  const allContexts = useLiveQuery(async () => {
    const persons = await db.persons.toArray();
    const contexts = new Set<string>();
    persons.forEach(p => {
      contexts.add(p.context);
      p.contextTags?.forEach(t => contexts.add(t));
    });
    return [...contexts].filter(c => c !== excludeContext).sort();
  }, [excludeContext]);

  const available = allContexts?.filter(c => !selected.includes(c)) || [];

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
    }
  };

  const removeTag = (tag: string) => {
    onChange(selected.filter(t => t !== tag));
  };

  const handleAddNew = () => {
    if (newContext.trim()) {
      addTag(newContext.trim());
      setNewContext('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNew();
    }
  };

  return (
    <div className="context-tag-select">
      {selected.length > 0 && (
        <div className="selected-tags">
          {selected.map(tag => (
            <span key={tag} className="tag-chip removable">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {available.length > 0 && (
        <select
          onChange={(e) => {
            if (e.target.value) {
              addTag(e.target.value);
              e.target.value = '';
            }
          }}
          defaultValue=""
          className="tag-dropdown"
        >
          <option value="" disabled>Select existing context...</option>
          {available.map(ctx => (
            <option key={ctx} value={ctx}>{ctx}</option>
          ))}
        </select>
      )}

      {allowCreate && (
        <div className="new-context-input">
          <input
            type="text"
            value={newContext}
            onChange={(e) => setNewContext(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Or type new context..."
            className="tag-input"
          />
          {newContext.trim() && (
            <button type="button" onClick={handleAddNew} className="add-tag-btn">
              Add
            </button>
          )}
        </div>
      )}

      {available.length === 0 && selected.length === 0 && !allowCreate && (
        <p className="no-tags-hint">No other contexts available yet</p>
      )}
    </div>
  );
}
