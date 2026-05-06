import { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTrip, useToggleTripItem, useRemoveTripItem, useDuplicateTrip, useUpdateTrip } from '@/hooks/useTrips';
import { usePersons } from '@/hooks/usePersons';
import { useRealtimeTrip } from '@/hooks/useRealtimeTrip';
import { ItemRow } from './components/ItemRow';
import { AddItemPopover } from './components/AddItemPopover';
import { CloseTripModal } from './components/CloseTripModal';
import { QuickAddBar } from './components/QuickAddBar';
import type { Category, Trip, TripItem, Item } from '@/lib/types';

type Tab = 'pack' | 'todo' | 'wear';

const CATEGORY_LABEL: Record<Category, string> = {
  stuff: 'Stuff',
  eten: 'Eten',
  electronica: 'Electronica',
  pharmacie: 'Pharmacie',
  spelletjes: 'Spelletjes',
  kleren: 'Kleren',
  todo: 'TODOs',
};
const CATEGORY_ORDER: Category[] = ['stuff','kleren','pharmacie','electronica','eten','spelletjes','todo'];

export function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const nav = useNavigate();
  const { data, isLoading } = useTrip(tripId);
  useRealtimeTrip(tripId);
  const { data: persons = [] } = usePersons();
  const toggle = useToggleTripItem(tripId!);
  const remove = useRemoveTripItem(tripId!);
  const duplicate = useDuplicateTrip();
  const updateTrip = useUpdateTrip();
  const [tab, setTab] = useState<Tab>('pack');
  const [adding, setAdding] = useState(false);
  const [closing, setClosing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');

  const personById = useMemo(() => new Map(persons.map(p => [p.id, p])), [persons]);

  if (isLoading) return <p className="text-sm text-muted">Laden…</p>;
  if (!data) return <p className="text-sm text-muted">Reis niet gevonden.</p>;
  const { trip, items } = data;

  // Partition by tab
  const todoItems  = items.filter(i => i.item.kind === 'todo');
  const wearItems  = items.filter(i => i.item.kind === 'packable' && i.item.wear_on_travel);
  const packItems  = items.filter(i => i.item.kind === 'packable' && !i.item.wear_on_travel);
  const visibleAll = tab === 'pack' ? packItems : tab === 'todo' ? todoItems : wearItems;
  const searchTerm = search.trim().toLowerCase();
  const visible = searchTerm
    ? visibleAll.filter(i => i.item.name.toLowerCase().includes(searchTerm))
    : visibleAll;

  const totalChecked = items.filter(i => i.checked).length;
  const totalCount = items.length;
  const percent = totalCount === 0 ? 0 : Math.round((totalChecked / totalCount) * 100);

  return (
    <div className="space-y-6">
      <header className="border-b border-rule pb-6">
        <div className="flex items-baseline justify-between gap-4">
          <Link to="/trips" className="text-eyebrow text-muted hover:text-ink">← Reizen</Link>
          <div className="flex items-center gap-3">
            <span className="text-eyebrow text-muted">{trip.status}</span>
            <button onClick={() => setEditing(!editing)}
                    className="text-eyebrow text-muted hover:text-ink underline decoration-rule underline-offset-4 hover:decoration-ink">
              Bewerk
            </button>
            <button onClick={async () => {
              const t = await duplicate.mutateAsync(trip.id);
              nav(`/trips/${t.id}`);
            }} className="text-eyebrow text-muted hover:text-ink underline decoration-rule underline-offset-4 hover:decoration-ink">
              Dupliceer
            </button>
            {trip.status !== 'closed' && (
              <button onClick={() => setClosing(true)} className="text-eyebrow text-muted hover:text-ink underline decoration-rule underline-offset-4 hover:decoration-ink">
                Afsluiten
              </button>
            )}
          </div>
        </div>

        {editing ? (
          <EditTripForm trip={trip} onSave={async (updates) => {
            await updateTrip.mutateAsync({ tripId: trip.id, ...updates });
            setEditing(false);
          }} onCancel={() => setEditing(false)} />
        ) : (
          <>
            <h1 className="mt-3 text-h1 font-semibold tracking-tight">{trip.name}</h1>
            <div className="mt-2 flex items-center gap-4 text-sm text-muted num">
              {trip.start_date && trip.end_date && <span>{formatDate(trip.start_date)} → {formatDate(trip.end_date)}</span>}
              <span>{totalChecked}/{totalCount} ingepakt · {percent}%</span>
            </div>
          </>
        )}

        {/* Progress bar */}
        <div className="mt-3 h-1 bg-rule rounded-full overflow-hidden">
          <motion.div className="h-full bg-accent" initial={{ width: 0 }} animate={{ width: `${percent}%` }}
                      transition={{ type: 'spring', damping: 22, stiffness: 200 }} />
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-end gap-6 border-b border-rule">
        <TabBtn active={tab==='pack'} onClick={() => setTab('pack')} label="Inpakken" count={packItems.length} />
        <TabBtn active={tab==='todo'} onClick={() => setTab('todo')} label="Todo's" count={todoItems.length} />
        <TabBtn active={tab==='wear'} onClick={() => setTab('wear')} label="Aandoen" count={wearItems.length} />
        <div className="flex-1" />
        <button onClick={() => setAdding(true)} className="btn-ghost mb-2 text-sm">+ Item</button>
      </div>

      <QuickAddBar tripId={tripId!} existingItemIds={new Set(items.map(i => i.item_id))} search={search} onSearchChange={setSearch} />

      {/* List body — split by category, with per-person grouping inside */}
      <div className="space-y-8">
        {visible.length === 0
          ? <p className="text-sm text-muted">Niets in dit tabblad.</p>
          : groupByCategory(visible, tab).map(group => {
            const allRows = group.byPerson.flatMap(g => g.rows);
            const checkedCount = allRows.filter(r => r.checked).length;
            return (
            <section key={group.category}>
              <div className="flex items-baseline justify-between mb-2 px-1">
                <p className="eyebrow">{CATEGORY_LABEL[group.category]}</p>
                <p className="text-eyebrow text-muted num">{checkedCount}/{allRows.length}</p>
              </div>
              <div className="card overflow-hidden">
                {/* Within-category: sub-group by person if applicable */}
                {group.byPerson.length === 1 && group.byPerson[0].personId === null
                  ? renderRows(group.byPerson[0].rows)
                  : group.byPerson.map(sub => {
                    const pName = sub.personId ? personById.get(sub.personId)?.name ?? 'Persoon' : null;
                    return (
                      <div key={sub.personId ?? 'shared'}>
                        <div className="px-4 py-2 bg-paper border-b border-rule text-eyebrow text-muted">
                          {pName ?? 'Gedeeld'}
                        </div>
                        {renderRows(sub.rows, pName)}
                      </div>
                    );
                  })
                }
              </div>
            </section>
          );
          })
        }
      </div>

      <AnimatePresence>
        {adding && (
          <AddItemPopover
            tripId={tripId!}
            onClose={() => setAdding(false)}
            existingItemIds={new Set(items.map(i => i.item_id))}
          />
        )}
        {closing && (
          <CloseTripModal
            tripId={tripId!}
            context={trip.context}
            items={items}
            onClose={() => setClosing(false)}
            onClosed={() => { setClosing(false); nav('/trips'); }}
          />
        )}
      </AnimatePresence>
    </div>
  );

  function renderRows(rows: (TripItem & { item: Item })[], personName?: string | null) {
    return rows.map(it => (
      <ItemRow
        key={it.id}
        name={it.item.name}
        qty={it.qty}
        checked={it.checked}
        addedManually={it.added_manually}
        personName={personName}
        badge={it.item.wear_on_travel && tab === 'wear' ? null : (it.item.wear_on_travel ? 'AANDOEN' : null)}
        onToggle={() => toggle.mutate({ id: it.id, checked: !it.checked })}
        onRemove={() => remove.mutate(it.id)}
      />
    ));
  }
}

