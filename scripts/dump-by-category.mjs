import { readFileSync, writeFileSync } from 'node:fs';
const rows = JSON.parse(readFileSync('scripts/items.json', 'utf8'));

const byCat = new Map();
for (const r of rows) {
  if (!byCat.has(r.default_category)) byCat.set(r.default_category, []);
  byCat.get(r.default_category).push(r);
}

let out = `# Library inventory (${rows.length} items)\n\n`;
for (const [cat, items] of byCat) {
  items.sort((a, b) => a.name.localeCompare(b.name));
  out += `\n## ${cat.toUpperCase()} (${items.length})\n\n`;
  for (const it of items) {
    const tags = it.tags ? `  [${it.tags.join(', ')}]` : '';
    const persons = it.persons ? `  → ${it.persons.join(', ')}` : '';
    out += `- ${it.name}${tags}${persons}\n`;
  }
}
writeFileSync('scripts/library-dump.md', out);
console.log('wrote scripts/library-dump.md');
console.log(`size: ${out.length} chars`);
