import { useState, type FormEvent } from 'react';
import { useHousehold } from '@/hooks/useHousehold';
import { usePersons, useCreatePerson, useDeletePerson } from '@/hooks/usePersons';
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '@/hooks/useTags';
import { iconFor } from '@/lib/tagIcons';
import type { TagKind, Tag } from '@/lib/types';

const TAG_KIND_LABELS: { value: TagKind; label: string }[] = [
  { value: 'triptype', label: 'Reistype' },
  { value: 'weather',  label: 'Weer' },
  { value: 'activity', label: 'Activiteit' },
  { value: 'custom',   label: 'Overig' },
];

const CATEGORY_LABELS: { value: string; label: string }[] = [
  { value: 'stuff',       label: 'Stuff' },
  { value: 'eten',        label: 'Eten' },
  { value: 'electronica', label: 'Electronica' },
  { value: 'pharmacie',   label: 'Pharmacie' },
  { value: 'spelletjes',  label: 'Spelletjes' },
  { value: 'kleren',      label: 'Kleren' },
  { value: 'todo',        label: 'TODOs' },
];

export function SettingsPage() {
  const { data: hh } = useHousehold();

  return (
    <div className="space-y-10">
      <header className="border-b border-rule pb-6">
        <h1 className="text-h1 font-semibold tracking-tight">Instellingen</h1>
        <p className="mt-1 text-sm text-muted">{hh?.household?.name ?? 'Huishouden'}</p>
      </header>

      <PersonsSection />
      <TagsSection />
      <CategoriesSection />
    </div>
  );
}

function PersonsSection() {
  const { data: persons = [] } = usePersons();
  const createPerson = useCreatePerson();
  const deletePerson = useDeletePerson();

  const [newName, setNewName] = useState('');
  const [newIsChild, setNewIsChild] = useState(false);
  const [adding, setAdding] = useState(false);

  async function addPerson(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    await createPerson.mutateAsync({ name: newName.trim(), is_child: newIsChild });
    setNewName('');
    setNewIsChild(false);
    setAdding(false);
  }

  return (
    <section className="grid grid-cols-12 gap-6">
      <div className="col-span-12 md:col-span-4">
        <p className="text-eyebrow mb-2">Personen</p>
      </div>
      <div className="col-span-12 md:col-span-8 card p-4">
        <div className="flex flex-wrap gap-1.5">
          {persons.map(p => (
            <span key={p.id} className="chip group flex items-center gap-1">
              {p.name}
              {p.is_child && <span className="text-muted text-[10px]">kind</span>}
              <button onClick={() => { if (window.confirm(`${p.name} verwijderen?`)) deletePerson.mutate(p.id); }}
                      className="ml-0.5 text-muted/40 hover:text-accent2 hidden group-hover:inline">×</button>
            </span>
          ))}
          {!adding && (
            <button onClick={() => setAdding(true)} className="chip text-muted hover:text-ink">+ persoon</button>
          )}
        </div>
        {adding && (
          <form onSubmit={addPerson} className="mt-3 pt-3 border-t border-rule flex items-center gap-2">
            <input className="input flex-1" placeholder="naam" value={newName} onChange={e => setNewName(e.target.value)} autoFocus />
            <label className="flex items-center gap-1.5 text-sm text-muted">
              <input type="checkbox" checked={newIsChild} onChange={e => setNewIsChild(e.target.checked)} />
              kind
            </label>
            <button className="btn-primary text-xs" disabled={createPerson.isPending}>Toevoegen</button>
            <button type="button" className="btn-ghost text-xs" onClick={() => setAdding(false)}>Annuleer</button>
          </form>
        )}
      </div>
    </section>
  );
}

function TagsSection() {
  const { data: tags = [] } = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const [addingKind, setAddingKind] = useState<TagKind | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  function startEdit(t: Tag) {
    setEditingId(t.id);
    setEditName(t.name);
  }

  async function commitEdit() {
    if (!editingId || !editName.trim()) return;
    await updateTag.mutateAsync({ id: editingId, name: editName.trim() });
    setEditingId(null);
  }

  async function addTag(e: FormEvent) {
    e.preventDefault();
    if (!addingKind || !newTagName.trim()) return;
    await createTag.mutateAsync({ name: newTagName.trim().toLowerCase(), kind: addingKind });
    setNewTagName('');
    setAddingKind(null);
  }

  return (
    <section className="grid grid-cols-12 gap-6">
      <div className="col-span-12 md:col-span-4">
        <p className="text-eyebrow mb-2">Tags</p>
        <p className="text-sm text-muted">Reistype, weer, activiteiten — bepalen welke items worden voorgesteld.</p>
      </div>
      <div className="col-span-12 md:col-span-8 space-y-4">
        {TAG_KIND_LABELS.map(kind => {
          const kindTags = tags.filter(t => t.kind === kind.value);
          return (
            <div key={kind.value} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-eyebrow">{kind.label}</p>
                <button onClick={() => { setAddingKind(kind.value); setNewTagName(''); }}
                        className="text-xs text-muted hover:text-ink">+ tag</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {kindTags.map(t => {
                  const icon = iconFor(t.name);
                  if (editingId === t.id) {
                    return (
                      <div key={t.id} className="flex items-center gap-1">
                        <input className="input text-sm w-28" value={editName}
                               onChange={e => setEditName(e.target.value)}
                               onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null); }}
                               autoFocus />
                        <button className="text-xs text-accent hover:text-ink" onClick={commitEdit}>ok</button>
                        <button className="text-xs text-muted" onClick={() => setEditingId(null)}>x</button>
                      </div>
                    );
                  }
                  return (
                    <span key={t.id} className="chip group flex items-center gap-1">
                      {icon && <span className="text-base leading-none">{icon}</span>}
                      <span onClick={() => startEdit(t)} className="cursor-text">{t.name}</span>
                      <button onClick={() => { if (window.confirm(`Tag "${t.name}" verwijderen?`)) deleteTag.mutate(t.id); }}
                              className="ml-0.5 text-muted/40 hover:text-accent2 hidden group-hover:inline">×</button>
                    </span>
                  );
                })}
                {kindTags.length === 0 && <span className="text-sm text-muted">Geen tags.</span>}
              </div>
              {addingKind === kind.value && (
                <form onSubmit={addTag} className="mt-3 pt-3 border-t border-rule flex items-center gap-2">
                  <input className="input flex-1" placeholder="tag naam" value={newTagName}
                         onChange={e => setNewTagName(e.target.value)} autoFocus />
                  <button className="btn-primary text-xs" disabled={createTag.isPending}>Toevoegen</button>
                  <button type="button" className="btn-ghost text-xs" onClick={() => setAddingKind(null)}>Annuleer</button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CategoriesSection() {
  return (
    <section className="grid grid-cols-12 gap-6">
      <div className="col-span-12 md:col-span-4">
        <p className="text-eyebrow mb-2">Categorieën</p>
        <p className="text-sm text-muted">Vaste categorieën voor het groeperen van items.</p>
      </div>
      <div className="col-span-12 md:col-span-8 card p-5">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_LABELS.map(c => (
            <span key={c.value} className="chip">{c.label}</span>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">Categorieën liggen vast in de app. Gebruik tags voor extra flexibiliteit.</p>
      </div>
    </section>
  );
}
