/**
 * Trip-list generator. Pure function: given a snapshot of the household library
 * and a trip context, returns the items that should appear in the generated trip.
 *
 * Algorithm:
 *  1. Collect items where any tag matches the selected context tags
 *  2. Plus items linked to any selected person (per-person clothes)
 *  3. Plus "always-meename" items (no tags, no person)
 *  4. Subtract items with >= UNUSED_FILTER_THRESHOLD 'unused' feedbacks
 *     in a context that overlaps on at least one triptype tag
 *  5. Emit one TripItemDraft per (item, person) pair for person-bound items,
 *     or a single draft (no person) for shared items.
 */

export const UNUSED_FILTER_THRESHOLD = 3;

export interface GenItem  { id: string; name: string; kind: 'packable' | 'todo'; default_category: string; qty?: number; qty_per_day?: boolean; }
export interface GenTag   { id: string; name: string; kind: 'triptype' | 'weather' | 'activity' | 'custom'; }
export interface GenItemTag       { item_id: string; tag_id: string; }
export interface GenItemForPerson { item_id: string; person_id: string; }
export interface GenPerson  { id: string; name: string; }
export interface GenFeedback {
  item_id: string;
  verdict: 'used' | 'unused' | 'missing';
  context_snapshot: { triptypes?: string[]; weather?: string[]; activities?: string[] };
}

export interface Library {
  items: GenItem[];
  tags: GenTag[];
  itemTags: GenItemTag[];
  itemForPerson: GenItemForPerson[];
  persons: GenPerson[];
  feedback: GenFeedback[];
}

export interface Context {
  persons:    string[];   // person ids
  triptypes:  string[];   // tag names
  weather:    string[];
  activities: string[];
  days?:      number;     // length of stay; multiplies qty for items with qty_per_day=true
}

export interface TripItemDraft { item_id: string; person_id?: string; qty: number; }

export function generateTripItems(lib: Library, ctx: Context): TripItemDraft[] {
  const tagByName = new Map(lib.tags.map(t => [t.name, t]));
  const selectedTagIds = new Set(
    [...ctx.triptypes, ...ctx.weather, ...ctx.activities]
      .map(n => tagByName.get(n)?.id)
      .filter((x): x is string => Boolean(x)),
  );
  const tagsByItem = groupByItem(lib.itemTags, it => it.tag_id);
  const personsByItem = groupByItem(lib.itemForPerson, ip => ip.person_id);

  const drafts: TripItemDraft[] = [];

  for (const item of lib.items) {
    const itemTagIds   = tagsByItem.get(item.id)    ?? new Set<string>();
    const itemPersons  = personsByItem.get(item.id) ?? new Set<string>();

    const tagMatch     = [...itemTagIds].some(id => selectedTagIds.has(id));
    const personMatch  = [...itemPersons].some(id => ctx.persons.includes(id));
    const alwaysMeename = itemTagIds.size === 0 && itemPersons.size === 0;

    if (!(tagMatch || personMatch || alwaysMeename)) continue;
    if (countUnusedInContext(lib.feedback, item.id, ctx) >= UNUSED_FILTER_THRESHOLD) continue;

    const baseQty = item.qty ?? 1;
    const days = Math.max(1, ctx.days ?? 1);
    const qty = item.qty_per_day ? baseQty * days : baseQty;
    if (itemPersons.size > 0) {
      for (const pid of itemPersons) {
        if (ctx.persons.includes(pid)) drafts.push({ item_id: item.id, person_id: pid, qty });
      }
    } else {
      drafts.push({ item_id: item.id, qty });
    }
  }
  return drafts;
}

function groupByItem<T extends { item_id: string }, K>(
  rows: T[],
  pickKey: (row: T) => K,
): Map<string, Set<K>> {
  const out = new Map<string, Set<K>>();
  for (const r of rows) {
    const set = out.get(r.item_id) ?? new Set<K>();
    set.add(pickKey(r));
    out.set(r.item_id, set);
  }
  return out;
}

function countUnusedInContext(feedback: GenFeedback[], itemId: string, ctx: Context): number {
  return feedback.filter(f =>
    f.item_id === itemId &&
    f.verdict === 'unused' &&
    (f.context_snapshot.triptypes ?? []).some(t => ctx.triptypes.includes(t)),
  ).length;
}
