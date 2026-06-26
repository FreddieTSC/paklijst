import { useMemo, useState, useRef } from 'react';
import { useItems, useUpsertItem } from '@/hooks/useItems';
import { useAddTripItem } from '@/hooks/useTrips';

interface Props {
  tripId: string;
  existingItemIds: Set<string>;
  search: string;
  onSearchChange: (v: string) => void;
}

export function QuickAddBar({ tripId, existingItemIds, search, onSearchChange }: Props) {
  const { data: items = [] } = useItems();
  const addToTrip = useAddTripItem(tripId);
  const createItem = useUpsertItem();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const term = search.trim().toLowerCase();

  const suggestions = useMemo(() => {
    if (!term) return [];
    return items
      .filter(i => i.name.toLowerCase().includes(term))
      .slice(0, 8);
  }, [term, items]);

  const exactMatch = useMemo(
    () => items.find(i => i.name.toLowerCase() === term),
    [term, items],
  );

  async function addExisting(itemId: string) {
    if (existingItemIds.has(itemId)) {
      onSearchChange('');
      setOpen(false);
      return;
    }
    setAdding(true);
    try {
      await addToTrip.mutateAsync({ item_id: itemId });
      onSearchChange('');
      setOpen(false);
    } finally {
      setAdding(false);
    }
  }

  async function addNew() {
    if (!term) return;
    if (exactMatch) {
      await addExisting(exactMatch.id);
      return;
    }
    setAdding(true);
    try {
      const itemId = await createItem.mutateAsync({
        name: search.trim(),
        kind: 'packable',
        default_category: 'stuff',
        wear_on_travel: false,
        notes: null,
        qty: 1,
        qty_per_day: false,
        tag_ids: [],
        person_ids: [],
      });
      await addToTrip.mutateAsync({ item_id: itemId });
      onSearchChange('');
      setOpen(false);
    } finally {
      setAdding(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && term) {
      e.preventDefault();
      addNew();
    }
    if (e.key === 'Escape') {
      onSearchChange('');
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          className="input flex-1"
          placeholder="Voeg toe… bv. Zonnebril"
          value={search}
          onChange={e => { onSearchChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          onKeyDown={handleKeyDown}
          disabled={adding}
        />
        {term && (
          <button
            onMouseDown={e => e.preventDefault()}
            onClick={addNew}
            disabled={adding}
            className="btn-primary shrink-0 px-4"
          >
            {adding ? '…' : '+'}
          </button>
        )}
      </div>

      {open && term && suggestions.length > 0 && (
        <ul className="absolute z-30 left-0 right-0 mt-1 bg-white border border-rule rounded-md shadow-card overflow-hidden">
          {suggestions.map(i => {
            const inTrip = existingItemIds.has(i.id);
            return (
              <li key={i.id}>
                <button
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => addExisting(i.id)}
                  disabled={inTrip}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors
                             ${inTrip ? 'opacity-40' : 'active:bg-paper/80'}`}
                >
                  <span className="text-sm">{i.name}</span>
                  <span className="text-[11px] text-muted shrink-0">
                    {inTrip ? 'al in lijst' : i.default_category}
                  </span>
                </button>
              </li>
            );
          })}
          {!exactMatch && (
            <li className="border-t border-rule">
              <button
                onMouseDown={e => e.preventDefault()}
                onClick={addNew}
                className="w-full text-left px-4 py-3 active:bg-paper/80 transition-colors text-sm text-accent font-medium"
              >
                + "{search.trim()}" toevoegen
              </button>
            </li>
          )}
        </ul>
      )}

      {open && term && suggestions.length === 0 && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-rule rounded-md shadow-card overflow-hidden">
          <button
            onMouseDown={e => e.preventDefault()}
            onClick={addNew}
            className="w-full text-left px-4 py-3 active:bg-paper/80 transition-colors text-sm text-accent font-medium"
          >
            + "{search.trim()}" toevoegen
          </button>
        </div>
      )}
    </div>
  );
}
