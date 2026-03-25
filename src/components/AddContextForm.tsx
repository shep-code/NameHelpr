import { useState } from 'react';
import { useContextActions } from '../db/hooks';

interface AddContextFormProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function AddContextForm({ onComplete, onCancel }: AddContextFormProps) {
  const { addContext } = useContextActions();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setSaving(true);
    setError('');
    try {
      await addContext(trimmed);
      onComplete();
    } catch {
      setError('A context with that name already exists.');
      setSaving(false);
    }
  };

  return (
    <div className="auto-save-form">
      <div className="form-header">
        <h2>Add Context</h2>
        <button
          type="button"
          className="btn-close"
          onClick={onCancel}
          aria-label="Cancel"
        >
          x
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="context-name">Context Name *</label>
          <input
            id="context-name"
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            autoCapitalize="words"
            inputMode="text"
            placeholder="e.g. Bands, Work Friends, Gym"
            autoFocus
            className="form-input"
          />
        </div>

        {error && (
          <div className="save-status error">{error}</div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!name.trim() || saving}
        >
          {saving ? 'Creating...' : 'Create Context'}
        </button>
      </form>
    </div>
  );
}