function TabBtn({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
            className={`relative pb-3 text-[15px] tracking-tight transition-colors
                        ${active ? 'text-ink font-medium' : 'text-muted hover:text-ink'}`}>
      {label} <span className="text-xs text-muted ml-1 num">{count}</span>
      {active && <motion.span layoutId="tab-underline"
                              className="absolute -bottom-px left-0 right-0 h-[2px] bg-ink"
                              transition={{ type: 'spring', damping: 24, stiffness: 380 }} />}
    </button>
  );
}

interface CatGroup {
  category: Category;
  byPerson: { personId: string | null; rows: (TripItem & { item: Item })[] }[];
}

function groupByCategory(items: (TripItem & { item: Item })[], tab: Tab): CatGroup[] {
  const map = new Map<Category, (TripItem & { item: Item })[]>();
  for (const it of items) {
    const cat = it.item.default_category;
    map.set(cat, [...(map.get(cat) ?? []), it]);
  }
  const groups: CatGroup[] = [];
  for (const cat of CATEGORY_ORDER) {
    const rows = map.get(cat);
    if (!rows || rows.length === 0) continue;
    if (tab === 'todo' && cat !== 'todo') continue;
    if (tab !== 'todo' && cat === 'todo') continue;
    // sub-group by person
    const byPersonMap = new Map<string | null, (TripItem & { item: Item })[]>();
    for (const r of rows) {
      const k = r.person_id;
      byPersonMap.set(k, [...(byPersonMap.get(k) ?? []), r]);
    }
    const byPerson = [...byPersonMap.entries()]
      .sort(([a], [b]) => (a === null ? -1 : b === null ? 1 : a.localeCompare(b)))
      .map(([personId, rows]) => ({ personId, rows: rows.sort((x,y) => x.item.name.localeCompare(y.item.name)) }));
    groups.push({ category: cat, byPerson });
  }
  return groups;
}

function EditTripForm({ trip, onSave, onCancel }: {
  trip: Trip;
  onSave: (updates: { name?: string; start_date?: string | null; end_date?: string | null }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(trip.name);
  const [start, setStart] = useState(trip.start_date ?? '');
  const [end, setEnd] = useState(trip.end_date ?? '');
  const [saving, setSaving] = useState(false);

  return (
    <div className="mt-3 space-y-3">
      <input className="input text-h2 font-semibold tracking-tight" value={name}
             onChange={e => setName(e.target.value)} autoFocus />
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-eyebrow mb-1">Vertrek</span>
          <input type="date" className="input num" value={start} onChange={e => setStart(e.target.value)} />
        </label>
        <label className="block">
          <span className="block text-eyebrow mb-1">Terug</span>
          <input type="date" className="input num" value={end} onChange={e => setEnd(e.target.value)} />
        </label>
      </div>
      <div className="flex gap-2">
        <button className="btn-primary" disabled={saving} onClick={async () => {
          setSaving(true);
          await onSave({ name: name.trim() || trip.name, start_date: start || null, end_date: end || null });
          setSaving(false);
        }}>{saving ? 'Opslaan…' : 'Opslaan'}</button>
        <button className="btn-ghost" onClick={onCancel}>Annuleer</button>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' });
}
