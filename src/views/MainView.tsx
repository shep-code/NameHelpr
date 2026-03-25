import { useState } from 'react';
import { useContexts } from '../hooks/useContexts';
import { useContextActions } from '../db/hooks';
import { ContextList } from '../components/ContextList';
import { DataTransfer } from '../components/DataTransfer';
import { ViewType } from '../types/Navigation';

interface MainViewProps {
  onNavigate: (view: ViewType) => void;
}

export function MainView({ onNavigate }: MainViewProps) {
  const contexts = useContexts();
  const { addContext } = useContextActions();
  const [showNewCtx, setShowNewCtx] = useState(false);
  const [newCtxName, setNewCtxName] = useState('');
  const [newCtxError, setNewCtxError] = useState('');
  const [newCtxSaving, setNewCtxSaving] = useState(false);

  const handleAddContext = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCtxName.trim();
    if (!trimmed) return;
    setNewCtxSaving(true);
    setNewCtxError('');
    try {
      await addContext(trimmed);
      setShowNewCtx(false);
      setNewCtxName('');
      onNavigate({ type: 'context-detail', context: trimmed });
    } catch {
      setNewCtxError('A group with that name already exists.');
    } finally {
      setNewCtxSaving(false);
    }
  };

  return (
    <div className="main-view">
      <header className="main-header">
        <div className="header-row">
          <h1>NameHelpr</h1>
          <button className="help-btn" onClick={() => onNavigate({ type: 'help' })} aria-label="How it works">?</button>
          <DataTransfer />
        </div>
      </header>

      <main className="main-content">
        <ContextList
          contexts={contexts || []}
          onContextTap={(ctx) => onNavigate({ type: 'context-detail', context: ctx })}
        />
        <div className="inline-new-context">
          {showNewCtx ? (
            <form onSubmit={handleAddContext} className="inline-new-context-form">
              <input
                autoFocus
                className="inline-new-context-input"
                value={newCtxName}
                onChange={(e) => { setNewCtxName(e.target.value); setNewCtxError(''); }}
                placeholder="Group name..."
                autoCapitalize="words"
              />
              <button
                type="submit"
                className="btn btn-primary inline-form-btn"
                disabled={!newCtxName.trim() || newCtxSaving}
              >
                {newCtxSaving ? '...' : 'Save'}
              </button>
              <button
                type="button"
                className="btn btn-secondary inline-form-btn"
                onClick={() => { setShowNewCtx(false); setNewCtxName(''); setNewCtxError(''); }}
              >
                Cancel
              </button>
              {newCtxError && <p className="inline-new-context-error">{newCtxError}</p>}
            </form>
          ) : (
            <button className="inline-new-context-btn" onClick={() => setShowNewCtx(true)}>
              + new group
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
