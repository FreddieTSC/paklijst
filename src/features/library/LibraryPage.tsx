import { useMemo, useState } from 'react';
import { useItems, type ItemWithRelations } from '@/hooks/useItems';
import { useTags } from '@/hooks/useTags';
import { usePersons } from '@/hooks/usePersons';
import { ItemEditor } from './ItemEditor';
import type { Category } from '@/lib/types';

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

export function LibraryPage() {
  const { data: items = [], isLoading } = useItems();
  const { data: tags = [] } = useTags();
  const { data: persons = [] } = usePersons();
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<Category | 'all'>('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [personFilter, setPersonFilter] = useState<string | null>(null);
  const [editing, setEditing] = useState<ItemWithRelations | null>(null);
  const [creating, setCreating] = useState(false);

  const tagById = useMemo(() => new Map(tags.map(t => [t.id, t])), [tags]);
  const personById = useMemo(() => new Map(persons.map(p => [p.id, p])), [persons]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(i => {
      if (cat !== 'all' && i.default_category !== cat) return false;
      if (tagFilter && !i.tag_ids.includes(tagFilter)) return false;
      if (personFilter && !i.person_ids.includes(personFilter)) return false;
      if (q && !i.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, search, cat, tagFilter, personFilter]);

  return (
    <div className="grid grid-cols-12 gap-6">
      <header className="col-span-12 flex items-end justify-between gap-6 border-b border-rule pb-6">
        <div>
          <p className="eyebrow">N° 04 · Bibliotheek</p>
          <h1 className="text-h1 font-semibold mt-2">Alles wat je <em className="italic font-display">ooit</em> hebt meegenomen.</h1>
          <p className="mt-2 text-sm text-muted max-w-lg">{items.length} items, {tags.length} tags, {persons.length} personen.</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary shrink-0">+ Nieuw item</button>
      </header>

      {/* Filters */}
      <aside className="col-span-12 lg:col-span-3 lg:sticky lg:top-10 self-start space-y-6">
        <div>
          <label className="block">
            <span className="block text-eyebrow mb-2">Zoek</span>
            <input className="input" placeholder="op naam…" value={search} onChange={e => setSearch(e.target.value)} />
          </label>
        </div>
        <div>
          <p className="text-eyebrow mb-2">Categorie</p>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(c => (
              <button key={c.value} onClick={() => setCat(c.value)}
                className={`chip ${cat === c.value ? 'chip-on' : ''}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-eyebrow mb-2">Tag</p>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setTagFilter(null)} className={`chip ${!tagFilter ? 'chip-on' : ''}`}>geen filter</button>
            {tags.map(t => (
              <button key={t.id} onClick={() => setTagFilter(tagFilter === t.id ? null : t.id)}
                className={`chip ${tagFilter === t.id ? 'chip-on' : ''}`}>
                {t.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-eyebrow mb-2">Persoon</p>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setPersonFilter(null)} className={`chip ${!personFilter ? 'chip-on' : ''}`}>geen filter</button>
            {persons.map(p => (
              <button key={p.id} onClick={() => setPersonFilter(personFilter === p.id ? null : p.id)}
                className={`chip ${personFilter === p.id ? 'chip-on' : ''}`}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* List */}
      <section className="col-span-12 lg:col-span-9 min-w-0">
        {isLoading ? (
          <p className="text-sm text-muted">Laden…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted">Geen items met deze filters.</p>
        ) : (
          <ul className="card divide-y divide-rule">
            {filtered.map(item => (
              <li key={item.id}>
                <button onClick={() => setEditing(item)} className="w-full text-left flex items-start gap-4 px-4 py-3 hover:bg-paper transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium tracking-tight">{item.name}</span>
                      {item.kind === 'todo' && <span className="text-eyebrow text-flag">TODO</span>}
                      {item.wear_on_travel && <span className="text-eyebrow text-muted">aandoen</span>}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap text-[11px] text-muted">
                      <span className="uppercase tracking-wider">{item.default_category}</span>
                      {item.tag_ids.map(id => tagById.get(id)).filter(Boolean).map(t => (
                        <span key={t!.id} className="px-1.5 py-0.5 border border-rule rounded-sm">{t!.name}</span>
                      ))}
                      {item.person_ids.map(id => personById.get(id)).filter(Boolean).map(p => (
                        <span key={p!.id} className="px-1.5 py-0.5 border border-rule rounded-sm bg-paperX">{p!.name}</span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-muted shrink-0">bewerk →</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {creating && <ItemEditor onClose={() => setCreating(false)} />}
      {editing && <ItemEditor item={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
