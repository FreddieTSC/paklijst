import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * Asymmetric editorial shell for auth pages.
 *  - Left rail: 5/12 cols on desktop with masthead + ambient text.
 *  - Right rail: 7/12 cols with the form, top-aligned (not centered).
 *  - Mobile: stacked, masthead collapses to a slim banner.
 */
export function AuthShell({
  eyebrow,
  title,
  prose,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  prose: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-[1320px] grid grid-cols-12 gap-8 px-6 py-10 md:py-16">

        {/* Left rail */}
        <aside className="col-span-12 md:col-span-5 md:pr-10 border-b md:border-b-0 md:border-r border-rule pb-8 md:pb-0">
          <div className="flex items-center gap-3">
            <Glyph />
            <span className="text-sm font-medium tracking-tight">Inpaklijst</span>
          </div>

          <div className="mt-12 md:mt-24">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="mt-3 text-display font-semibold text-balance leading-[0.95]">
              {title}
            </h1>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted text-balance">
              {prose}
            </p>
          </div>

          <div className="hidden md:block mt-24 num text-eyebrow text-muted">
            <span className="text-ink">N° 01</span>
            <span className="mx-3">·</span>
            <span>v0.1 · fase 1</span>
          </div>
        </aside>

        {/* Right rail */}
        <main className="col-span-12 md:col-span-7 md:pl-4 lg:pl-12">
          <div className="max-w-md">
            {children}
            {footer && <div className="mt-8 text-sm text-muted">{footer}</div>}
          </div>
        </main>
      </div>
    </div>
  );
}

function Glyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="5" fill="#1a1f1c"/>
      <path d="M6 12.5l3.5 3.5L18 8" stroke="#f5f3ee" strokeWidth="2.4" fill="none" />
    </svg>
  );
}

export function AuthLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="underline decoration-rule hover:decoration-ink underline-offset-4">
      {children}
    </Link>
  );
}
