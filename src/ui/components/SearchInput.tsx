import { useState, useEffect, useRef } from 'preact/hooks';

interface SearchInputProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function SearchInput({ onSearch, placeholder = 'Search...', debounceMs = 250 }: SearchInputProps) {
  const [value, setValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearch(value);
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, debounceMs, onSearch]);

  return (
    <div class="search-input-wrapper">
      <input
        class="form-input search-input"
        type="text"
        placeholder={placeholder}
        value={value}
        onInput={(e) => setValue((e.target as HTMLInputElement).value)}
      />
      {value && (
        <button
          class="search-clear"
          onClick={() => setValue('')}
          title="Clear search"
        >
          x
        </button>
      )}
    </div>
  );
}
