# Inpaklijst

Packing list PWA — Vite + React + TypeScript + Supabase + TanStack Query.

- Supabase project: `bxfurgthnptiorahjrrl`
- **Productie is Vercel: https://inpaklijst.vercel.app** — project `inpaklijst`, scope `freddietsc`. Dit is de site die Tiemen gebruikt.
- Deploy: build in worktree, `rm -rf main/dist && cp -r worktree/dist main/dist`, dan vanuit `main/dist`:
  `npx vercel deploy --prod --yes --scope freddietsc` (de map is gelinkt via `dist/.vercel`; `dist/vercel.json` bevat de SPA-rewrite en moet mee)
- Vercel is de enige host. De oude Netlify-site is op 2026-08-12 verwijderd; `netlify.toml` is uit de repo.
- `dist/` wordt bij elke deploy weggegooid en opnieuw gekopieerd — herstel daarna `vercel.json` en her-link met
  `npx vercel link --yes --scope freddietsc --project inpaklijst`
- Categories zijn hardcoded TypeScript types, tags zijn dynamic in Supabase
- `inpaklijst_item.kind` constraint: `'packable'` of `'todo'` (niet `'pack'`)
- Service worker caching is agressief — na deploy: unregister SW + clear caches

## Session continuity

### Bij start sessie
Lees SESSION.md en TODO.md. Vat in 3 zinnen samen waar we stonden. Vraag of we doorgaan op de volgende stap.

### Bij commando "wrap"
1. Overschrijf SESSION.md met huidige status (max 30 regels).
2. Append datum-entry aan CHANGELOG.md.
3. Herzie TODO.md — verplaats afgeronde items, voeg nieuwe toe.

### SESSION.md format (max 30 regels)
- Wat af is
- Huidige branch + laatste commit
- Openstaande TODO's
- Blockers
- Volgende stap

### Stijl
Geen marketingtaal, alleen feiten.
