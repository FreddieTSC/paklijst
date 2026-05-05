import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { RPC } from '@/lib/db';
import { useAuth } from '@/hooks/useAuth';
import { AuthShell } from './AuthShell';

interface PersonDraft { name: string; is_child: boolean; }

export function OnboardingPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [hhName, setHhName] = useState('Familie');
  const [displayName, setDisplayName] = useState('');
  const [persons, setPersons] = useState<PersonDraft[]>([
    { name: '', is_child: false },
  ]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updatePerson(i: number, patch: Partial<PersonDraft>) {
    setPersons(ps => ps.map((p, idx) => idx === i ? { ...p, ...patch } : p));
  }
  function addPerson() { setPersons(ps => [...ps, { name: '', is_child: false }]); }
  function removePerson(i: number) { setPersons(ps => ps.filter((_, idx) => idx !== i)); }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    try {
      if (!user) throw new Error('Niet ingelogd.');
      const validPersons = persons.filter(p => p.name.trim());
      if (!hhName.trim() || !displayName.trim() || validPersons.length === 0) {
        throw new Error('Vul huishouden, je naam en minstens één persoon in.');
      }
      // Single atomic SECURITY DEFINER RPC: creates household + owner-member +
      // seeded tags + persons. Bypasses the chicken-and-egg between RLS SELECT
      // policy and INSERT...RETURNING for the just-created household.
      const { error: rpcErr } = await supabase.rpc(RPC.create_household, {
        p_name:         hhName.trim(),
        p_display_name: displayName.trim(),
        p_persons:      validPersons.map(p => ({ name: p.name.trim(), is_child: p.is_child })),
      });
      if (rpcErr) throw rpcErr;

      qc.invalidateQueries();
      nav('/trips', { replace: true });
    } catch (caught: unknown) {
      // Supabase errors are plain objects with `.message`/`.details`/`.hint`/`.code`.
      const msg =
        caught instanceof Error           ? caught.message :
        typeof caught === 'object' && caught !== null && 'message' in caught
                                           ? String((caught as { message: unknown }).message) :
        String(caught);
      console.error('[onboarding] failed:', caught);
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Stap één"
      title="Wie pakt er met je in?"
      prose="Geef je huishouden een naam en zet alle gezinsleden erbij. Kinderen zonder eigen account voeg je hier ook toe — ze krijgen een eigen kledingkast."
    >
      <form onSubmit={onSubmit} className="space-y-7">
        <label className="block">
          <span className="block text-eyebrow mb-2">Huishouden</span>
          <input className="input" value={hhName} onChange={e => setHhName(e.target.value)}
                 placeholder="bv. Familie van Doore" />
        </label>

        <label className="block">
          <span className="block text-eyebrow mb-2">Jouw naam (zoals je zichtbaar bent)</span>
          <input className="input" value={displayName} onChange={e => setDisplayName(e.target.value)}
                 placeholder="bv. Tiemen" />
        </label>

        <div>
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-eyebrow">Personen</span>
            <button type="button" className="text-xs underline decoration-rule hover:decoration-ink underline-offset-4"
                    onClick={addPerson}>Persoon toevoegen</button>
          </div>
          <div className="space-y-2">
            {persons.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <input className="input flex-1" placeholder="naam"
                       value={p.name} onChange={e => updatePerson(i, { name: e.target.value })} />
                <label className="flex items-center gap-1.5 text-sm text-muted">
                  <input type="checkbox" checked={p.is_child}
                         onChange={e => updatePerson(i, { is_child: e.target.checked })} />
                  kind
                </label>
                {persons.length > 1 && (
                  <button type="button" onClick={() => removePerson(i)}
                          className="w-9 h-9 rounded-md border-2 border-accent2 text-accent2 hover:bg-accent2 hover:text-paper transition-colors text-lg leading-none font-semibold">
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {err && <p className="text-sm text-accent2">{err}</p>}
        <button disabled={loading} className="btn-primary w-full">
          {loading ? 'Aan het maken…' : 'Huishouden maken'}
        </button>
      </form>
    </AuthShell>
  );
}
