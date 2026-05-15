import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useHousehold } from '@/hooks/useHousehold';

const NAV = [
  { to: '/trips',    label: 'Reizen',    short: 'Reizen' },
  { to: '/library',  label: 'Bibliotheek', short: 'Items' },
  { to: '/settings', label: 'Instellingen', short: 'Instell.' },
];

export function Layout() {
  const { data: hh } = useHousehold();
  const loc = useLocation();

  return (
    <div className="min-h-screen bg-paper text-ink pb-24 md:pb-0">
      <div className="mx-auto max-w-[1320px] grid grid-cols-12 gap-6 md:gap-10 px-4 md:px-6 py-6 md:py-10">

        {/* Sidebar (desktop only) */}
        <aside className="hidden md:block md:col-span-3 lg:col-span-2 md:sticky md:top-10 md:self-start">
          <div className="flex items-center gap-2.5">
            <Glyph />
            <span className="text-sm font-medium tracking-tight">Inpaklijst</span>
          </div>
          <nav className="mt-12 flex flex-col gap-1.5">
            {NAV.map(item => (
              <NavLink key={item.to} to={item.to}
                className={({ isActive }) =>
                  `text-[15px] tracking-tight transition-colors ${
                    isActive ? 'text-ink font-medium' : 'text-muted hover:text-ink'
                  }`
                }>
                {({ isActive }) => (
                  <span className="flex items-center gap-2.5">
                    <span className={`block w-1 h-4 rounded-full ${isActive ? 'bg-accent' : 'bg-transparent'}`} />
                    {item.label}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="mt-12 text-eyebrow text-muted leading-relaxed">
            <div>{hh?.household?.name ?? 'Huishouden'}</div>
            <div className="mt-1">{hh?.member?.display_name}</div>
          </div>
        </aside>

        {/* Mobile masthead */}
        <header className="md:hidden col-span-12 flex items-center justify-between">
          <div className="flex items-center gap-2"><Glyph /><span className="text-sm font-medium tracking-tight">Inpaklijst</span></div>
          <span className="text-eyebrow text-muted truncate max-w-[60%]">{hh?.household?.name}</span>
        </header>

        {/* Main */}
        <main className="col-span-12 md:col-span-9 lg:col-span-10 min-w-0">
          <Outlet key={loc.pathname} />
        </main>
      </div>

      {/* Bottom nav (mobile only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-paper/95 backdrop-blur border-t border-rule">
        <div className="grid grid-cols-3">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-3 text-[11px] tracking-wide uppercase transition-colors ${
                  isActive ? 'text-ink' : 'text-muted'
                }`
              }>
              {({ isActive }) => (
                <>
                  <span className={`block w-7 h-0.5 ${isActive ? 'bg-accent' : 'bg-transparent'}`} />
                  {item.short}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

function Glyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="5" fill="#1a1f1c"/>
      <path d="M6 12.5l3.5 3.5L18 8" stroke="#f5f3ee" strokeWidth="2.4" fill="none"/>
    </svg>
  );
}
