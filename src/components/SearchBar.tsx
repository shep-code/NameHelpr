interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search names..." }: SearchBarProps) {
  return (
    <div className="search-bar">
      <input
        type="search"
        inputMode="search"
        autoCapitalize="none"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          className="clear-btn"
          onClick={() => onChange('')}
          type="button"
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
}
