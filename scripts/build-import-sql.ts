/**
 * Reads the parsed plan JSON and emits SQL chunks to stdout.
 * Each chunk is small enough to pass to execute_sql.
 *
 * Usage:
 *   npx tsx scripts/build-import-sql.ts <household_id>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import type { ParsedPlan } from './parse-excel';

const householdId = process.argv[2];
if (!householdId) {
  console.error('Usage: build-import-sql.ts <household_id>');
  process.exit(1);
}

const plan: ParsedPlan = JSON.parse(
  readFileSync('C:/Users/tieme/Documents/Claude/Projects/Inpaklijst/scripts/import-output.json', 'utf8'),
);

function esc(v: string): string { return v.replace(/'/g, "''"); }

const items = plan.items;
const itemTags = plan.itemTags;
const itemForPerson = plan.itemForPerson;

// 1. Items
const itemsSql = items.map(i =>
  `('${householdId}', '${esc(i.name)}', '${i.kind}', false, '${i.default_category}', NULL)`
).join(',\n  ');

const sql1 = `insert into inpaklijst_item (household_id, name, kind, wear_on_travel, default_category, notes)
values
  ${itemsSql};`;

// 2. item_tag links via name lookup
const itemTagsSql = itemTags.map(it =>
  `select i.id, t.id from inpaklijst_item i, inpaklijst_tag t
   where i.household_id = '${householdId}' and lower(i.name) = lower('${esc(it.item)}') and i.kind = 'packable'
     and t.household_id = '${householdId}' and t.name = '${esc(it.tag)}'`
).join('\n  union all\n  ');

const sql2 = `insert into inpaklijst_item_tag (item_id, tag_id)
  ${itemTagsSql}
on conflict do nothing;`;

// 3. item_for_person links via name lookup
const ifpSql = itemForPerson.map(ip =>
  `select i.id, p.id from inpaklijst_item i, inpaklijst_person p
   where i.household_id = '${householdId}' and lower(i.name) = lower('${esc(ip.item)}') and i.kind = 'packable'
     and p.household_id = '${householdId}' and p.name = '${esc(ip.person)}'`
).join('\n  union all\n  ');

const sql3 = `insert into inpaklijst_item_for_person (item_id, person_id)
  ${ifpSql}
on conflict do nothing;`;

writeFileSync(
  'C:/Users/tieme/Documents/Claude/Projects/Inpaklijst/scripts/import.sql',
  `-- chunk 1: items\n${sql1}\n\n-- chunk 2: item_tag\n${sql2}\n\n-- chunk 3: item_for_person\n${sql3}\n`,
);

console.log(`Wrote scripts/import.sql`);
console.log(`  items:          ${items.length}`);
console.log(`  item_tag:       ${itemTags.length}`);
console.log(`  item_for_person:${itemForPerson.length}`);
console.log(`  sql sizes (bytes): ${sql1.length}, ${sql2.length}, ${sql3.length}`);
