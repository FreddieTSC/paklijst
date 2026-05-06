import { useMemo, useState } from 'react';
import { useItems } from '@/hooks/useItems';
import { useAddTripItem } from '@/hooks/useTrips';

interface Props {
  tripId: string;
  existingItemIds: Set<string>;
  search: string;
  onSearchChange: (v: string) => void;
}

export function QuickAddBar({ tripId, existingItemIds, search, onSearchChange }: Props) {
  const { data: items = [] } = useItems();
  const add = useAddTripItem(tripId);
  const [open, setOpen] = useState(false);

  const suggestions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return items
      .filter(i => i.name.toLowerCase().includes(term))
      .filter(i => !existingItemIds.has(i.id))
      .slice(0, 6);
  }, [search, items, existingItemIds]);

  async function pick(itemId: string) {
    await add.mutateAsync({ item_id: itemId });
    onSearchChange('');
    setOpen(false);
  }

  return (
    <div className="relative">
      <input
        className="input"
        placeholder="Zoek in lijst of voeg toe…"
        value={search}
        onChange={e => { onSearchChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && search.trim() && suggestions.length > 0 && (
        <ul className="absolute z-30 left-0 right-0 mt-1 bg-white border border-rule rounded-md shadow-card divide-y divide-rule overflow-hidden">
          <li className="px-3 py-1.5 text-[11px] text-muted uppercase tracking-wide bg-paper">Toevoegen aan reis</li>
          {suggestions.map(i => (
            <li key={i.id}>
              <button onMouseDown={e => e.preventDefault()} onClick={() => pick(i.id)}
                      className="w-full text-left px-3 py-2 hover:bg-paper transition-colors flex items-center justify-between gap-3">
                <span>
                  {i.name}
                  {i.qty > 1 && <span className="num text-sm text-muted ml-2">× {i.qty}</span>}
                </span>
                <span className="text-eyebrow text-muted">{i.default_category}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
