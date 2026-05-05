import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'C:/Users/tieme/.claude/projects/C--Users-tieme-Documents-Claude-Projects-Inpaklijst/95a06e8a-b31c-4c0c-8af0-6055aede2097/tool-results/mcp-faeb5628-1489-4708-a61b-67e57fe75b59-execute_sql-1777996800603.txt';

// File structure: [{type:'text', text:'{"result":"...<untrusted>[REAL_JSON]</untrusted>..."}'}]
const outer = JSON.parse(readFileSync(FILE, 'utf8'));
const inner = JSON.parse(outer[0].text);
const resultText = inner.result;
// Extract the JSON array between the untrusted-data tags
const arrStart = resultText.indexOf('\n[');
const arrEnd = resultText.lastIndexOf(']\n');
const rows = JSON.parse(resultText.slice(arrStart, arrEnd + 1));

console.log(`rows: ${rows.length}`);
writeFileSync('scripts/items.json', JSON.stringify(rows, null, 2));

// Duplicates: case-insensitive same name
const groups = new Map();
for (const r of rows) {
  const k = r.name.trim().toLowerCase();
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(r);
}
const dupes = [...groups.entries()].filter(([_, items]) => items.length > 1);
console.log(`\nexact-name dupes: ${dupes.length} groups`);
for (const [n, items] of dupes) {
  console.log(`  ${items.length}x  "${n}"`);
  for (const it of items) {
    console.log(`       cat=${it.default_category} kind=${it.kind} tags=${JSON.stringify(it.tags)} persons=${JSON.stringify(it.persons)}`);
  }
}

console.log('\n--- by category counts ---');
const byCat = new Map();
for (const r of rows) byCat.set(r.default_category, (byCat.get(r.default_category) || 0) + 1);
for (const [cat, c] of byCat) console.log(`  ${cat}: ${c}`);
