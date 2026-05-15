# Inpaklijst

Packing list PWA — Vite + React + TypeScript + Supabase + TanStack Query.

- Supabase project: `bxfurgthnptiorahjrrl`
- Netlify site: `6291e70b-8295-4702-b709-fd6769087eff` / https://inpaklijst-kk56.netlify.app
- Deploy: build in worktree, `rm -rf main/dist && cp -r worktree/dist main/dist`, deploy via Netlify MCP
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
