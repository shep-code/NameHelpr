import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { usePersons } from '../db/hooks';

interface AutoSaveFormProps {
  onComplete: () => void;
  onCancel: () => void;
  initialContext?: string;
}

export function AutoSaveForm({ onComplete, onCancel, initialContext }: AutoSaveFormProps) {
  const { addPerson } = usePersons();
  const [name, setName] = useState('');
  const [context] = useState(initialContext ?? '');
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const savedRef = useRef(false);
  const savingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [formHasFocus, setFormHasFocus] = useState(true); // Start true since name autofocuses

  // Debounce all form data together (per RESEARCH.md - batch updates)
  const debouncedData = useDebounce({ name, context, notes }, 300);

  // Auto-save when debounced data changes and is valid
  useEffect(() => {
    const { name: n, context: c, notes: no } = debouncedData;

    // Skip if already saved, currently saving, or fields invalid
    if (savedRef.current || savingRef.current || !n.trim() || !c.trim()) return;

    // Skip if any form field is focused - user is still editing
    if (formHasFocus) return;

    // Skip if trailing whitespace - user is likely still typing
    if (n !== n.trim() || c !== c.trim()) return;

    // Set synchronous guard BEFORE async operation
    savingRef.current = true;
    setSaveStatus('saving');

    addPerson(n.trim(), c.trim(), no.trim() || undefined)
      .then(() => {
        setSaveStatus('saved');
        savedRef.current = true;
        onComplete();
      })
      .catch(() => {
        setSaveStatus('error');
        savingRef.current = false; // Allow retry on error
      });
  }, [debouncedData, addPerson, onComplete, formHasFocus]);

  // Handle form focus/blur with relatedTarget to detect internal navigation
  const handleFormBlur = (e: React.FocusEvent) => {
    // If focus is moving to another element inside the form, don't mark as blurred
    if (formRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    setFormHasFocus(false);
  };

  const handleFormFocus = () => {
    setFormHasFocus(true);
  };

  return (
    <div className="auto-save-form">
      <div className="form-header">
        <h2>Add Person</h2>
        <button
          type="button"
          className="btn-close"
          onClick={onCancel}
          aria-label="Cancel"
        >
          x
        </button>
      </div>

      <form
        ref={formRef}
        onSubmit={(e) => e.preventDefault()}
        onFocus={handleFormFocus}
        onBlur={handleFormBlur}
      >
        <div className="form-field">
          <label htmlFor="name">Name *</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoCapitalize="words"
            inputMode="text"
            placeholder="Sarah Chen"
            autoFocus
            className="form-input"
          />
        </div>

        <div className="form-field">
          <label htmlFor="notes">Notes (optional)</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            autoCapitalize="sentences"
            placeholder="Any additional details..."
            rows={2}
            className="form-input"
          />
        </div>

        {saveStatus === 'saving' && (
          <div className="save-status">Saving...</div>
        )}
        {saveStatus === 'error' && (
          <div className="save-status error">Failed to save. Try again.</div>
        )}
      </form>
    </div>
  );
}
