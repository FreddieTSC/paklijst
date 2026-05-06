import { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTrip, useToggleTripItem, useRemoveTripItem, useDuplicateTrip, useUpdateTrip } from '@/hooks/useTrips';
import { useRenameItem } from '@/hooks/useItems';
import { usePersons } from '@/hooks/usePersons';
import { useRealtimeTrip } from '@/hooks/useRealtimeTrip';
import { iconFor } from '@/lib/tagIcons';
import { ItemRow } from './components/ItemRow';
import { AddItemPopover } from './components/AddItemPopover';
import { CloseTripModal } from './components/CloseTripModal';
import { QuickAddBar } from './components/QuickAddBar';
import type { Category, Trip } from '@/lib/types';

const CATEGORIES: { value: Category | 'all'; label: string }[] = [
  { value: 'all', label: 'Alles' },
  { value: 'stuff', label: 'Stuff' },
  { value: 'eten', label: 'Eten' },
  { value: 'electronica', label: 'Electronica' },
  { value: 'pharmacie', label: 'Pharmacie' },
  { value: 'spelletjes', label: 'Spelletjes' },
  { value: 'kleren', label: 'Kleren' },
  { value: 'todo', label: 'TODOs' },
];

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
  const renameItem = useRenameItem();
  const [adding, setAdding] = useState(false);
  const [closing, setClosing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<Category | 'all'>('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [personFilter, setPersonFilter] = useState<string | null>(null);

  const personById = useMemo(() => new Map(persons.map(p => [p.id, p])), [persons]);

  if (isLoading) return <p className="text-sm text-muted">Laden…</p>;
  if (!data) return <p className="text-sm text-muted">Reis niet gevonden.</p>;
  const { trip, items, tagsByItemId, tagsById } = data;

  const totalChecked = items.filter(i => i.checked).length;
  const totalCount = items.length;
  const percent = totalCount === 0 ? 0 : Math.round((totalChecked / totalCount) * 100);

  // Collect which tags and persons exist on this trip
  const tripTagIds = new Set<string>();
  const tripPersonIds = new Set<string>();
  for (const it of items) {
    if (it.person_id) tripPersonIds.add(it.person_id);
    for (const tagId of (tagsByItemId.get(it.item_id) ?? [])) tripTagIds.add(tagId);
  }
  const tripTags = [...tripTagIds].map(id => tagsById.get(id)).filter(Boolean).sort((a, b) => a!.name.localeCompare(b!.name));
  const tripPersons = persons.filter(p => tripPersonIds.has(p.id));

  // Filter items
  const searchTerm = search.trim().toLowerCase();
  const filtered = items.filter(it => {
    if (catFilter !== 'all' && it.item.default_category !== catFilter) return false;
    if (tagFilter && !(tagsByItemId.get(it.item_id) ?? []).includes(tagFilter)) return false;
    if (personFilter && it.person_id !== personFilter) return false;
    if (searchTerm && !it.item.name.toLowerCase().includes(searchTerm)) return false;
    return true;
  }).sort((a, b) => a.item.name.localeCompare(b.item.name));

  const filteredChecked = filtered.filter(i => i.checked).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="border-b border-rule pb-4">
        <div className="flex items-baseline justify-between gap-4">
          <Link to="/trips" className="text-eyebrow text-muted hover:text-ink">← Reizen</Link>
          <div className="flex items-center gap-3">
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
            <Link to="/library" className="text-eyebrow text-muted hover:text-ink underline decoration-rule underline-offset-4 hover:decoration-ink">
              Bibliotheek
            </Link>
          </div>
        </div>

        {editing ? (
          <EditTripForm trip={trip} onSave={async (updates) => {
            await updateTrip.mutateAsync({ tripId: trip.id, ...updates });
            setEditing(false);
          }} onCancel={() => setEditing(false)} />
        ) : (
          <>
            <h1 className="mt-2 text-h1 font-semibold tracking-tight">{trip.name}</h1>
            <div className="mt-1 flex items-center gap-4 text-sm text-muted num">
              {trip.start_date && trip.end_date && <span>{formatDate(trip.start_date)} → {formatDate(trip.end_date)}</span>}
              <span>{totalChecked}/{totalCount} ingepakt · {percent}%</span>
            </div>
          </>
        )}

        <div className="mt-3 h-1 bg-rule rounded-full overflow-hidden">
          <motion.div className="h-full bg-accent" initial={{ width: 0 }} animate={{ width: `${percent}%` }}
                      transition={{ type: 'spring', damping: 22, stiffness: 200 }} />
        </div>
      </header>

      {/* Filters */}
      <div className="space-y-3">
        <div>
          <p className="text-eyebrow mb-1.5">Categorie</p>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(c => (
              <button key={c.value} onClick={() => setCatFilter(c.value)}
                className={`chip ${catFilter === c.value ? 'chip-on' : ''}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
        {tripTags.length > 0 && (
          <div>
            <p className="text-eyebrow mb-1.5">Tag</p>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setTagFilter(null)}
                className={`chip ${!tagFilter ? 'chip-on' : ''}`}>geen filter</button>
              {tripTags.map(tag => {
                const icon = iconFor(tag!.name);
                return (
                  <button key={tag!.id} onClick={() => setTagFilter(tagFilter === tag!.id ? null : tag!.id)}
                    className={`chip ${tagFilter === tag!.id ? 'chip-on' : ''}`}>
                    {icon && <span className="mr-1.5 text-base leading-none">{icon}</span>}
                    {tag!.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {tripPersons.length > 0 && (
          <div>
            <p className="text-eyebrow mb-1.5">Persoon</p>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setPersonFilter(null)}
                className={`chip ${!personFilter ? 'chip-on' : ''}`}>geen filter</button>
              {tripPersons.map(p => (
                <button key={p.id} onClick={() => setPersonFilter(personFilter === p.id ? null : p.id)}
                  className={`chip ${personFilter === p.id ? 'chip-on' : ''}`}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search + quick add */}
      <QuickAddBar tripId={tripId!} existingItemIds={new Set(items.map(i => i.item_id))} search={search} onSearchChange={setSearch} />

      {/* Item list */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted num">{filteredChecked}/{filtered.length} afgevinkt</p>
        <button onClick={() => setAdding(true)}
                className="text-eyebrow text-muted hover:text-ink underline decoration-rule underline-offset-4 hover:decoration-ink">
          + Item
        </button>
      </div>
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted text-center">
            {searchTerm ? 'Geen resultaten.' : 'Geen items met deze filters.'}
          </p>
        ) : (
          filtered.map(it => (
            <ItemRow
              key={it.id}
              name={it.item.name}
              qty={it.qty}
              checked={it.checked}
              personName={it.person_id ? personById.get(it.person_id)?.name ?? null : null}
              onToggle={() => toggle.mutate({ id: it.id, checked: !it.checked })}
              onRemove={() => remove.mutate(it.id)}
              onRename={(newName) => renameItem.mutate({ id: it.item_id, name: newName })}
            />
          ))
        )}
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
