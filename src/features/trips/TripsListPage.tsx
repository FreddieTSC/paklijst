import { Link } from 'react-router-dom';
import { useTrips } from '@/hooks/useTrips';
import type { Trip, TripStatus } from '@/lib/types';

const STATUS_LABEL: Record<TripStatus, string> = {
  planning: 'Planning',
  active: 'Open',
  closed: 'Afgerond',
};

export function TripsListPage() {
  const { data: trips = [], isLoading } = useTrips();

  const grouped: Record<TripStatus, Trip[]> = { active: [], planning: [], closed: [] };
  for (const t of trips) grouped[t.status].push(t);

  return (
    <div className="space-y-12">
      <header className="flex items-end justify-between gap-6 border-b border-rule pb-6">
        <div>
          <p className="eyebrow">N° 01 · Reizen</p>
          <h1 className="text-h1 font-semibold mt-2 tracking-tight">
            Wat staat er <em className="italic font-display">op de planning?</em>
          </h1>
          <p className="mt-2 text-sm text-muted">{trips.length} reizen totaal.</p>
        </div>
        <Link to="/trips/new" className="btn-primary shrink-0">+ Nieuwe reis</Link>
      </header>

      {isLoading && <p className="text-sm text-muted">Laden…</p>}

      {!isLoading && trips.length === 0 && (
        <div className="card p-8 max-w-xl">
          <p className="eyebrow mb-2">Lege agenda</p>
          <h2 className="text-h2 font-semibold">Nog geen reizen.</h2>
          <p className="mt-2 text-sm text-muted">
            Klik <em>+ Nieuwe reis</em> om er één aan te maken. Vul een naam, kies wie er meegaat, het type reis,
            het weer en de activiteiten — de app stelt de inpaklijst voor je samen.
          </p>
        </div>
      )}

      {(['active','planning','closed'] as TripStatus[]).map(status => grouped[status].length > 0 && (
        <section key={status}>
          <p className="eyebrow mb-4">{STATUS_LABEL[status]}</p>
          <ul className="grid grid-cols-12 gap-4">
            {grouped[status].map((t, idx) => (
              <li key={t.id}
                  className={`col-span-12 ${idx % 5 === 0 ? 'md:col-span-7' : 'md:col-span-5'}`}>
                <TripCard trip={t} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function TripCard({ trip }: { trip: Trip }) {
  const ctx = trip.context;
  const tags = [...(ctx.triptypes ?? []), ...(ctx.weather ?? []), ...(ctx.activities ?? [])];
  return (
    <Link to={`/trips/${trip.id}`}
          className="block card p-5 group hover:border-ink/40 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-h2 font-semibold tracking-tight">{trip.name}</h3>
        <span className="text-eyebrow text-muted shrink-0">→</span>
      </div>
      <div className="mt-2 num text-xs text-muted">
        {trip.start_date && trip.end_date
          ? `${formatDate(trip.start_date)} → ${formatDate(trip.end_date)}`
          : 'Geen datums'}
      </div>
      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {tags.slice(0, 6).map(t => (
            <span key={t} className="text-[11px] px-2 py-0.5 border border-rule rounded-sm">{t}</span>
          ))}
          {tags.length > 6 && <span className="text-[11px] text-muted">+{tags.length - 6}</span>}
        </div>
      )}
    </Link>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' });
}
