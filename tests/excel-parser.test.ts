import { describe, it, expect } from 'vitest';
import { parseTemplateExcel } from '../scripts/parse-excel';
import { resolve } from 'path';

const FIXTURE = resolve('C:/Users/tieme/Mijn Drive/LEISURE/REIZEN/meenemen op reis/template reis (version 2).xlsx');

describe('parseTemplateExcel', () => {
  it('extracts the 4 personal closets as persons', () => {
    const plan = parseTemplateExcel(FIXTURE);
    const names = plan.persons.map(p => p.name).sort();
    expect(names).toEqual(['An', 'Charlotte', 'Jakob', 'Tiemen']);
  });

  it('marks Jakob and Charlotte as children', () => {
    const plan = parseTemplateExcel(FIXTURE);
    const kids = plan.persons.filter(p => p.is_child).map(p => p.name).sort();
    expect(kids).toEqual(['Charlotte', 'Jakob']);
  });

  it('extracts a meaningful number of items', () => {
    const plan = parseTemplateExcel(FIXTURE);
    expect(plan.items.length).toBeGreaterThan(80);
  });

  it('marks items in the TODO sheet as kind=todo', () => {
    const plan = parseTemplateExcel(FIXTURE);
    const todos = plan.items.filter(i => i.kind === 'todo');
    expect(todos.length).toBeGreaterThan(10);
    expect(todos.some(t => /katten/i.test(t.name))).toBe(true);
  });

  it('attaches CAMPER-sheet items to the camper tag', () => {
    const plan = parseTemplateExcel(FIXTURE);
    const camperItems = plan.itemTags.filter(it => it.tag === 'camper');
    expect(camperItems.length).toBeGreaterThan(20);
  });

  it('attaches FIETS-sheet items to the fiets tag', () => {
    const plan = parseTemplateExcel(FIXTURE);
    const fietsItems = plan.itemTags.filter(it => it.tag === 'fiets');
    expect(fietsItems.length).toBeGreaterThan(15);
  });

  it('attaches TIEMEN-sheet items to person Tiemen', () => {
    const plan = parseTemplateExcel(FIXTURE);
    const tiemenItems = plan.itemForPerson.filter(p => p.person === 'Tiemen');
    expect(tiemenItems.length).toBeGreaterThan(15);
  });

  it('does not include sheet headers like "TO DO" or "WATER" as items', () => {
    const plan = parseTemplateExcel(FIXTURE);
    expect(plan.items.some(i => i.name === 'TO DO')).toBe(false);
    expect(plan.items.some(i => i.name === 'WATER')).toBe(false);
    expect(plan.items.some(i => i.name === 'KAMPEREN')).toBe(false);
  });
});
