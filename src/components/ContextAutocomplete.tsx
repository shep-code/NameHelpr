import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';

interface ContextAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function ContextAutocomplete({ value, onChange, id = 'context', onFocus, onBlur }: ContextAutocompleteProps) {
  const contexts = useLiveQuery(async () => {
    const persons = await db.persons.toArray();
    const allContexts = new Set<string>();
    persons.forEach(p => {
      allContexts.add(p.context);
      p.contextTags?.forEach(tag => allContexts.add(tag));
    });
    return [...allContexts].sort();
  }, []);

  return (
    <div className="context-autocomplete">
      <input
        id={id}
        type="text"
        list="contexts"
        role="combobox"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        autoCapitalize="none"
        inputMode="text"
        placeholder="Paul's Party"
      />
      <datalist id="contexts">
        {contexts?.map((ctx) => (
          <option key={ctx} value={ctx} />
        ))}
      </datalist>
    </div>
  );
}
