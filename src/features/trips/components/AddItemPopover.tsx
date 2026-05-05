import { useMemo, useState } from 'react';
import { useItems } from '@/hooks/useItems';
import { useAddTripItem } from '@/hooks/useTrips';
import { Modal } from '@/components/Modal';
import { ItemEditor } from '@/features/library/ItemEditor';

interface Props { tripId: string; onClose: () => void; existingItemIds: Set<string>; }

export function AddItemPopover({ tripId, onClose, existingItemIds }: Props) {
  const { data: items = [] } = useItems();
  const add = useAddTripItem(tripId);
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);

  const matches = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items.slice(0, 30);
    return items.filter(i => i.name.toLowerCase().includes(term)).slice(0, 30);
  }, [q, items]);

  async function pick(itemId: string) {
    if (existingItemIds.has(itemId)) { onClose(); return; }
    await add.mutateAsync({ item_id: itemId });
    onClose();
  }

  return (
    <>
      <Modal title="Item toevoegen" onClose={onClose}>
        <div className="space-y-4">
          <input className="input" autoFocus placeholder="Zoek in bibliotheek…"
                 value={q} onChange={e => setQ(e.target.value)} />
          <ul className="max-h-72 overflow-auto border border-rule rounded-md divide-y divide-rule">
            {matches.length === 0 && <li className="px-3 py-3 text-sm text-muted">Geen resultaten.</li>}
            {matches.map(item => (
              <li key={item.id}>
                <button onClick={() => pick(item.id)}
                        className="w-full text-left px-3 py-2 hover:bg-paper transition-colors flex items-center justify-between gap-3">
                  <span>{item.name}</span>
                  <span className="text-eyebrow text-muted">{item.default_category}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-rule pt-3">
            <p className="text-xs text-muted">Niet gevonden?</p>
            <button onClick={() => setCreating(true)} className="btn-ghost">+ Nieuw item</button>
          </div>
        </div>
      </Modal>
      {creating && <ItemEditor onClose={() => { setCreating(false); onClose(); }} />}
    </>
  );
}
