/**
 * One-shot import of the Excel template into Supabase.
 * Usage:
 *   1. Set env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, HOUSEHOLD_ID
 *      (HOUSEHOLD_ID = the household you want to populate; create one first via the app)
 *   2. Optionally set EXCEL_PATH to override the default template location
 *   3. Run: npm run import
 *   4. Confirms with you before writing.
 */
import { createClient } from '@supabase/supabase-js';
import { parseTemplateExcel } from './parse-excel';
import { resolve } from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const DEFAULT_EXCEL = 'C:/Users/tieme/Mijn Drive/LEISURE/REIZEN/meenemen op reis/template reis (version 2).xlsx';

async function main() {
  const url         = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const householdId = process.env.HOUSEHOLD_ID;
  const excelPath   = resolve(process.env.EXCEL_PATH ?? DEFAULT_EXCEL);

  if (!url || !serviceKey || !householdId) {
    console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, HOUSEHOLD_ID');
    process.exit(1);
  }
  const sb = createClient(url, serviceKey);

  console.log(`\nReading: ${excelPath}`);
  const plan = parseTemplateExcel(excelPath);
  console.log('Parsed:');
  console.log(`  ${plan.persons.length} persons`);
  console.log(`  ${plan.items.length} items (${plan.items.filter(i => i.kind === 'todo').length} todos, ${plan.items.filter(i => i.kind === 'packable').length} packables)`);
  console.log(`  ${plan.itemTags.length} item-tag links`);
  console.log(`  ${plan.itemForPerson.length} item-person links`);

  const rl = readline.createInterface({ input, output });
  const ans = await rl.question(`\nWrite to household ${householdId}? [y/N] `);
  rl.close();
  if (ans.trim().toLowerCase() !== 'y') {
    console.log('Aborted.');
    process.exit(0);
  }

  console.log('\nSeeding default tags...');
  const { error: seedErr } = await sb.rpc('seed_default_tags', { h_id: householdId });
  if (seedErr) throw seedErr;

  console.log('Inserting persons...');
  const personIdByName = new Map<string, string>();
  for (const p of plan.persons) {
    const { data, error } = await sb.from('person')
      .insert({ household_id: householdId, name: p.name, is_child: p.is_child, user_id: null })
      .select('id').single();
    if (error) throw error;
    personIdByName.set(p.name, data.id);
  }

  console.log(`Inserting ${plan.items.length} items...`);
  const itemIdByKey = new Map<string, string>();
  // Bulk insert in chunks
  const chunkSize = 50;
  for (let i = 0; i < plan.items.length; i += chunkSize) {
    const chunk = plan.items.slice(i, i + chunkSize).map(it => ({
      household_id: householdId,
      name: it.name,
      kind: it.kind,
      wear_on_travel: false,
      default_category: it.default_category,
      notes: null,
    }));
    const { data, error } = await sb.from('item').insert(chunk).select('id,name,kind');
    if (error) throw error;
    for (const row of data!) {
      itemIdByKey.set(`${row.kind}::${row.name.toLowerCase()}`, row.id);
    }
  }

  console.log('Loading tags...');
  const { data: tags, error: tagsErr } = await sb.from('tag')
    .select('id,name').eq('household_id', householdId);
  if (tagsErr) throw tagsErr;
  const tagIdByName = new Map(tags!.map(t => [t.name, t.id]));

  console.log(`Linking ${plan.itemTags.length} item↔tag rows...`);
  const itemTagRows = plan.itemTags
    .map(it => {
      const item_id = itemIdByKey.get(`packable::${it.item.toLowerCase()}`);
      const tag_id  = tagIdByName.get(it.tag);
      return item_id && tag_id ? { item_id, tag_id } : null;
    })
    .filter((x): x is { item_id: string; tag_id: string } => Boolean(x));
  if (itemTagRows.length) {
    const { error } = await sb.from('item_tag').insert(itemTagRows);
    if (error) throw error;
  }

  console.log(`Linking ${plan.itemForPerson.length} item↔person rows...`);
  const ifpRows = plan.itemForPerson
    .map(ip => {
      const item_id   = itemIdByKey.get(`packable::${ip.item.toLowerCase()}`);
      const person_id = personIdByName.get(ip.person);
      return item_id && person_id ? { item_id, person_id } : null;
    })
    .filter((x): x is { item_id: string; person_id: string } => Boolean(x));
  if (ifpRows.length) {
    const { error } = await sb.from('item_for_person').insert(ifpRows);
    if (error) throw error;
  }

  console.log('\nDone.');
}

main().catch(err => { console.error(err); process.exit(1); });
