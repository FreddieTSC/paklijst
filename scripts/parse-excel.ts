import * as XLSX from 'xlsx';
import type { Category, ItemKind } from '../src/lib/types';

export interface ParsedItem  { name: string; kind: ItemKind; default_category: Category; }
export interface ParsedItemTag    { item: string; tag: string; }
export interface ParsedItemPerson { item: string; person: string; }
export interface ParsedPerson     { name: string; is_child: boolean; }

export interface ParsedPlan {
  persons:        ParsedPerson[];
  items:          ParsedItem[];
  itemTags:       ParsedItemTag[];
  itemForPerson:  ParsedItemPerson[];
}

const PERSON_SHEETS = ['AN', 'TIEMEN', 'JAKOB', 'CHARLOTTE'] as const;
const PERSON_CHILD  = new Set<string>(['JAKOB', 'CHARLOTTE']);

const CATEGORY_FOR_SHEET: Record<string, { category: Category; tags?: string[] }> = {
  STUFF:        { category: 'stuff' },
  ETEN:         { category: 'eten' },
  ELEKTRONICA:  { category: 'electronica' },
  PHARMACIE:    { category: 'pharmacie' },
  SPELLETJES:   { category: 'spelletjes' },
  WATERPRET:    { category: 'stuff', tags: ['zwemmen'] },
  FIETS:        { category: 'stuff', tags: ['fiets'] },
  CAMPER:       { category: 'stuff', tags: ['camper'] },
};

// Strings that are clearly section/sheet headers, not actual items.
const HEADER_TOKENS = new Set([
  'TODO', 'TO DO', 'STUFF', 'ETEN', 'ELEKTRONICA', 'PHARMACIE', 'SPELLETJES',
  'WATER', 'KAMPEREN', 'CAMPER', 'FIETS', 'MET FIETS', 'WATERPRET',
  'ZOMER', 'WINTER', 'KOLOM1', 'AN', 'TIEMEN', 'JAKOB', 'CHARLOTTE',
]);

export function parseTemplateExcel(filePath: string): ParsedPlan {
  const wb = XLSX.readFile(filePath);
  const persons: ParsedPerson[] = PERSON_SHEETS.map(s => ({
    name: capitalize(s),
    is_child: PERSON_CHILD.has(s),
  }));

  const items: ParsedItem[] = [];
  const itemTags: ParsedItemTag[] = [];
  const itemForPerson: ParsedItemPerson[] = [];
  const seen = new Set<string>();
  const tagsForName = new Map<string, Set<string>>();

  // Pass 1: TODO sheet → kind=todo
  for (const sheetName of wb.SheetNames) {
    if (sheetName.trim().toUpperCase() !== 'TODO') continue;
    const rows = sheetRows(wb, sheetName);
    for (const row of rows) {
      const name = pickName(row);
      if (!name || isHeader(name)) continue;
      pushItem({ name, kind: 'todo', default_category: 'todo' }, items, seen);
    }
  }

  // Pass 2: category sheets → kind=packable + category + optional tags
  for (const sheetName of wb.SheetNames) {
    const upper = sheetName.trim().toUpperCase();
    const cfg = CATEGORY_FOR_SHEET[upper];
    if (!cfg) continue;
    const rows = sheetRows(wb, sheetName);
    for (const row of rows) {
      const name = pickName(row);
      if (!name || isHeader(name)) continue;
      pushItem({ name, kind: 'packable', default_category: cfg.category }, items, seen);
      if (cfg.tags) {
        const set = tagsForName.get(name.toLowerCase()) ?? new Set<string>();
        for (const t of cfg.tags) set.add(t);
        tagsForName.set(name.toLowerCase(), set);
      }
    }
  }

  // Materialise itemTags from the dedup'd map (avoids dupes when item appears in both CAMPER and FIETS)
  for (const [itemNameLower, tagSet] of tagsForName) {
    const item = items.find(i => i.name.toLowerCase() === itemNameLower && i.kind === 'packable');
    if (!item) continue;
    for (const tag of tagSet) itemTags.push({ item: item.name, tag });
  }

  // Pass 3: person sheets
  for (const sheetName of wb.SheetNames) {
    const upper = sheetName.trim().toUpperCase();
    if (!(PERSON_SHEETS as readonly string[]).includes(upper)) continue;
    const rows = sheetRows(wb, sheetName);
    for (const row of rows) {
      const name = pickName(row);
      if (!name || isHeader(name)) continue;
      pushItem({ name, kind: 'packable', default_category: 'kleren' }, items, seen);
      itemForPerson.push({ item: name, person: capitalize(upper) });
    }
  }

  return { persons, items, itemTags, itemForPerson };
}

function sheetRows(wb: XLSX.WorkBook, sheetName: string): unknown[][] {
  const ws = wb.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' });
}

function pickName(row: unknown[]): string {
  for (const cell of row) {
    if (cell == null) continue;
    const s = String(cell).trim();
    if (s) return s;
  }
  return '';
}

function isHeader(s: string): boolean {
  return HEADER_TOKENS.has(s.trim().toUpperCase());
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function pushItem(it: ParsedItem, list: ParsedItem[], seen: Set<string>): void {
  const key = `${it.kind}::${it.name.toLowerCase()}`;
  if (seen.has(key)) return;
  seen.add(key);
  list.push(it);
}
