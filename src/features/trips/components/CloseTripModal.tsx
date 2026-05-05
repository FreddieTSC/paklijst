import { useMemo, useState } from 'react';
import { Modal } from '@/components/Modal';
import { useItems } from '@/hooks/useItems';
import { useCloseTrip, type CloseTripVerdict } from '@/hooks/useTrips';
import type { Item, TripContext, TripItem } from '@/lib/types';

type Verdict = 'used' | 'unused';

interface Props {
  tripId: string;
  context: TripContext;
  items: (TripItem & { item: Item })[];
  onClose: () => void;
  onClosed: () => void;
}

export function CloseTripModal({ tripId, context, items, onClose, onClosed }: Props) {
  // Default: checked items → 'used', unchecked → 'unused'. User can flip.
  const initial = useMemo<Record<string, Verdict>>(() => {
    const m: Record<string, Verdict> = {};
    for (const it of items) m[it.item_id] = it.checked ? 'used' : 'unused';
    return m;
  }, [items]);

  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>(initial);
  const [missing, setMissing] = useState<string[]>([]);
  const [missingQuery, setMissingQuery] = useState('');
  const { data: libItems = [] } = useItems();
  const close = useCloseTrip(tripId);

  // Items that exist in library but were NOT on this trip — candidates for "missed".
  const tripItemIds = useMemo(() => new Set(items.map(i => i.item_id)), [items]);
  const missingCandidates = useMemo(() => {
    const q = missingQuery.trim().toLowerCase();
    return libItems
      .filter(i => !tripItemIds.has(i.id))
      .filter(i => !missing.includes(i.id))
      .filter(i => !q || i.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [libItems, tripItemIds, missing, missingQuery]);

  const usedCount    = Object.values(verdicts).filter(v => v === 'used').length;
  const unusedCount  = Object.values(verdicts).filter(v => v === 'unused').length;

  function flip(itemId: string) {
    setVerdicts(v => ({ ...v, [itemId]: v[itemId] === 'used' ? 'unused' : 'used' }));
  }

  async function submit() {
    const payload: CloseTripVerdict[] = [
      ...Object.entries(verdicts).map(([item_id, verdict]) => ({ item_id, verdict })),
      ...missing.map(item_id => ({ item_id, verdict: 'missing' as const })),
    ];
    await close.mutateAsync({ verdicts: payload, context });
    onClosed();
  }

  // De-duplicate by item_id for display (one row per unique item, not per person).
  const uniqueItems = useMemo(() => {
    const seen = new Set<string>();
    return items.filter(it => {
      if (seen.has(it.item_id)) return false;
      seen.add(it.item_id);
      return true;
    }).sort((a, b) => a.item.name.localeCompare(b.item.name));
  }, [items]);

  return (
    <Modal title="Reis afsluiten" onClose={onClose}>
      <div className="space-y-5">
        <p className="text-sm text-muted">
          Markeer per item of je 't gebruikt of niet gebruikt hebt. De app onthoudt dit
          en gebruikt het bij volgende gelijkaardige reizen.
        </p>

        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 rounded-md bg-accent/10 text-accent num">{usedCount} gebruikt</span>
          <span className="px-2 py-1 rounded-md bg-accent2/10 text-accent2 num">{unusedCount} niet</span>
          {missing.length > 0 && (
            <span className="px-2 py-1 rounded-md bg-flag/10 text-flag num">{missing.length} gemist</span>
          )}
        </div>

        <div className="max-h-72 overflow-auto border border-rule rounded-md divide-y divide-rule">
          {uniqueItems.length === 0 && (
            <p className="px-3 py-3 text-sm text-muted">Deze reis had geen items.</p>
          )}
          {uniqueItems.map(it => {
            const v = verdicts[it.item_id];
            return (
              <button key={it.item_id} type="button" onClick={() => flip(it.item_id)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 hover:bg-paperX transition-colors text-left">
                <span className="text-[15px] tracking-tight truncate">{it.item.name}</span>
                <span className={`shrink-0 text-eyebrow px-2 py-1 rounded-md
                                 ${v === 'used' ? 'bg-accent text-paper' : 'bg-accent2/10 text-accent2'}`}>
                  {v === 'used' ? 'gebruikt' : 'niet gebruikt'}
                </span>
              </button>
            );
          })}
        </div>

        <div className="border-t border-rule pt-4">
          <p className="eyebrow mb-2">Iets gemist?</p>
          <input
            className="input"
            placeholder="zoek in bibliotheek…"
            value={missingQuery}
            onChange={e => setMissingQuery(e.target.value)}
          />
          {missing.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {missing.map(id => {
                const item = libItems.find(i => i.id === id);
                if (!item) return null;
                return (
                  <button key={id} type="button"
                          onClick={() => setMissing(m => m.filter(x => x !== id))}
                          className="chip chip-on">
                    {item.name} ×
                  </button>
                );
              })}
            </div>
          )}
          {missingQuery.trim() && missingCandidates.length > 0 && (
            <ul className="mt-2 border border-rule rounded-md divide-y divide-rule max-h-48 overflow-auto">
              {missingCandidates.map(c => (
                <li key={c.id}>
                  <button type="button"
                          onClick={() => { setMissing(m => [...m, c.id]); setMissingQuery(''); }}
                          className="w-full text-left px-3 py-2 hover:bg-paper text-sm">
                    + {c.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-rule pt-4">
          <button onClick={onClose} className="btn-ghost">Annuleer</button>
          <button onClick={submit} disabled={close.isPending} className="btn-primary">
            {close.isPending ? 'Afsluiten…' : 'Reis afsluiten'}
          </button>
        </div>

        {close.isError && (
          <p className="text-sm text-accent2">{(close.error as Error)?.message ?? 'Er ging iets mis.'}</p>
        )}
      </div>
    </Modal>
  );
}
