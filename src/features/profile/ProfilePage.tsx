import { useState, type FormEvent } from 'react';
import { useAuth, signOut } from '@/hooks/useAuth';
import { useHousehold } from '@/hooks/useHousehold';
import { usePersons, useCreatePerson, useDeletePerson } from '@/hooks/usePersons';

export function ProfilePage() {
  const { user } = useAuth();
  const { data: hh } = useHousehold();
  const { data: persons = [] } = usePersons();
  const createPerson = useCreatePerson();
  const deletePerson = useDeletePerson();

  const [newName, setNewName] = useState('');
  const [newIsChild, setNewIsChild] = useState(false);

  async function addPerson(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    await createPerson.mutateAsync({ name: newName.trim(), is_child: newIsChild });
    setNewName(''); setNewIsChild(false);
  }

  return (
    <div className="space-y-10">
      <header className="border-b border-rule pb-6">
        <p className="eyebrow">N° 05 · Profiel</p>
        <h1 className="text-h1 font-semibold mt-2 tracking-tight">Account &amp; huishouden.</h1>
      </header>

      <section className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-4">
          <p className="eyebrow mb-2">Account</p>
        </div>
        <div className="col-span-12 md:col-span-8 card p-5">
          <p className="text-sm text-muted">Email</p>
          <p className="mt-0.5 font-medium">{user?.email}</p>
          <button onClick={() => signOut()} className="btn-ghost mt-4">Uitloggen</button>
        </div>
      </section>

      <section className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-4">
          <p className="eyebrow mb-2">Huishouden</p>
        </div>
        <div className="col-span-12 md:col-span-8 card p-5">
          <p className="text-sm text-muted">Naam</p>
          <p className="mt-0.5 font-medium">{hh?.household?.name}</p>
          <p className="mt-3 text-sm text-muted">Jouw rol</p>
          <p className="mt-0.5 font-medium capitalize">{hh?.member?.role}</p>
        </div>
      </section>

      <section className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-4">
          <p className="eyebrow mb-2">Personen</p>
          <p className="text-sm text-muted">Iedereen voor wie je inpakt — ook kinderen zonder eigen account.</p>
        </div>
        <div className="col-span-12 md:col-span-8 card p-5">
          <ul className="divide-y divide-rule">
            {persons.map(p => (
              <li key={p.id} className="flex items-center justify-between py-2.5">
                <div>
                  <span className="font-medium">{p.name}</span>
                  {p.is_child && <span className="ml-2 text-eyebrow text-muted">kind</span>}
                </div>
                <button onClick={() => { if (window.confirm(`${p.name} verwijderen?`)) deletePerson.mutate(p.id); }}
                        className="text-xs text-muted hover:text-accent2">verwijder</button>
              </li>
            ))}
            {persons.length === 0 && <li className="py-3 text-sm text-muted">Nog geen personen.</li>}
          </ul>
          <form onSubmit={addPerson} className="mt-4 pt-4 border-t border-rule flex items-center gap-2">
            <input className="input flex-1" placeholder="naam" value={newName} onChange={e => setNewName(e.target.value)} />
            <label className="flex items-center gap-1.5 text-sm text-muted">
              <input type="checkbox" checked={newIsChild} onChange={e => setNewIsChild(e.target.checked)} />
              kind
            </label>
            <button className="btn-primary" disabled={createPerson.isPending}>+ Toevoegen</button>
          </form>
        </div>
      </section>
    </div>
  );
}
