import { useState } from 'react';
import './App.css';
import { usePersons } from './db/hooks';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/schema';
import { ViewType } from './types/Navigation';
import { MainView } from './views/MainView';
import { ContextDetailView } from './views/ContextDetailView';
import { PersonDetailView } from './views/PersonDetailView';
import { AutoSaveForm } from './components/AutoSaveForm';
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

  const handleEditSave = async (name: string, context: string, notes?: string, contextTags?: string[]) => {
    if (editingPersonId) {
      await updatePerson(editingPersonId, { name, context, notes, contextTags });
    }
    navigateBack();
  };

  // Render based on view type
  switch (view.type) {
    case 'main':
      return (
        <div className="app">
          <MainView onNavigate={navigateTo} />
        </div>
      );

    case 'context-detail':
      return (
        <div className="app">
          <ContextDetailView
            key={view.context}
            context={view.context}
            onBack={navigateBack}
            onNavigate={navigateTo}
          />
        </div>
      );

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

    case 'add-person':
      return (
        <div className="app">
          <AutoSaveForm
            onComplete={navigateBack}
            onCancel={navigateBack}
            initialContext={view.initialContext}
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
            onCancel={navigateBack}
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
