# Inpaklijst — Design Spec

**Datum:** 2026-05-05
**Status:** Draft (te reviewen door eigenaar)
**Eigenaar:** Tiemen

## 1. Probleem & doel

Tiemen onderhoudt inpaklijsten in Excel-bestanden per reis. De huidige werkwijze:
- Eén "template reis (version 2).xlsx" met tabbladen per categorie (TODO, STUFF, ETEN, ELEKTRONICA, WATERPRET, FIETS, CAMPER, PHARMACIE, SPELLETJES) en per gezinslid (AN, TIEMEN, JAKOB, CHARLOTTE).
- Voor elke reis wordt het template gekopieerd en handmatig aangepast (zie `berlijn.xlsx`, `vakantie malta.xlsx`, `vakantie USA.xlsx`, `camper balkan.xlsx`).
- Geen afvinken tijdens inpakken; geen geschiedenis van wat wel/niet nodig was.

Doel: een PWA die per reis een gepersonaliseerde inpaklijst genereert door modules te stapelen (wie + reistype + weer + activiteiten), met afvinken tijdens het inpakken, persistente reizen en een leereffect dat lijsten verfijnt na elke reis.

**Niet-doelen:**
- Reisplanning of itinerary
- Boodschappen-integratie
- Native iOS/Android apps
- Bibliotheken delen tussen huishoudens

## 2. Beslissingen (uit brainstorm)

| Thema | Keuze |
|---|---|
| Platform | PWA (React + Vite + `vite-plugin-pwa`) |
| Compositiemodel | Stapel-modules (chips voor wie/reistype/weer/activiteiten) |
| Gebruikers | Multi-user met eigen accounts; concept "huishouden" |
| Datamodel | Hybride: persoonlijke kleren-kasten + activiteit-modules + categorieën met tags |
| Reis-state | Persistent (afvinken, naam, datums, geschiedenis) |
| Slimheid | Leereffect via simpele tellers (geen ML) |
| Item-types | Twee soorten: TODO (vóór vertrek doen) en packable (in te pakken). "Aandoen"-vlag op packables. |
| Backend | Supabase (Postgres + Auth + RLS + Realtime) |
| Offline | Nice-to-have voor v2; basis-cache van laatst geladen reis |

## 3. Architectuur

```
┌─────────────────────────────────────────────┐
│  PWA (React + TypeScript + Vite)            │
│  ├─ Auth (Supabase Auth UI)                 │
│  ├─ Bibliotheek (items, modules, tags)      │
│  ├─ Reis-compositor (chips → preview)       │
│  └─ Inpak-modus (afvinken, realtime)        │
└──────────────────┬──────────────────────────┘
                   │ Supabase JS SDK
┌──────────────────▼──────────────────────────┐
│  Supabase                                   │
│  ├─ Auth (email + magic link)               │
│  ├─ Postgres (zie §5 datamodel)             │
│  ├─ RLS (huishouden-scoped)                 │
│  └─ Realtime (afvinken sync)                │
└─────────────────────────────────────────────┘
```

**Stack-detail:**
- Frontend: React 18 + TypeScript, Vite, `vite-plugin-pwa`
- Styling: Tailwind CSS, mobile-first
- State: TanStack Query (server-state) + Zustand (UI-state)
- Routing: React Router
- Hosting: Netlify (gratis tier)
- Codeorganisatie: feature-based folders (`features/library`, `features/trip`, `features/auth`)

**Huishouden-model:**
- Eén account = één gebruiker (`auth.users`).
- Eén huishouden = één werkruimte met gedeelde bibliotheek en reizen.
- Een gebruiker is lid van één huishouden via `household_member` (rol `owner` of `member`).
- `person` is gescheiden van `user`: een 8-jarig kind heeft een persoonlijke kleren-kast maar geen account.
- Uitnodigingen via email of code (fase 2).

## 4. Schermen & flows

Vijf hoofdschermen:

