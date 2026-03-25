interface EmptyStateProps {
  onAdd: () => void;
}

export function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-content">
        <h2>No people yet</h2>
        <p>Add someone you've met to get started</p>
        <button className="btn btn-primary btn-large" onClick={onAdd}>
          Add Person
        </button>
      </div>
    </div>
  );
}
