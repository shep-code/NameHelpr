import { ContextWithCount } from '../hooks/useContexts';

interface ContextListProps {
  contexts: ContextWithCount[];
  onContextTap: (context: string) => void;
}

export function ContextList({ contexts, onContextTap }: ContextListProps) {
  if (contexts.length === 0) {
    return (
      <div className="empty-context-list">
        <p>No groups yet</p>
        <p className="hint">Add someone to get started</p>
      </div>
    );
  }

  return (
    <div className="context-list">
      {contexts.map(({ context, count, isParent }) => (
        <button
          key={context}
          className="context-row"
          onClick={() => onContextTap(context)}
        >
          <span className="context-name">{context}</span>
          {count > 0 && <span className="context-count">{count}</span>}
        </button>
      ))}
    </div>
  );
}
