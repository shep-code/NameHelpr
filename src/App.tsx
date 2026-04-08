import { useState } from 'react';
import './App.css';
import { ViewType } from './types/Navigation';
import { MainView } from './views/MainView';
import { ContextDetailView } from './views/ContextDetailView';
import { HelpView } from './views/HelpView';

function App() {
  const [view, setView] = useState<ViewType>({ type: 'main' });
  const [viewHistory, setViewHistory] = useState<ViewType[]>([]);

  const navigateTo = (newView: ViewType) => {
    setViewHistory(prev => [...prev, view]);
    setView(newView);
  };

  const navigateBack = () => {
    const prev = viewHistory[viewHistory.length - 1];
    if (prev) {
      setViewHistory(h => h.slice(0, -1));
      setView(prev);
    } else {
      setView({ type: 'main' });
    }
  };

  switch (view.type) {
    case 'main':
      return (
        <div className="app">
          <MainView onNavigate={navigateTo} />
        </div>
      );

    case 'help':
      return (
        <div className="app">
          <HelpView onBack={navigateBack} />
        </div>
      );

    case 'context-detail': {
      const prevView = viewHistory[viewHistory.length - 1];
      const fromContext = prevView?.type === 'context-detail'
        ? prevView.context
        : prevView?.type === 'main'
          ? ''
          : undefined;
      return (
        <div className="app">
          <ContextDetailView
            key={view.context}
            context={view.context}
            fromContext={fromContext}
            onBack={navigateBack}
            onNavigate={navigateTo}
          />
        </div>
      );
    }

    default:
      return (
        <div className="app">
          <MainView onNavigate={navigateTo} />
        </div>
      );
  }
}

export default App;
