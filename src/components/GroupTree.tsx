import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';

interface GroupTreeProps {
  onNavigate: (context: string) => void;
}

export function GroupTree({ onNavigate }: GroupTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const data = useLiveQuery(async () => {
    const [contexts, persons] = await Promise.all([
      db.contexts.toArray(),
      db.persons.toArray(),
    ]);

    const childrenOf: Record<string, string[]> = {};
    const childSet = new Set<string>();

    contexts.forEach(ctx => {
      if (ctx.parentContext) {
        if (!childrenOf[ctx.parentContext]) childrenOf[ctx.parentContext] = [];
        childrenOf[ctx.parentContext].push(ctx.name);
        childSet.add(ctx.name);
      }
    });

    // People counts per group (direct members only)
    const counts: Record<string, number> = {};
    persons.forEach(p => {
      counts[p.context] = (counts[p.context] || 0) + 1;
    });

    // All known group names
    const allNames = new Set<string>([
      ...contexts.map(c => c.name),
      ...persons.map(p => p.context),
    ]);

    const roots = [...allNames]
      .filter(n => !childSet.has(n))
      .sort((a, b) => a.localeCompare(b));

    // Sort each child list
    Object.values(childrenOf).forEach(arr => arr.sort((a, b) => a.localeCompare(b)));

    return { childrenOf, counts, roots };
  }, []);

  if (!data) return null;
  const { childrenOf, counts, roots } = data;

  const toggle = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const renderNode = (name: string, depth: number): React.ReactNode => {
    const children = childrenOf[name] || [];
    const hasChildren = children.length > 0;
    const isExpanded = expanded.has(name);
    const count = counts[name] || 0;

    return (
      <div key={name} className="group-tree-node">
        <div className="group-tree-row" style={{ paddingLeft: `${0.75 + depth * 1.25}rem` }}>
          <button
            className="group-tree-toggle"
            onClick={(e) => hasChildren ? toggle(name, e) : undefined}
            aria-label={hasChildren ? (isExpanded ? 'Collapse' : 'Expand') : undefined}
            tabIndex={hasChildren ? 0 : -1}
          >
            {hasChildren ? (isExpanded ? '−' : '+') : <span className="group-tree-spacer" />}
          </button>
          <button className="group-tree-name" onClick={() => onNavigate(name)}>
            {name}
          </button>
          {count > 0 && <span className="group-tree-count">{count}</span>}
        </div>
        {hasChildren && isExpanded && (
          <div className="group-tree-children">
            {children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (roots.length === 0) {
    return (
      <div className="empty-context-list">
        <p>No groups yet</p>
        <p className="hint">Add a group to get started</p>
      </div>
    );
  }

  return (
    <div className="group-tree">
      {roots.map(name => renderNode(name, 0))}
    </div>
  );
}
