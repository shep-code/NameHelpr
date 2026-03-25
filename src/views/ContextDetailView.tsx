import { useState, useRef } from 'react';
import { usePeopleByContext } from '../hooks/usePeopleByContext';
import { useSubContexts, useParentContext, useEligibleParents } from '../hooks/useContextHierarchy';
import { useContextActions, usePersons } from '../db/hooks';
import { CompactPersonList } from '../components/CompactPersonList';
import { ContextList } from '../components/ContextList';
import { ViewType } from '../types/Navigation';

interface ContextDetailViewProps {
  context: string;
  onBack: () => void;
  onNavigate: (view: ViewType) => void;
}

export function ContextDetailView({ context, onBack, onNavigate }: ContextDetailViewProps) {
  const [currentContext, setCurrentContext] = useState(context);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showParentPicker, setShowParentPicker] = useState(false);
  const [showNewSubCtx, setShowNewSubCtx] = useState(false);
  const [newSubCtxName, setNewSubCtxName] = useState('');
  const [newSubCtxError, setNewSubCtxError] = useState('');
  const [newSubCtxSaving, setNewSubCtxSaving] = useState(false);
  const [showNewPerson, setShowNewPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonNotes, setNewPersonNotes] = useState('');
  const [newPersonSaving, setNewPersonSaving] = useState(false);
  const newPersonNameRef = useRef<HTMLInputElement>(null);

  const peopleByContext = usePeopleByContext(currentContext);
  const subContexts = useSubContexts(currentContext);
  const parentContext = useParentContext(currentContext);
  const eligibleParents = useEligibleParents(currentContext);
  const { renameContext, setParentContext, addContext, deleteContext } = useContextActions();
  const { addPerson } = usePersons();

  const handleAddSubContext = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSubCtxName.trim();
    if (!trimmed) return;
    setNewSubCtxSaving(true);
    setNewSubCtxError('');
    try {
      await addContext(trimmed);
      await setParentContext(trimmed, currentContext);
      setShowNewSubCtx(false);
      setNewSubCtxName('');
      onNavigate({ type: 'context-detail', context: trimmed });
    } catch {
      setNewSubCtxError('A group with that name already exists.');
    } finally {
      setNewSubCtxSaving(false);
    }
  };

  const handleAddPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPersonName.trim();
    if (!trimmed) return;
    setNewPersonSaving(true);
    try {
      await addPerson(trimmed, currentContext, newPersonNotes.trim() || undefined);
      setNewPersonName('');
      setNewPersonNotes('');
      newPersonNameRef.current?.focus();
    } finally {
      setNewPersonSaving(false);
    }
  };

  const startEditing = () => {
    setEditName(currentContext);
    setEditError('');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditError('');
  };

  const handleRename = async () => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === currentContext) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    setEditError('');
    try {
      await renameContext(currentContext, trimmed);
      setCurrentContext(trimmed);
      setIsEditing(false);
    } catch {
      setEditError('A group with that name already exists.');
    } finally {
      setSaving(false);
    }
  };

  const homeIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  );

  const pencilIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  );

  const trashIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
      <path d="M10 11v6"></path>
      <path d="M14 11v6"></path>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
    </svg>
  );

  if (!peopleByContext) {
    return (
      <div className="context-detail-view">
        <header className="detail-header">
          <button className="home-btn" onClick={() => onNavigate({ type: 'main' })} aria-label="Home">
            {homeIcon}
          </button>
        </header>
        <p>Loading...</p>
      </div>
    );
  }

  const { primary, secondary } = peopleByContext;

  const canDelete =
    primary.length === 0 &&
    secondary.length === 0 &&
    (subContexts ?? []).length === 0;

  const handleDelete = async () => {
    if (window.confirm(`Delete "${currentContext}"?`)) {
      await deleteContext(currentContext);
      onNavigate({ type: 'main' });
    }
  };

  return (
    <div className="context-detail-view">
      <header className="detail-header">
        <button className="home-btn" onClick={() => onNavigate({ type: 'main' })} aria-label="Home">
          {homeIcon}
        </button>

        {isEditing ? (
          <div className="context-edit-inline">
            <input
              className="context-edit-input"
              value={editName}
              onChange={(e) => { setEditName(e.target.value); setEditError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') cancelEditing(); }}
              autoFocus
              autoCapitalize="words"
            />
            {editError && <span className="context-edit-error">{editError}</span>}
            <button className="context-edit-save btn btn-primary" onClick={handleRename} disabled={saving}>
              {saving ? '...' : 'Save'}
            </button>
            <button className="context-edit-cancel btn btn-secondary" onClick={cancelEditing}>
              Cancel
            </button>
          </div>
        ) : (
          <>
            <h1>{currentContext}</h1>
            <button className="pencil-btn" onClick={startEditing} aria-label="Edit group name">
              {pencilIcon}
            </button>
            {canDelete && (
              <button className="trash-btn" onClick={handleDelete} aria-label="Delete group">
                {trashIcon}
              </button>
            )}
          </>
        )}
      </header>

      {/* Parent context indicator / set parent */}
      {parentContext !== undefined && (
        parentContext ? (
          <div className="parent-context-indicator">
            <span className="parent-label">Part of:</span>
            <button
              className="parent-context-link"
              onClick={() => onNavigate({ type: 'context-detail', context: parentContext })}
            >
              {parentContext}
            </button>
            <button
              className="remove-parent-btn"
              onClick={() => setParentContext(currentContext, null)}
              aria-label="Remove parent"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="set-parent-row">
            {showParentPicker ? (
              <div className="set-parent-picker">
                {(eligibleParents ?? []).length > 0 ? (
                  <select
                    defaultValue=""
                    className="tag-dropdown"
                    onChange={async (e) => {
                      if (e.target.value) {
                        await setParentContext(currentContext, e.target.value);
                        setShowParentPicker(false);
                      }
                    }}
                  >
                    <option value="" disabled>Select parent group...</option>
                    {(eligibleParents ?? []).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                ) : (
                  <p className="no-tags-hint">No other groups available</p>
                )}
                <button
                  type="button"
                  className="btn-secondary btn"
                  onClick={() => setShowParentPicker(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="set-parent-btn"
                onClick={() => setShowParentPicker(true)}
              >
                + Set parent group
              </button>
            )}
          </div>
        )
      )}

      <main className="detail-content">
        {/* People section — only when people exist */}
        {(primary.length > 0 || secondary.length > 0) && (
          <>
            {primary.length > 0 && (
              <section className="section-primary">
                <h2>Primary ({primary.length})</h2>
                <CompactPersonList
                  people={primary}
                  onPersonTap={(p) => onNavigate({ type: 'person-detail', personId: p.id! })}
                />
              </section>
            )}

            {secondary.length > 0 && (
              <section className="section-secondary">
                <h2>Also appears here ({secondary.length})</h2>
                <CompactPersonList
                  people={secondary}
                  onPersonTap={(p) => onNavigate({ type: 'person-detail', personId: p.id! })}
                />
              </section>
            )}
          </>
        )}

        {/* Sub-group section — visible for any group with no people */}
        {primary.length === 0 && secondary.length === 0 && (
          <>
            {(subContexts ?? []).length > 0 && (
              <ContextList
                contexts={subContexts!}
                onContextTap={(ctx) => onNavigate({ type: 'context-detail', context: ctx })}
              />
            )}
            <div className="inline-new-context">
              {showNewSubCtx ? (
                <form onSubmit={handleAddSubContext} className="inline-new-context-form">
                  <input
                    autoFocus
                    className="inline-new-context-input"
                    value={newSubCtxName}
                    onChange={(e) => { setNewSubCtxName(e.target.value); setNewSubCtxError(''); }}
                    placeholder="Group name..."
                    autoCapitalize="words"
                  />
                  <button type="submit" className="btn btn-primary inline-form-btn" disabled={!newSubCtxName.trim() || newSubCtxSaving}>
                    {newSubCtxSaving ? '...' : 'Save'}
                  </button>
                  <button type="button" className="btn btn-secondary inline-form-btn" onClick={() => { setShowNewSubCtx(false); setNewSubCtxName(''); setNewSubCtxError(''); }}>
                    Cancel
                  </button>
                  {newSubCtxError && <p className="inline-new-context-error">{newSubCtxError}</p>}
                </form>
              ) : (
                <button className="inline-new-context-btn" onClick={() => setShowNewSubCtx(true)}>
                  + new {currentContext} group
                </button>
              )}
            </div>
          </>
        )}

        {/* Add-person section — only when no sub-groups exist */}
        {(subContexts ?? []).length === 0 && (
          <div className="inline-new-person">
            {showNewPerson ? (
              <form onSubmit={handleAddPerson} className="inline-new-context-form">
                <input
                  ref={newPersonNameRef}
                  autoFocus
                  className="inline-new-context-input"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  placeholder="Name..."
                  autoCapitalize="words"
                />
                <input
                  className="inline-new-context-input"
                  value={newPersonNotes}
                  onChange={(e) => setNewPersonNotes(e.target.value)}
                  placeholder="Notes (optional)..."
                  autoCapitalize="sentences"
                />
                <button
                  type="submit"
                  className="btn btn-primary inline-form-btn"
                  disabled={!newPersonName.trim() || newPersonSaving}
                >
                  {newPersonSaving ? '...' : 'Save'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary inline-form-btn"
                  onClick={() => { setShowNewPerson(false); setNewPersonName(''); setNewPersonNotes(''); }}
                >
                  Done
                </button>
              </form>
            ) : (
              <button className="inline-new-context-btn" onClick={() => setShowNewPerson(true)}>
                + add person
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
