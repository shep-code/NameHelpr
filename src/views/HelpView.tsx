interface HelpViewProps {
  onBack: () => void;
}

export function HelpView({ onBack }: HelpViewProps) {
  return (
    <div className="help-view">
      <nav className="breadcrumb-row">
        <button className="breadcrumb-item" onClick={onBack}>Home</button>
      </nav>
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
