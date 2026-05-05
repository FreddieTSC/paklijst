# Inpaklijst

Per-reis inpaklijsten voor het hele gezin. PWA op React + Supabase.
Stapel chips voor wie / type reis / weer / activiteiten — de app stelt de lijst voor je samen,
je vinkt af tijdens het inpakken, en de app leert van wat je wel of niet meeneemt.

## Status — fase 1 (MVP)

Klaar in deze repo:

- Bootstrap (Vite + React 18 + TS + Tailwind + PWA)
- Editorial layout (Geist font, asymmetrisch, deep moss accent, mobile bottom nav)
- Auth (login / signup / onboarding)
- Bibliotheek (items + tags + personen, CRUD met editor-modal)
- Reis-compositor (4 chip-groepen, live preview, generator)
- Inpak-scherm (groen vinkje + rood kruisje per item, line-through, tabs voor TODO/Inpakken/Aandoen)
- Profielpagina (account, huishouden, personen-beheer)
- Pure generator (`src/lib/generator.ts`) en Excel-parser (`scripts/parse-excel.ts`) — beide TDD'd, 17 tests groen

Volgende fasen — zie [`docs/superpowers/specs/2026-05-05-inpaklijst-design.md`](docs/superpowers/specs/2026-05-05-inpaklijst-design.md):

- Fase 2: gezinsuitnodigingen, realtime sync, offline-cache
- Fase 3: "Reis afsluiten" feedback-flow → leereffect actief, weer-API, AI-snelinvoer

## Eerste keer opstarten

### 1. Maak een Supabase-project

Volg [`supabase/README.md`](supabase/README.md) — dat zet je schema + RLS op via 4 SQL-bestanden en
geeft je de URL + anon key die je hieronder nodig hebt.

### 2. Lokale env

```bash
cp .env.example .env.local
```

Vul in:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 3. Dev server

```bash
npm install
npm run dev
```

Open http://localhost:5173. Maak een account aan, doorloop onboarding (huishouden + personen).

### 4. Importeer je bestaande Excel-bibliotheek

Een keer per huishouden:

```bash
# Vul alleen voor de import — niet committen!
export SUPABASE_URL=https://xxxxx.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=eyJ...        # service role key uit Settings → API
export HOUSEHOLD_ID=<uuid van je huishouden>   # uit Supabase Table editor of: select id from inpaklijst_household;
npm run import
```

Het script leest `template reis (version 2).xlsx` (zie pad in `scripts/import-excel.ts`,
override met `EXCEL_PATH=...`), print wat het zou doen, en vraagt bevestiging vóór het schrijft.

## Scripts

| Command | Doel |
|---|---|
| `npm run dev` | Vite dev server (http://localhost:5173) |
| `npm run build` | Productie-build naar `dist/` |
| `npm run preview` | Bekijk de productie-build lokaal |
| `npm test` | Vitest één keer runnen |
| `npm run test:watch` | Vitest in watch-mode |
| `npm run import` | Excel-template importeren naar Supabase |

## Deploy

Repo is geconfigureerd voor Netlify (`netlify.toml`). Twee opties:

**Drag & drop:**
```bash
npm run build
# Sleep dist/ naar https://app.netlify.com/drop
```

**Git-connected:** koppel de repo in Netlify; build settings worden auto-gedetecteerd.
Voeg `VITE_SUPABASE_URL` en `VITE_SUPABASE_ANON_KEY` toe als env vars in Site settings.

## Codebase op één pagina

```
src/
├─ main.tsx, router.tsx          # bootstrap + routes
├─ lib/
│   ├─ supabase.ts               # SB client (untyped — types in src/lib/types.ts)
│   ├─ types.ts                  # hand-written DB types
│   └─ generator.ts              # pure trip-list generator (9 tests)
├─ hooks/
│   ├─ useAuth.ts                # auth state + sign-in/up/out
│   ├─ useHousehold.ts           # current user's household + member row
│   ├─ usePersons.ts, useTags.ts, useItems.ts, useTrips.ts
├─ features/
│   ├─ auth/                     # AuthShell + LoginPage, SignupPage, OnboardingPage
│   ├─ trips/                    # TripsListPage, TripCompositorPage, TripDetailPage
│   │   └─ components/           # ChipGroup, ItemRow (✓ + ×), AddItemPopover
│   ├─ library/                  # LibraryPage, ItemEditor (modal)
│   └─ profile/                  # ProfilePage
├─ components/                   # Layout (sidebar + bottom nav), ProtectedRoute, Modal, Spinner
└─ styles/index.css              # Tailwind + Geist + .btn / .chip / .input / .card

scripts/
├─ parse-excel.ts                # pure parser (8 tests)
└─ import-excel.ts               # imperative importer (Supabase service-role)

supabase/
├─ migrations/                   # 0001 schema, 0002 RLS, 0003 seed tags, 0004 onboarding RPC
└─ README.md                     # how to run the migrations

docs/superpowers/
├─ specs/2026-05-05-inpaklijst-design.md
└─ plans/2026-05-05-inpaklijst-fase1.md
```

## Designkeuzes (kort)

- **Geist** typografie (geen Inter), editorial scale (`text-display`/`text-h1`/`text-h2`/`text-eyebrow`).
- **Palet:** warm paper (`#f5f3ee`), deep ink (`#1a1f1c`), mossy accent (`#2c4a32`), burnt vermillion voor destructief (`#a83a2e`).
- **Asymmetrisch:** auth en pagina-headers gebruiken een 5/7 of 12-col grid in plaats van centered hero.
- **Spring-physics motion:** `motion/react` voor modal, tab underline, item check-toggle, progress bar.
- **Items tonen drie elementen:** `naam · ✓ vakje · × vakje`, beide vakjes 36×36 (44px tap-area inclusief padding).
  - ✓ klikken = afvinken (line-through, lichte achtergrond)
  - × klikken = verwijderen (auto-gegenereerde items vragen bevestiging via 2.5s "klik nogmaals" venster; handmatig toegevoegde items gaan direct weg)

## Ondersteunende docs

- Spec (wat we bouwen en waarom): [`docs/superpowers/specs/2026-05-05-inpaklijst-design.md`](docs/superpowers/specs/2026-05-05-inpaklijst-design.md)
- Plan (concrete taken voor fase 1): [`docs/superpowers/plans/2026-05-05-inpaklijst-fase1.md`](docs/superpowers/plans/2026-05-05-inpaklijst-fase1.md)
- Supabase setup: [`supabase/README.md`](supabase/README.md)
