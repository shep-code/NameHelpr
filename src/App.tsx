import { useState } from 'react';
import './App.css';
import { usePersons } from './db/hooks';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/schema';
import { ViewType } from './types/Navigation';
import { MainView } from './views/MainView';
import { ContextDetailView } from './views/ContextDetailView';
import { PersonDetailView } from './views/PersonDetailView';
import { HelpView } from './views/HelpView';
import { PersonForm } from './components/PersonForm';

function App() {
  const [view, setView] = useState<ViewType>({ type: 'main' });
  const [viewHistory, setViewHistory] = useState<ViewType[]>([]);
  const { updatePerson } = usePersons();

  // Get person for edit form
  const editingPersonId = view.type === 'edit-person' ? view.personId : null;
  const editingPerson = useLiveQuery(
    () => editingPersonId ? db.persons.get(editingPersonId) : undefined,
    [editingPersonId]
  );

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

  // Replace current view and drop the previous history item (e.g. person-detail)
  // so back-navigation skips over the edit flow entirely.
  const navigateReplace = (newView: ViewType) => {
    setViewHistory(prev => prev.slice(0, -1));
    setView(newView);
  };

  const handleEditSave = async (name: string, context: string, notes?: string, contextTags?: string[]) => {
    if (editingPersonId) {
      await updatePerson(editingPersonId, { name, context, notes, contextTags });
    }
    navigateReplace({ type: 'context-detail', context });
  };

  const handleEditCancel = () => {
    navigateReplace({ type: 'context-detail', context: editingPerson!.context });
  };

  // Render based on view type
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

    case 'person-detail':
      return (
        <div className="app">
          <PersonDetailView
            personId={view.personId}
            onBack={navigateBack}
            onNavigate={navigateTo}
          />
        </div>
      );


    case 'edit-person':
      if (!editingPerson) {
        return (
          <div className="app">
            <p>Loading...</p>
          </div>
        );
      }
      return (
        <div className="app">
          <PersonForm
            person={editingPerson}
            onSave={handleEditSave}
            onCancel={handleEditCancel}
          />
        </div>
      );

    default:
      return (
        <div className="app">
          <MainView onNavigate={navigateTo} />
        </div>
      );
  }
}

export default App;
