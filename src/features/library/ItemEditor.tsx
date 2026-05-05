import { useState, type FormEvent } from 'react';
import { useUpsertItem, useDeleteItem, type ItemDraft, type ItemWithRelations } from '@/hooks/useItems';
import { useTags, useCreateTag } from '@/hooks/useTags';
import { usePersons } from '@/hooks/usePersons';
import type { Category, ItemKind } from '@/lib/types';
import { Modal } from '@/components/Modal';

const CATS: { value: Category; label: string }[] = [
  { value: 'stuff', label: 'Stuff' },
  { value: 'eten', label: 'Eten' },
  { value: 'electronica', label: 'Electronica' },
  { value: 'pharmacie', label: 'Pharmacie' },
  { value: 'spelletjes', label: 'Spelletjes' },
  { value: 'kleren', label: 'Kleren' },
  { value: 'todo', label: 'TODOs' },
];

export function ItemEditor({ item, onClose }: { item?: ItemWithRelations; onClose: () => void }) {
  const upsert = useUpsertItem();
  const del = useDeleteItem();
  const { data: tags = [] } = useTags();
  const { data: persons = [] } = usePersons();
  const createTag = useCreateTag();

  const [draft, setDraft] = useState<ItemDraft>({
    id: item?.id,
    name: item?.name ?? '',
    kind: (item?.kind ?? 'packable') as ItemKind,
    default_category: (item?.default_category ?? 'stuff') as Category,
    wear_on_travel: item?.wear_on_travel ?? false,
    notes: item?.notes ?? '',
    qty: item?.qty ?? 1,
    tag_ids: item?.tag_ids ?? [],
    person_ids: item?.person_ids ?? [],
  });
  const [newTag, setNewTag] = useState('');
  const [err, setErr] = useState<string | null>(null);

  function toggle<T>(arr: T[], v: T): T[] { return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]; }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!draft.name.trim()) { setErr('Geef een naam.'); return; }
    try { await upsert.mutateAsync({ ...draft, name: draft.name.trim() }); onClose(); }
    catch (caught) {
      const msg =
        caught instanceof Error           ? caught.message :
        typeof caught === 'object' && caught !== null && 'message' in caught
                                           ? String((caught as { message: unknown }).message) :
        String(caught);
      console.error('[item-editor] failed:', caught);
      setErr(msg);
    }
  }

  async function onDelete() {
    if (!item) return;
    if (!window.confirm(`"${item.name}" verwijderen uit de bibliotheek?`)) return;
    await del.mutateAsync(item.id);
    onClose();
  }

  async function addNewTag() {
    const name = newTag.trim();
    if (!name) return;
    const t = await createTag.mutateAsync({ name, kind: 'custom' });
    setDraft(d => ({ ...d, tag_ids: [...d.tag_ids, t.id] }));
    setNewTag('');
  }

  const tagsByKind = ['triptype', 'weather', 'activity', 'custom'].map(kind => ({
    kind, tags: tags.filter(t => t.kind === kind),
  }));

  return (
    <Modal onClose={onClose} title={item ? 'Item bewerken' : 'Nieuw item'}>
      <form onSubmit={onSubmit} className="space-y-5">
        <label className="block">
          <span className="block text-eyebrow mb-2">Naam</span>
          <input className="input" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} autoFocus />
        </label>

        <div className="grid grid-cols-3 gap-3">
          <label className="block col-span-2">
            <span className="block text-eyebrow mb-2">Soort</span>
            <div className="flex gap-2">
              {(['packable','todo'] as ItemKind[]).map(k => (
                <button key={k} type="button"
                  onClick={() => setDraft({ ...draft, kind: k, default_category: k === 'todo' ? 'todo' : draft.default_category })}
                  className={`chip flex-1 justify-center ${draft.kind === k ? 'chip-on' : ''}`}>
                  {k === 'packable' ? 'Inpakken' : 'TODO'}
                </button>
              ))}
            </div>
          </label>
          {draft.kind === 'packable' && (
            <label className="block">
              <span className="block text-eyebrow mb-2">Aantal</span>
              <input type="number" min={1} max={99} className="input num text-center"
                     value={draft.qty}
                     onChange={e => setDraft({ ...draft, qty: Math.max(1, parseInt(e.target.value) || 1) })} />
            </label>
          )}
          <label className="block col-span-3">
            <span className="block text-eyebrow mb-2">Categorie</span>
            <select className="input" value={draft.default_category}
                    onChange={e => setDraft({ ...draft, default_category: e.target.value as Category })}>
              {CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </label>
        </div>

        {draft.kind === 'packable' && (
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={draft.wear_on_travel}
                   onChange={e => setDraft({ ...draft, wear_on_travel: e.target.checked })} />
            <span><span className="text-ink font-medium">Aandoen</span> tijdens reis (niet inpakken)</span>
          </label>
        )}

        {persons.length > 0 && (
          <div>
            <p className="text-eyebrow mb-2">Voor wie?</p>
            <div className="flex flex-wrap gap-1.5">
              {persons.map(p => (
                <button key={p.id} type="button"
                  onClick={() => setDraft(d => ({ ...d, person_ids: toggle(d.person_ids, p.id) }))}
                  className={`chip ${draft.person_ids.includes(p.id) ? 'chip-on' : ''}`}>
                  {p.name}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted">Leeg = gedeeld item (niet aan één persoon gebonden).</p>
          </div>
        )}

        <div>
          <p className="text-eyebrow mb-2">Tags</p>
          {tagsByKind.map(group => group.tags.length > 0 && (
            <div key={group.kind} className="mb-2">
              <p className="text-[10px] uppercase tracking-wider text-muted mb-1">{group.kind}</p>
              <div className="flex flex-wrap gap-1.5">
                {group.tags.map(t => (
                  <button key={t.id} type="button"
                    onClick={() => setDraft(d => ({ ...d, tag_ids: toggle(d.tag_ids, t.id) }))}
                    className={`chip ${draft.tag_ids.includes(t.id) ? 'chip-on' : ''}`}>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input className="input flex-1" placeholder="nieuwe tag…" value={newTag}
                   onChange={e => setNewTag(e.target.value)}
                   onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addNewTag(); } }} />
            <button type="button" className="btn-ghost" onClick={addNewTag}>Toevoegen</button>
          </div>
        </div>

        <label className="block">
          <span className="block text-eyebrow mb-2">Notitie</span>
          <textarea className="input" rows={2} value={draft.notes ?? ''}
                    onChange={e => setDraft({ ...draft, notes: e.target.value })}
                    placeholder="optioneel — bv. aantal of specifieke variant" />
        </label>

        {err && <p className="text-sm text-accent2">{err}</p>}

        <div className="flex items-center justify-between pt-2">
          {item ? (
            <button type="button" onClick={onDelete} className="btn-danger">Verwijderen</button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">Annuleer</button>
            <button type="submit" disabled={upsert.isPending} className="btn-primary">
              {upsert.isPending ? 'Bezig…' : (item ? 'Opslaan' : 'Aanmaken')}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