```
┌─────────────────┐
│  1. Reizen      │  Home: actieve + verleden reizen, "+ nieuwe reis"
└────────┬────────┘
         ▼
┌─────────────────┐
│  2. Compositor  │  Naam, datums, chips voor wie/reistype/weer/activiteiten
└────────┬────────┘  Live counter "voorstel: N items"
         ▼
┌─────────────────┐
│  3. Reis-detail │  Tabs: TODOs | Inpakken | Aandoen
│     (inpakken)  │  Afvinken, items toevoegen/verwijderen, realtime
└────────┬────────┘
         ├──────► 4. Bibliotheek (items, modules, tags beheren)
         └──────► 5. Profiel & gezin (account, huishouden, leden)
```

**Compositor (scherm 2):**
- Vier chip-groepen (collapsible). Personen komen uit `person`-tabel; de andere drie groepen tonen `tag`-rijen gefilterd op `kind`:
  - **Wie?** — alle `person`-rijen van het huishouden
  - **Type reis** (`tag.kind='triptype'`) — geseed: citytrip · camper · tent · hotel · festival · zakenreis
  - **Weer** (`tag.kind='weather'`) — geseed: warm · gemiddeld · koud · regen
  - **Activiteiten** (`tag.kind='activity'`) — geseed: fiets · zwemmen · wandelen · uitgaan · werk
- Alle bovenstaande tags worden bij huishouden-creatie geseed via `scripts/seed-tags.ts`. Gebruiker kan eigen tags toevoegen (`kind='custom'`) via de bibliotheek.
- Live-preview onderaan: "Voorstel: 87 items · 12 todos"
- "Maak reis aan" → genereert `trip_item`-rijen, navigeert naar scherm 3

**Inpak-scherm (scherm 3):**
- Bovenaan tabs: TODOs / Inpakken / Aandoen
- Binnen "Inpakken": items gegroepeerd per categorie + per persoon (collapsible)
- Elke regel heeft drie zichtbare elementen:
  - **Itemnaam** (links). Bij afgevinkt: `text-decoration: line-through` + lichtere kleur.
  - **Groen vinkje-vakje** (✓): klik = afvinken (set `trip_item.checked=true`); klik nogmaals = uitvinken. Open vakje = nog te doen.
  - **Rood kruisje-vakje** (✕, even groot als het vinkje): klik = item verwijderen uit deze reis (delete `trip_item`-rij; item zelf blijft in de bibliotheek bestaan). Bevestigingsmodal alleen bij `added_manually=false` (om te voorkomen dat een handmatig toegevoegd item per ongeluk wordt verwijderd, geen modal nodig).
- Tap-area van beide vakjes minimaal 44×44px (mobile-friendly).
- Notitie/feedback op item: tap op de itemnaam zelf opent een lichte popover (niet een vast icoon, om de regel rustig te houden).
- "+" knop onderaan: toevoegen uit bibliotheek (autocomplete) of nieuw item.
- Realtime: afvinken op andere telefoon = direct zichtbaar (avatar bij item).
- "Reis afsluiten"-knop opent feedback-flow (zie §6).

**Bibliotheek (scherm 4):**
- Lijst met filterbalk (per tag, per persoon, per categorie)
- Item-edit: naam · tags · persoon (optioneel) · categorie · "aandoen"-vlag · notes
- Bulk-toevoegen via plak-uit-Excel (één item per regel, tags daarna in batch toekennen)

## 5. Datamodel

Negen tabellen, gegroepeerd:

### Gebruikers & gezin

```sql
-- auth.users is door Supabase beheerd

household
  id            uuid pk
  name          text          -- "Familie van Doore"
  created_at    timestamptz

household_member
  household_id  uuid fk → household
  user_id       uuid fk → auth.users
  role          text          -- 'owner' | 'member'
  display_name  text          -- "Tiemen", "An"
  primary key (household_id, user_id)

person
  id            uuid pk
  household_id  uuid fk → household
  name          text          -- "Charlotte"
  is_child      boolean
  user_id       uuid fk → auth.users  -- nullable; gekoppeld als persoon ouder genoeg is
```

