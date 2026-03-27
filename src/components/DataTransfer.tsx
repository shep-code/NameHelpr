import { useRef } from 'react';
import { db } from '../db/schema';
import { usePersons } from '../db/hooks';

export function DataTransfer() {
  const { persons } = usePersons();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    const contexts = await db.contexts.toArray();

    if ((!persons || persons.length === 0) && contexts.length === 0) {
      alert('No data to backup');
      return;
    }

    const data = {
      version: 2,
      exportedAt: new Date().toISOString(),
      contexts: contexts.map(c => ({
        name: c.name,
        parentContext: c.parentContext || null,
        createdAt: c.createdAt.toISOString()
      })),
      persons: (persons || []).map(p => ({
        name: p.name,
        context: p.context,
        contextTags: p.contextTags || [],
        notes: p.notes || '',
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString()
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `namehelpr-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.persons || !Array.isArray(data.persons)) {
        throw new Error('Invalid backup file format');
      }

      const contexts = Array.isArray(data.contexts) ? data.contexts : [];
      const confirmed = window.confirm(
        `Restore ${contexts.length} groups and ${data.persons.length} people? This will add to your existing data.`
      );

      if (!confirmed) {
        e.target.value = '';
        return;
      }

      // Restore groups first (skip any whose name already exists)
      for (const c of contexts) {
        const existing = await db.contexts.where('name').equals(c.name).first();
        if (!existing) {
          await db.contexts.add({
            name: c.name,
            parentContext: c.parentContext || undefined,
            createdAt: new Date(c.createdAt)
          });
        }
      }

      // Restore people
      for (const p of data.persons) {
        await db.persons.add({
          name: p.name,
          context: p.context,
          contextTags: p.contextTags || [],
          notes: p.notes || undefined,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        });
      }

      alert(`Restored ${contexts.length} groups and ${data.persons.length} people successfully!`);
    } catch (err) {
      alert('Failed to import: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }

    e.target.value = '';
  };

  return (
    <div className="data-transfer">
      <button onClick={handleExport} className="transfer-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        Backup
      </button>
      <button onClick={() => fileInputRef.current?.click()} className="transfer-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Restore
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        style={{ display: 'none' }}
      />
    </div>
  );
}
