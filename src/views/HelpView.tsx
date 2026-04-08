interface HelpViewProps {
  onBack: () => void;
}

export function HelpView({ onBack }: HelpViewProps) {
  return (
    <div className="help-view">
      <div className="back-nav">
        <button className="back-btn" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          back
        </button>
      </div>
      <header className="detail-header">
        <h1>How it works</h1>
      </header>

      <main className="help-content">
        <p className="help-lead">Fast name recall, zero awkwardness.</p>

        <p>Can't place a face? You're covered.</p>

        <p>Create groups that make sense to <em>you</em> — "Ceramics Class", "Paul's Party", "Tuesday Regulars". Add names as you meet people. Notes for anything worth remembering.</p>

        <p>Heading to class? Tap the group. Boom — everyone's name, right there.</p>

        <p>Run into someone from Paul's party? Same thing.</p>

        <p className="help-closing">That's it.</p>
      </main>
    </div>
  );
}
