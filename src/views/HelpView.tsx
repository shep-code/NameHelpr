interface HelpViewProps {
  onBack: () => void;
}

export function HelpView({ onBack }: HelpViewProps) {
  return (
    <div className="help-view">
      <header className="detail-header">
        <button className="home-btn" onClick={onBack} aria-label="Back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </button>
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
