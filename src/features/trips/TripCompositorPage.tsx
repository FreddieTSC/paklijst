import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useItems } from '@/hooks/useItems';
import { useTags } from '@/hooks/useTags';
import { usePersons } from '@/hooks/usePersons';
import { useCreateTrip } from '@/hooks/useTrips';
import { generateTripItems, type Library, type Context } from '@/lib/generator';
import { supabase } from '@/lib/supabase';
import { T } from '@/lib/db';
import { useQuery } from '@tanstack/react-query';
import { useHousehold } from '@/hooks/useHousehold';
import type { TripFeedback } from '@/lib/types';
import { ChipGroup } from './components/ChipGroup';

export function TripCompositorPage() {
  const nav = useNavigate();
  const { data: items = [] } = useItems();
  const { data: tags = [] } = useTags();
  const { data: persons = [] } = usePersons();
  const { data: hh } = useHousehold();
  const createTrip = useCreateTrip();

  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [selPersons, setSelPersons] = useState<string[]>([]);
  const [selTriptypes, setSelTriptypes] = useState<string[]>([]);
  const [selWeather, setSelWeather] = useState<string[]>([]);
  const [selActivities, setSelActivities] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);

  // Pull all feedback rows for this household so generator can use them.
  const { data: feedback = [] } = useQuery<TripFeedback[]>({
    queryKey: ['trip_feedback_all', hh?.household?.id],
    enabled: !!hh?.household?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(T.trip_feedback)
        .select(`*, ${T.trip}!inner(household_id)`)
        .eq(`${T.trip}.household_id`, hh!.household!.id);
      if (error) throw error;
      return (data ?? []) as unknown as TripFeedback[];
    },
  });

  const triptypeTags  = tags.filter(t => t.kind === 'triptype');
  const weatherTags   = tags.filter(t => t.kind === 'weather');
  const activityTags  = tags.filter(t => t.kind === 'activity');
  const customTags    = tags.filter(t => t.kind === 'custom');

  const days = useMemo(() => {
    if (!start || !end) return undefined;
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (!Number.isFinite(ms) || ms < 0) return undefined;
    return Math.max(1, Math.round(ms / 86_400_000) + 1);
  }, [start, end]);

  const ctx: Context = useMemo(() => ({
    persons:    selPersons,
    triptypes:  tagNamesByIds(selTriptypes,  triptypeTags),
    weather:    tagNamesByIds(selWeather,   weatherTags),
    activities: tagNamesByIds([...selActivities], [...activityTags, ...customTags]),
    days,
  }), [selPersons, selTriptypes, selWeather, selActivities, triptypeTags, weatherTags, activityTags, customTags, days]);

  const lib: Library = useMemo(() => ({
    items: items.map(i => ({ id: i.id, name: i.name, kind: i.kind, default_category: i.default_category, qty: i.qty, qty_per_day: i.qty_per_day })),
    tags: tags.map(t => ({ id: t.id, name: t.name, kind: t.kind })),
    itemTags: items.flatMap(i => i.tag_ids.map(tag_id => ({ item_id: i.id, tag_id }))),
    itemForPerson: items.flatMap(i => i.person_ids.map(person_id => ({ item_id: i.id, person_id }))),
    persons: persons.map(p => ({ id: p.id, name: p.name })),
    feedback: feedback.map(f => ({
      item_id: f.item_id, verdict: f.verdict, context_snapshot: f.context_snapshot,
    })),
  }), [items, tags, persons, feedback]);

  const drafts = useMemo(() => generateTripItems(lib, ctx), [lib, ctx]);
  const todoCount = drafts.filter(d => {
    const it = items.find(i => i.id === d.item_id);
    return it?.kind === 'todo';
  }).length;
  const packCount = drafts.length - todoCount;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!name.trim()) { setErr('Geef je reis een naam.'); return; }
    try {
      const trip = await createTrip.mutateAsync({
        name: name.trim(),
        start_date: start || null,
        end_date: end || null,
        context: ctx,
        drafts,
      });
      nav(`/trips/${trip.id}`, { replace: true });
    } catch (caught) {
      const msg =
        caught instanceof Error           ? caught.message :
        typeof caught === 'object' && caught !== null && 'message' in caught
                                           ? String((caught as { message: unknown }).message) :
        String(caught);
      console.error('[trip-compositor] failed:', caught);
      setErr(msg);
    }
  }

  return (
    <div className="grid grid-cols-12 gap-6 lg:gap-10">
      <header className="col-span-12 border-b border-rule pb-6">
        <p className="eyebrow">N° 02 · Compositor</p>
        <h1 className="text-h1 font-semibold mt-2 tracking-tight">Een nieuwe reis.</h1>
        <p className="mt-2 text-sm text-muted max-w-xl">Geef de reis een naam en kies wie er meegaat, wat voor reis het is en welk weer je verwacht. De app stelt de lijst voor je samen.</p>
      </header>

      <form onSubmit={onSubmit} className="col-span-12 lg:col-span-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block sm:col-span-3">
            <span className="block text-eyebrow mb-2">Naam</span>
            <input className="input" value={name} onChange={e => setName(e.target.value)}
                   placeholder="bv. Berlijn — okt 2026" autoFocus />
          </label>
          <label className="block">
            <span className="block text-eyebrow mb-2">Vertrek</span>
            <input type="date" className="input num" value={start} onChange={e => setStart(e.target.value)} />
          </label>
          <label className="block">
            <span className="block text-eyebrow mb-2">Terug</span>
            <input type="date" className="input num" value={end} onChange={e => setEnd(e.target.value)} />
          </label>
        </div>

        <ChipGroup
          eyebrow="01"
          title="Wie gaat mee?"
          options={persons.map(p => ({ id: p.id, label: p.name }))}
          selected={selPersons}
          onToggle={id => setSelPersons(toggle(selPersons, id))}
        />
        <ChipGroup
          eyebrow="02"
          title="Wat voor reis?"
          options={triptypeTags.map(t => ({ id: t.id, label: t.name }))}
          selected={selTriptypes}
          onToggle={id => setSelTriptypes(toggle(selTriptypes, id))}
        />
        <ChipGroup
          eyebrow="03"
          title="Welk weer?"
          options={weatherTags.map(t => ({ id: t.id, label: t.name }))}
          selected={selWeather}
          onToggle={id => setSelWeather(toggle(selWeather, id))}
        />
        <ChipGroup
          eyebrow="04"
          title="Welke activiteiten?"
          options={[...activityTags, ...customTags].map(t => ({ id: t.id, label: t.name }))}
          selected={selActivities}
          onToggle={id => setSelActivities(toggle(selActivities, id))}
        />

        {err && <p className="text-sm text-accent2">{err}</p>}
      </form>

      {/* Sticky preview rail */}
      <aside className="col-span-12 lg:col-span-4 lg:sticky lg:top-10 self-start">
        <div className="card p-5">
          <p className="eyebrow">Voorlopige lijst</p>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="num text-display leading-none font-semibold tabular-nums">{drafts.length}</span>
            <span className="text-sm text-muted">items</span>
          </div>
          <p className="mt-3 text-sm text-muted">
            Waarvan <span className="text-ink num">{packCount}</span> in te pakken en <span className="text-ink num">{todoCount}</span> TODO's.
          </p>
          <div className="mt-5 border-t border-rule pt-4 text-xs text-muted">
            <p>Personen: {selPersons.length || '—'}</p>
            <p>Reisduur: {days ? `${days} dag${days === 1 ? '' : 'en'}` : '—'}</p>
            <p>Reistypes: {ctx.triptypes.join(', ') || '—'}</p>
            <p>Weer: {ctx.weather.join(', ') || '—'}</p>
            <p>Activiteiten: {ctx.activities.join(', ') || '—'}</p>
          </div>
          <button onClick={onSubmit as unknown as () => void} disabled={createTrip.isPending}
                  className="btn-primary w-full mt-6">
            {createTrip.isPending ? 'Aanmaken…' : 'Maak reis aan →'}
          </button>
          <button type="button" onClick={() => nav(-1)} className="btn-ghost w-full mt-2">
            Annuleer
          </button>
        </div>
      </aside>
    </div>
  );
}

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
}

function tagNamesByIds(ids: string[], tags: { id: string; name: string }[]): string[] {
  const byId = new Map(tags.map(t => [t.id, t.name]));
  return ids.map(id => byId.get(id)).filter((x): x is string => Boolean(x));
}
