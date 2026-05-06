import { useState, useRef, useEffect } from 'react';

interface Props {
  name: string;
  qty?: number;
  checked: boolean;
  personName?: string | null;
  onToggle: () => void;
  onRemove: () => void;
  onRename?: (newName: string) => void;
}

export function ItemRow({ name, qty, checked, personName, onToggle, onRemove, onRename }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  function commitRename() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name && onRename) onRename(trimmed);
    setEditing(false);
  }

  function handleRemove() {
    const msg = personName
      ? `Dag ${personName}, weet je zeker dat je geen "${name}" wilt meenemen deze vakantie?`
      : `Wil je "${name}" zeker niet meenemen op deze vakantie?`;
    if (window.confirm(msg)) onRemove();
  }

  return (
    <div className={`flex items-center gap-2.5 px-3 md:px-4 py-1.5 md:py-2 border-b border-rule last:border-b-0 transition-colors
                     ${checked ? 'bg-paper/60' : ''}`}>
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                    ${checked ? 'bg-accent border-accent text-white' : 'border-muted/40 hover:border-accent'}`}
      >
        {checked && <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2.5 6l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </button>

      {/* Name */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            className="w-full bg-transparent text-sm tracking-tight text-ink outline-none border-b border-accent py-0.5"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') { setDraft(name); setEditing(false); }
            }}
          />
        ) : (
          <span
            onClick={() => { if (onRename) { setDraft(name); setEditing(true); } }}
            className={`text-sm tracking-tight transition-colors duration-200 select-none
                       ${onRename ? 'cursor-text' : ''}
                       ${checked ? 'line-through text-muted' : 'text-ink'}`}
          >
            {name}
            {qty && qty > 1 && <span className="num ml-1 text-xs text-muted">×{qty}</span>}
          </span>
        )}
      </div>

      {/* Remove */}
      <button
        onClick={handleRemove}
        className="text-muted/30 hover:text-accent2 transition-colors shrink-0 text-sm leading-none"
        aria-label="Verwijderen"
      >×</button>
    </div>
  );
}
