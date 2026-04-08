import { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { usePeopleByContext } from '../hooks/usePeopleByContext';
import { useSubContexts, useParentContext } from '../hooks/useContextHierarchy';
import { useContextActions, usePersons } from '../db/hooks';
import { Person } from '../types/Person';
import { db } from '../db/schema';
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
  const [showMoveGroupPicker, setShowMoveGroupPicker] = useState(false);
  const [moveGroupDestination, setMoveGroupDestination] = useState('');

  const peopleByContext = usePeopleByContext(currentContext);
  const subContexts = useSubContexts(currentContext);
  const parentContext = useParentContext(currentContext);
  const { renameContext, setParentContext, addContext, deleteContext } = useContextActions();
  const { addPerson, updatePerson, deletePerson } = usePersons();

  const groupTree = useLiveQuery(async () => {
    const [contexts, persons] = await Promise.all([
      db.contexts.toArray(),
      db.persons.toArray(),
    ]);
    const extraNames = persons.map(p => p.context);
    return buildGroupTree(contexts, extraNames);
  }, []);

  // All groups except current (for move people destination)
  const allGroupsTree = (groupTree ?? []).filter(g => g.name !== currentContext);

  // Eligible parents: all groups except current and its descendants (for move group)
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
    <div className={`context-detail-view${hasPeople ? ' has-people' : ''}`}>
      <header className="detail-header">
        <button
          className="back-btn"
          onClick={() => parentContext
            ? onNavigate({ type: 'context-detail', context: parentContext })
            : onNavigate({ type: 'main' })
          }
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
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

      <main className="detail-content">
        {/* People section */}
        {hasPeople && (
          <>
            {sortedPrimary.length > 0 && (
              <section className="section-primary">
                <CompactPersonList
                  people={sortedPrimary}
                  showDate={!selectionMode && sortMode === 'recent'}
                  selectionMode={selectionMode}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onEdit={(p) => onNavigate({ type: 'edit-person', personId: p.id! })}
                  onDelete={async (p) => {
                    if (window.confirm(`Delete ${p.name}?`)) {
                      await deletePerson(p.id!);
                    }
                  }}
                />
              </section>
            )}

            {!selectionMode && sortedSecondary.length > 0 && (
              <section className="section-secondary">
                <CompactPersonList
                  people={sortedSecondary}
                  showDate={sortMode === 'recent'}
                  onEdit={(p) => onNavigate({ type: 'edit-person', personId: p.id! })}
                  onDelete={async (p) => {
                    if (window.confirm(`Delete ${p.name}?`)) {
                      await deletePerson(p.id!);
                    }
                  }}
                />
              </section>
            )}
          </>
        )}

        {/* Sub-groups — shown below people with a spacer */}
        {(subContexts ?? []).length > 0 && (
          <>
            {hasPeople && <div className="section-divider" />}
            <ContextList
              contexts={subContexts!}
              onContextTap={(ctx) => onNavigate({ type: 'context-detail', context: ctx })}
            />
          </>
        )}

        {/* Sort toggle — right justified, above add buttons */}
        {hasPeople && (
          <div className="sort-toggle-row">
            <span className="sort-toggle-label">Sort list by:</span>
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

        {/* Add / move controls */}
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
          ) : selectionMode ? (
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
                  {moveSaving ? '...' : `Move${selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}`}
                </button>
                <button className="btn btn-secondary" onClick={handleCancelSelection} disabled={moveSaving}>
                  Cancel
                </button>
              </div>
            </div>
          ) : showMoveGroupPicker ? (
            <div className="set-parent-picker">
              {(eligibleParentsTree ?? []).length > 0 ? (
                <select
                  value={moveGroupDestination}
                  className="tag-dropdown"
                  onChange={(e) => setMoveGroupDestination(e.target.value)}
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
                className="btn btn-primary inline-form-btn"
                disabled={!moveGroupDestination}
                onClick={async () => {
                  await setParentContext(currentContext, moveGroupDestination);
                  setShowMoveGroupPicker(false);
                  setMoveGroupDestination('');
                }}
              >
                Save
              </button>
              <button
                type="button"
                className="btn btn-secondary inline-form-btn"
                onClick={() => { setShowMoveGroupPicker(false); setMoveGroupDestination(''); }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="inline-add-buttons">
              <button className="inline-new-context-btn" onClick={() => setShowNewPerson(true)}>
                + add person
              </button>
              <button className="inline-new-context-btn" onClick={() => setShowNewSubCtx(true)}>
                + add group
              </button>
              {hasPeople && (
                <button className="inline-new-context-btn" onClick={() => setSelectionMode(true)}>
                  + move people
                </button>
              )}
              <button className="inline-new-context-btn" onClick={() => setShowMoveGroupPicker(true)}>
                + move group
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