### Bibliotheek

```sql
item
  id                uuid pk
  household_id      uuid fk → household
  name              text          -- "muggenmelk", "katten eten geven"
  kind              text          -- 'packable' | 'todo'
  wear_on_travel    boolean       -- "aandoen"-vlag (alleen relevant voor packable)
  default_category  text          -- check constraint: 'stuff' | 'eten' | 'electronica' | 'pharmacie' | 'spelletjes' | 'kleren' | 'todo'
  notes             text          -- vrij tekstveld

tag
  id            uuid pk
  household_id  uuid fk → household
  name          text          -- "camper", "warm", "fiets"
  kind          text          -- check constraint: 'triptype' | 'weather' | 'activity' | 'custom'
  unique (household_id, name)

item_tag
  item_id       uuid fk → item
  tag_id        uuid fk → tag
  primary key (item_id, tag_id)

item_for_person
  item_id       uuid fk → item
  person_id     uuid fk → person
  primary key (item_id, person_id)
  -- Leeg = item is gedeeld/algemeen (niet aan één persoon gekoppeld)
```

### Reizen

```sql
trip
  id            uuid pk
  household_id  uuid fk → household
  name          text          -- "Berlijn okt 2026"
  start_date    date
  end_date      date
  status        text          -- 'planning' | 'active' | 'closed'
  context       jsonb         -- {"persons": [...], "triptypes": [...], "weather": [...], "activities": [...]}

trip_item
  id              uuid pk
  trip_id         uuid fk → trip
  item_id         uuid fk → item
  person_id       uuid fk → person  -- nullable; gevuld voor persoonsgebonden items
  checked         boolean default false
  checked_by      uuid fk → auth.users  -- nullable
  checked_at      timestamptz
  added_manually  boolean default false  -- false = door generator, true = door gebruiker

trip_feedback
  id                uuid pk
  trip_id           uuid fk → trip
  item_id           uuid fk → item
  verdict           text          -- 'used' | 'unused' | 'missing'
  context_snapshot  jsonb         -- kopie van trip.context op moment van feedback
  created_at        timestamptz
```

### Generatie-algoritme

Wanneer compositor "Maak reis aan" doet met context `{persons, triptypes, weather, activities}`:

1. Verzamel kandidaten:
   - Alle items waarvan tenminste één tag in `triptypes ∪ weather ∪ activities` zit
   - Plus alle items in `item_for_person` waar `person_id ∈ persons`
   - Plus alle items zonder tags én zonder `item_for_person` (dus altijd-meename uit categorie 'stuff')
2. Filter weg: items waarvoor `trip_feedback.verdict='unused'`-tellers ≥ `UNUSED_FILTER_THRESHOLD` bij vergelijkbare context. "Vergelijkbare context" = ten minste één gemeenschappelijke triptype-tag.
3. Insert in `trip_item` met `added_manually=false`.

Constanten (in MVP hardcoded, niet user-instelbaar):
- `UNUSED_FILTER_THRESHOLD = 3` — aantal "unused"-feedbacks vóór een item uit gegenereerde lijst valt

### RLS-beleid (Row-Level Security)

Elke tabel heeft een policy die rijen filtert op `household_id` waarvan de huidige gebruiker lid is. Concreet:

```sql
-- Voorbeeld voor item:
create policy "Members see own household items"
  on item for all
  using (household_id in (
    select household_id from household_member where user_id = auth.uid()
  ));
```

Vergelijkbare policies voor: `household`, `household_member`, `person`, `item`, `tag`, `item_tag`, `item_for_person`, `trip`, `trip_item`, `trip_feedback`.

## 6. Leereffect (reis afsluiten)

Op scherm 3, knop "Reis afsluiten":

