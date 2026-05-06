import { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTrip, useToggleTripItem, useRemoveTripItem, useDuplicateTrip, useUpdateTrip } from '@/hooks/useTrips';
import { useRenameItem } from '@/hooks/useItems';
import { usePersons } from '@/hooks/usePersons';
import { useRealtimeTrip } from '@/hooks/useRealtimeTrip';
import { ItemRow } from './components/ItemRow';
import { AddItemPopover } from './components/AddItemPopover';
import { CloseTripModal } from './components/CloseTripModal';
import { QuickAddBar } from './components/QuickAddBar';
import type { Category, Trip, TripItem, Item } from '@/lib/types';

const CATEGORY_LABEL: Record<Category, string> = {
  todo: 'Todo',
  stuff: 'Stuff',
  kleren: 'Kleren',
  eten: 'Eten',
  electronica: 'Electronica',
  pharmacie: 'Pharmacie',
  spelletjes: 'Spelletjes',
};
const CATEGORY_ORDER: Category[] = ['todo', 'stuff', 'eten', 'electronica', 'pharmacie', 'spelletjes', 'kleren'];

type TabId = Category | `person-${string}` | `tag-${string}`;

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
  const [activeTab, setActiveTab] = useState<TabId>('stuff');
  const [adding, setAdding] = useState(false);
  const [closing, setClosing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');

  const personById = useMemo(() => new Map(persons.map(p => [p.id, p])), [persons]);

  if (isLoading) return <p className="text-sm text-muted">Laden…</p>;
  if (!data) return <p className="text-sm text-muted">Reis niet gevonden.</p>;
  const { trip, items, tagsByItemId, tagsById } = data;

  const totalChecked = items.filter(i => i.checked).length;
  const totalCount = items.length;
  const percent = totalCount === 0 ? 0 : Math.round((totalChecked / totalCount) * 100);

  // Build tabs: categories + tags + person tabs
  const itemsByCategory = new Map<Category, (TripItem & { item: Item })[]>();
  const itemsByTag = new Map<string, (TripItem & { item: Item })[]>();
  const itemsByPerson = new Map<string, (TripItem & { item: Item })[]>();
  const sharedKleren: (TripItem & { item: Item })[] = [];

  for (const it of items) {
    const cat = it.item.default_category;
    if (cat === 'kleren') {
      if (it.person_id) {
        const arr = itemsByPerson.get(it.person_id) ?? [];
        arr.push(it);
        itemsByPerson.set(it.person_id, arr);
      } else {
        sharedKleren.push(it);
      }
    } else {
      const arr = itemsByCategory.get(cat) ?? [];
      arr.push(it);
      itemsByCategory.set(cat, arr);
    }
    // Also group by tags
    const tagIds = tagsByItemId.get(it.item_id) ?? [];
    for (const tagId of tagIds) {
      const arr = itemsByTag.get(tagId) ?? [];
      arr.push(it);
      itemsByTag.set(tagId, arr);
    }
  }

  // Tab definitions — categories first
  const tabs: { id: TabId; label: string; count: number; checked: number; group?: string }[] = [];
  for (const cat of CATEGORY_ORDER) {
    if (cat === 'kleren') continue;
    const arr = itemsByCategory.get(cat);
    if (arr && arr.length > 0) {
      tabs.push({ id: cat, label: CATEGORY_LABEL[cat], count: arr.length, checked: arr.filter(i => i.checked).length });
    }
  }

  // Tag tabs (fiets, camper, zwemmen, etc.) — only tags with items on this trip
  const tagTabs: typeof tabs = [];
  for (const [tagId, tagItems] of itemsByTag) {
    const tag = tagsById.get(tagId);
    if (tag && tagItems.length > 0) {
      tagTabs.push({
        id: `tag-${tagId}`,
        label: tag.name.charAt(0).toUpperCase() + tag.name.slice(1),
        count: tagItems.length,
        checked: tagItems.filter(i => i.checked).length,
        group: 'tag',
      });
    }
  }
  tagTabs.sort((a, b) => a.label.localeCompare(b.label));

  // Shared kleren tab
  if (sharedKleren.length > 0) {
    tabs.push({ id: 'kleren', label: 'Kleren', count: sharedKleren.length, checked: sharedKleren.filter(i => i.checked).length });
  }

  // Person tabs
  const personTabs: typeof tabs = [];
  for (const person of persons) {
    const arr = itemsByPerson.get(person.id);
    if (arr && arr.length > 0) {
      personTabs.push({ id: `person-${person.id}`, label: person.name, count: arr.length, checked: arr.filter(i => i.checked).length, group: 'person' });
    }
  }

  const allTabs = [...tabs, ...tagTabs, ...personTabs];

  // Ensure activeTab is valid
  const validTab = allTabs.find(t => t.id === activeTab) ? activeTab : (allTabs[0]?.id ?? 'stuff');

  // Get items for current tab
  let tabItems: (TripItem & { item: Item })[] = [];
  if (validTab === 'kleren') {
    tabItems = sharedKleren;
  } else if (typeof validTab === 'string' && validTab.startsWith('person-')) {
    const personId = validTab.replace('person-', '');
    tabItems = itemsByPerson.get(personId) ?? [];
  } else if (typeof validTab === 'string' && validTab.startsWith('tag-')) {
    const tagId = validTab.replace('tag-', '');
    tabItems = itemsByTag.get(tagId) ?? [];
  } else {
    tabItems = itemsByCategory.get(validTab as Category) ?? [];
  }

  // Sort and filter
  tabItems = tabItems.slice().sort((a, b) => a.item.name.localeCompare(b.item.name));
  const searchTerm = search.trim().toLowerCase();
  if (searchTerm) tabItems = tabItems.filter(i => i.item.name.toLowerCase().includes(searchTerm));

  const currentTab = allTabs.find(t => t.id === validTab);
  const personName = typeof validTab === 'string' && validTab.startsWith('person-')
    ? personById.get(validTab.replace('person-', ''))?.name ?? null
    : null;

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

      {/* Tabs — scrollable like Excel sheet tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {tabs.map(t => <TabChip key={t.id} tab={t} active={validTab === t.id} onClick={() => { setActiveTab(t.id); setSearch(''); }} />)}
        {tagTabs.length > 0 && <span className="shrink-0 w-px h-5 bg-rule mx-1" />}
        {tagTabs.map(t => <TabChip key={t.id} tab={t} active={validTab === t.id} onClick={() => { setActiveTab(t.id); setSearch(''); }} />)}
        {personTabs.length > 0 && <span className="shrink-0 w-px h-5 bg-rule mx-1" />}
        {personTabs.map(t => <TabChip key={t.id} tab={t} active={validTab === t.id} onClick={() => { setActiveTab(t.id); setSearch(''); }} />)}
        <button onClick={() => setAdding(true)}
                className="shrink-0 px-3 py-1.5 rounded-md text-sm text-muted hover:text-ink hover:bg-rule transition-colors">
          + Item
        </button>
      </div>

      {/* Search */}
      <QuickAddBar tripId={tripId!} existingItemIds={new Set(items.map(i => i.item_id))} search={search} onSearchChange={setSearch} />

      {/* Item list — flat, like an Excel sheet */}
      <div className="card overflow-hidden">
        {tabItems.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted text-center">
            {searchTerm ? 'Geen resultaten.' : 'Geen items in dit tabblad.'}
          </p>
        ) : (
          tabItems.map(it => (
            <ItemRow
              key={it.id}
              name={it.item.name}
              qty={it.qty}
              checked={it.checked}
              personName={personName}
              onToggle={() => toggle.mutate({ id: it.id, checked: !it.checked })}
              onRemove={() => remove.mutate(it.id)}
              onRename={(newName) => renameItem.mutate({ id: it.item_id, name: newName })}
            />
          ))
        )}
      </div>

      {/* Tab progress */}
      {currentTab && (
        <p className="text-center text-xs text-muted num">
          {currentTab.checked} van {currentTab.count} afgevinkt
        </p>
      )}

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

function TabChip({ tab, active, onClick }: {
  tab: { label: string; count: number; checked: number };
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-md text-sm transition-colors whitespace-nowrap
                  ${active
                    ? 'bg-ink text-paper font-medium'
                    : 'bg-rule/50 text-muted hover:text-ink hover:bg-rule'}`}
    >
      {tab.label}
      <span className={`ml-1 text-xs num ${active ? 'text-paper/70' : 'text-muted'}`}>
        {tab.checked}/{tab.count}
      </span>
    </button>
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
