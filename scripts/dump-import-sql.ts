/**
 * One-off helper: parse the Excel template and emit ready-to-paste SQL for
 * the MCP execute_sql tool. Used because the import-excel.ts script needs the
 * Supabase service-role key, which we don't have in the MCP environment.
 */
import { parseTemplateExcel } from './parse-excel';
import { writeFileSync } from 'node:fs';

const TEMPLATE = 'C:/Users/tieme/Mijn Drive/LEISURE/REIZEN/meenemen op reis/template reis (version 2).xlsx';
const OUT      = 'C:/Users/tieme/Documents/Claude/Projects/Inpaklijst/scripts/import-output.json';

const plan = parseTemplateExcel(TEMPLATE);
console.log(`persons: ${plan.persons.length}`);
console.log(`items:   ${plan.items.length} (${plan.items.filter(i => i.kind === 'todo').length} todos, ${plan.items.filter(i => i.kind === 'packable').length} packables)`);
console.log(`itemTags: ${plan.itemTags.length}`);
console.log(`itemForPerson: ${plan.itemForPerson.length}`);

writeFileSync(OUT, JSON.stringify(plan, null, 2));
console.log(`\nWrote: ${OUT}`);