1. App toont alle ongevinkte items: "Welke heb je écht niet gebruikt?" — gebruiker vinkt aan.
2. App vraagt: "Heb je iets gemist?" — vrije input met autocomplete op bibliotheek.
3. Voor elk item dat gemarkeerd is:
   - 'unused' → schrijf `trip_feedback` rij met verdict 'unused' en `context_snapshot = trip.context`
   - 'missing' → schrijf rij met verdict 'missing'. Als naam niet matcht met bestaand item: open inline modal voor "nieuw item aanmaken" (naam, categorie, optioneel persoon/tags). Pas na bevestiging wordt item én feedback rij geschreven.
   - 'used' (alle gevinkte items) → schrijf rij met verdict 'used'
4. Trip-status → 'closed'.

Generator gebruikt `trip_feedback` zoals beschreven in §5.

**Geen ML, geen black box.** Alleen tellers per (item, context-overlap). Voorspelbaar, debugbaar, gebruiker kan altijd handmatig toevoegen.

## 7. Fasering

### Fase 1 — MVP (~2 weken)

- Auth (email + password via Supabase)
- Eén-persoons huishouden (geen uitnodigingen)
- Excel-import: éénmalig Node-script (`scripts/import-excel.ts`) dat lokaal draait, leest `template reis (version 2).xlsx` met `xlsx` package, schrijft naar Supabase via service-role key. Print preview vóór commit; vraagt y/n bevestiging. Geen in-app upload in MVP.
- Bibliotheek-CRUD (items aanmaken/bewerken, tags toekennen)
- Reis-compositor met chips → generator
- Inpak-scherm met afvinken (geen realtime nog)
- TODOs / Inpakken / Aandoen tabs
- Deploy naar Netlify

**Acceptatie:** Tiemen kan een nieuwe reis aanmaken en zijn volledige inpaklijst beheren zonder Excel.

### Fase 2 — Gezin & realtime (~1 week)

- Huishouden-uitnodigingen via email of share-link
- Personen-beheer (kinderen zonder account)
- Supabase Realtime: afvinken sync
- Avatars bij gevinkte items
- PWA install-prompt, bottom nav op mobiel
- Offline-cache van laatst geladen reis (read-only fallback)

**Acceptatie:** An kan op haar telefoon afvinken; het verschijnt direct op Tiemen's laptop.

### Fase 3 — Slim & verfijnd (~1 week + experimenteren)

- "Reis afsluiten" feedback-flow
- Generator gebruikt `trip_feedback` voor filtering
- Reis dupliceren als startpunt voor nieuwe reis
- Optioneel: weer-API koppeling (datums + bestemming → suggestie)
- Optioneel: AI-snelinvoer ("Berlijn met fiets eind oktober" → kiest chips)

**Acceptatie:** Na 2-3 reizen verbetert de generatie merkbaar; lijsten worden korter en relevanter.

## 8. Open punten

- Bestemming als vrij tekstveld of vaste lijst? (MVP: vrij tekstveld)
- Hoeveelheid per item (bv. "5 onderbroeken")? Voor MVP: in itemnaam, zoals nu in Excel.
- Tag-beheer-UI of tags inline aanmaken? Voor MVP: inline aanmaken bij item-edit.
- Welk weer-API in fase 3? (open-meteo lijkt gratis en goed)

## 9. Risico's

- **Supabase free tier limieten** — Voor één huishouden ruim genoeg, maar als app verbreedt naar publiek product moet er een tier-strategie komen. Niet relevant voor MVP.
- **Generator-kwaliteit** — Eerste versie kan te grote of te kleine lijsten produceren. Mitigatie: leereffect (fase 3), maar in fase 1 al duidelijk maken dat lijst handmatig aanpasbaar is.
- **Excel-import** — Excel-data is rommelig (lege rijen, kolommen door elkaar, items met duplicaten). Import-script moet defensief zijn en review tonen vóór commit.
