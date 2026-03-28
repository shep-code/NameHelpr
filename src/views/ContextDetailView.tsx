import { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { usePeopleByContext } from '../hooks/usePeopleByContext';
import { useSubContexts, useParentContext, useContextPath } from '../hooks/useContextHierarchy';
import { useContextActions, usePersons } from '../db/hooks';
import { db } from '../db/schema';
import { Person } from '../types/Person';
import { CompactPersonList } from '../components/CompactPersonList';
import { ContextList } from '../components/ContextList';
import { ViewType } from '../types/Navigation';
import { buildGroupTree, groupOptionLabel } from '../utils/buildGroupTree';

interface ContextDetailViewProps {
  context: string;
  fromContext?: string;
  onBack: () => void;
  onNavigate: (view: ViewType) => void;
}

export function ContextDetailView({ context, onNavigate }: ContextDetailViewProps) {
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
  const [sortMode, setSortMode] = useState<'alpha' | 'recent'>('alpha');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [moveDestination, setMoveDestination] = useState('');
  const [showNewGroupInput, setShowNewGroupInput] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupError, setNewGroupError] = useState('');
  const [moveSaving, setMoveSaving] = useState(false);
  const [showNewPerson, setShowNewPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonNotes, setNewPersonNotes] = useState('');
  const [newPersonSaving, setNewPersonSaving] = useState(false);
  const newPersonNameRef = useRef<HTMLInputElement>(null);

  const peopleByContext = usePeopleByContext(currentContext);
  const subContexts = useSubContexts(currentContext);
  const parentContext = useParentContext(currentContext);
  const contextPath = useContextPath(currentContext);
  const { renameContext, setParentContext, addContext, deleteContext } = useContextActions();
  const { addPerson, updatePerson } = usePersons();

  const groupTree = useLiveQuery(async () => {
    const [contexts, persons] = await Promise.all([
      db.contexts.toArray(),
      db.persons.toArray(),
    ]);
    const extraNames = persons.map(p => p.context);
    return buildGroupTree(contexts, extraNames);
  }, []);

  // All groups except current, in hierarchical order (for move bar)
  const allGroupsTree = (groupTree ?? []).filter(g => g.name !== currentContext);

  // Eligible parents: all groups except current and its descendants
  const eligibleParentsTree = useLiveQuery(async () => {
    const [contexts, persons] = await Promise.all([
      db.contexts.toArray(),
      db.persons.toArray(),
    ]);
    const extraNames = persons.map(p => p.context);
    return buildGroupTree(contexts, extraNames, currentContext);
  }, [currentContext]);

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
    setShowParentPicker(false);
    setSelectionMode(false);
    setSelectedIds(new Set());
    setMoveDestination('');
    setShowNewGroupInput(false);
    setNewGroupName('');
    setNewGroupError('');
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setMoveDestination('');
    setShowNewGroupInput(false);
    setNewGroupName('');
    setNewGroupError('');
  };

  const handleToggleSelect = (person: Person) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(person.id!)) next.delete(person.id!);
      else next.add(person.id!);
      return next;
    });
  };

  const handleMoveConfirm = async () => {
    const destination = showNewGroupInput ? newGroupName.trim() : moveDestination;
    if (!destination || selectedIds.size === 0) return;
    setMoveSaving(true);
    setNewGroupError('');
    try {
      if (showNewGroupInput) {
        await addContext(destination);
      }
      for (const id of selectedIds) {
        await updatePerson(id, { context: destination });
      }
      handleCancelSelection();
    } catch {
      setNewGroupError('A group with that name already exists.');
    } finally {
      setMoveSaving(false);
    }
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

  const sortPeople = (people: typeof primary) =>
    sortMode === 'recent'
      ? [...people].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      : people;

  const sortedPrimary = sortPeople(primary);
  const sortedSecondary = sortPeople(secondary);
  const hasPeople = primary.length > 0 || secondary.length > 0;

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

      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="breadcrumb">
        <button className="breadcrumb-home" onClick={() => onNavigate({ type: 'main' })} aria-label="Home">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </button>
        {(() => {
          const path = contextPath ?? [];
          // For deep paths show: first › … › second-to-last › last
          const segments = path.length > 3
            ? [path[0], null, ...path.slice(-2)]
            : path;
          return segments.map((segment, i) =>
            segment === null ? (
              <span key="ellipsis" className="breadcrumb-segment">
                <span className="breadcrumb-sep">›</span>
                <span className="breadcrumb-ellipsis">…</span>
              </span>
            ) : i === segments.length - 1 ? (
              <span key={segment} className="breadcrumb-segment">
                <span className="breadcrumb-sep">›</span>
                <span className="breadcrumb-current">{segment}</span>
              </span>
            ) : (
              <span key={segment} className="breadcrumb-segment">
                <span className="breadcrumb-sep">›</span>
                <button
                  className="breadcrumb-link"
                  onClick={() => onNavigate({ type: 'context-detail', context: segment })}
                >
                  {segment}
                </button>
              </span>
            )
          );
        })()}
      </nav>

      {/* Edit mode controls: Move Members (left) + Member of (right) on same row */}
      {isEditing && !selectionMode && (
        <>
          <div className="edit-controls-row">
            {primary.length > 0 && (
              <button className="move-members-btn" onClick={() => setSelectionMode(true)}>
                Move members
              </button>
            )}
            <div className="member-of-inline">
              {parentContext !== undefined && (
                parentContext ? (
                  <>
                    <span className="parent-label">Member of:</span>
                    <button
                      className="parent-context-link"
                      onClick={() => onNavigate({ type: 'context-detail', context: parentContext })}
                    >
                      {parentContext}
                    </button>
                    <button
                      className="pencil-btn"
                      onClick={() => setShowParentPicker(true)}
                      aria-label="Change parent group"
                    >
                      {pencilIcon}
                    </button>
                    <button
                      className="remove-parent-btn"
                      onClick={() => setParentContext(currentContext, null)}
                      aria-label="Remove parent"
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="set-parent-btn"
                    onClick={() => setShowParentPicker(true)}
                  >
                    + Set parent group
                  </button>
                )
              )}
            </div>
          </div>
          {showParentPicker && (
            <div className="set-parent-row">
              <div className="set-parent-picker">
                {(eligibleParentsTree ?? []).length > 0 ? (
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
                    {(eligibleParentsTree ?? []).map(({ name, depth }) => (
                      <option key={name} value={name}>{groupOptionLabel(name, depth)}</option>
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
            </div>
          )}
        </>
      )}

      <main className="detail-content">
        {/* People section */}
        {hasPeople && (
          <>
            {selectionMode ? (
              <div className="select-all-row">
                <button
                  className="select-all-btn"
                  onClick={() => {
                    const allSelected = sortedPrimary.every(p => selectedIds.has(p.id!));
                    setSelectedIds(allSelected ? new Set() : new Set(sortedPrimary.map(p => p.id!)));
                  }}
                >
                  {sortedPrimary.every(p => selectedIds.has(p.id!)) ? 'Deselect all' : 'Select all'}
                </button>
                <span className="selected-count">{selectedIds.size} of {sortedPrimary.length} selected</span>
              </div>
            ) : (
              <div className="sort-toggle-row">
                <button
                  className={`sort-toggle-btn${sortMode === 'alpha' ? ' active' : ''}`}
                  onClick={() => setSortMode('alpha')}
                >
                  A→Z
                </button>
                <button
                  className={`sort-toggle-btn${sortMode === 'recent' ? ' active' : ''}`}
                  onClick={() => setSortMode('recent')}
                >
                  Recent
                </button>
              </div>
            )}

            {sortedPrimary.length > 0 && (
              <section className="section-primary">
                <CompactPersonList
                  people={sortedPrimary}
                  onPersonTap={(p) => onNavigate({ type: 'person-detail', personId: p.id! })}
                  showDate={!selectionMode && sortMode === 'recent'}
                  selectionMode={selectionMode}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                />
              </section>
            )}

            {!selectionMode && sortedSecondary.length > 0 && (
              <section className="section-secondary">
                <CompactPersonList
                  people={sortedSecondary}
                  onPersonTap={(p) => onNavigate({ type: 'person-detail', personId: p.id! })}
                  showDate={sortMode === 'recent'}
                />
              </section>
            )}
          </>
        )}

        {/* Move bar — shown in selection mode, inline after list */}
        {selectionMode && (
          <div className="move-bar">
            <div className="move-bar-controls">
              {showNewGroupInput ? (
                <div className="move-bar-new-group">
                  <button
                    className="move-bar-back-btn"
                    onClick={() => { setShowNewGroupInput(false); setNewGroupName(''); setNewGroupError(''); }}
                  >
                    ←
                  </button>
                  <input
                    className="move-bar-new-group-input"
                    value={newGroupName}
                    onChange={e => { setNewGroupName(e.target.value); setNewGroupError(''); }}
                    placeholder="New group name..."
                    autoFocus
                    autoCapitalize="words"
                  />
                </div>
              ) : (
                <select
                  className="move-bar-select"
                  value={moveDestination}
                  onChange={e => {
                    if (e.target.value === '__new__') {
                      setShowNewGroupInput(true);
                      setMoveDestination('');
                    } else {
                      setMoveDestination(e.target.value);
                    }
                  }}
                >
                  <option value="" disabled>Move to...</option>
                  <option value="__new__">+ New group...</option>
                  {allGroupsTree.map(({ name, depth }) => (
                    <option key={name} value={name}>{groupOptionLabel(name, depth)}</option>
                  ))}
                </select>
              )}
              {newGroupError && <span className="move-bar-error">{newGroupError}</span>}
            </div>
            <div className="move-bar-actions">
              <button
                className="btn btn-primary"
                disabled={selectedIds.size === 0 || (!moveDestination && !newGroupName.trim()) || moveSaving}
                onClick={handleMoveConfirm}
              >
                {moveSaving ? '...' : `Move ${selectedIds.size > 0 ? `(${selectedIds.size})` : ''}`}
              </button>
              <button className="btn btn-secondary" onClick={handleCancelSelection} disabled={moveSaving}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Sub-groups — shown below people with a spacer */}
        {(subContexts ?? []).length > 0 && !selectionMode && (
          <>
            {hasPeople && <div className="section-divider" />}
            <ContextList
              contexts={subContexts!}
              onContextTap={(ctx) => onNavigate({ type: 'context-detail', context: ctx })}
            />
          </>
        )}

        {/* Add group / Add person — same row when neither form is open */}
        {!selectionMode && (
          <div className="inline-add-row">
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
            ) : showNewPerson ? (
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
              <div className="inline-add-buttons">
                <button className="inline-new-context-btn" onClick={() => setShowNewSubCtx(true)}>
                  + add group
                </button>
                <button className="inline-new-context-btn" onClick={() => setShowNewPerson(true)}>
                  + add person
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
