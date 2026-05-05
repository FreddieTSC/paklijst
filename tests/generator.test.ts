import { describe, it, expect } from 'vitest';
import { generateTripItems, type Library } from '../src/lib/generator';

const empty: Library = {
  items: [], tags: [], itemTags: [], itemForPerson: [], persons: [], feedback: [],
};

describe('generateTripItems', () => {
  it('returns empty list when library is empty', () => {
    const out = generateTripItems(empty, { persons: [], triptypes: [], weather: [], activities: [] });
    expect(out).toEqual([]);
  });

  it('includes items whose tag matches the trip context', () => {
    const lib: Library = {
      ...empty,
      items: [{ id: 'i1', name: 'tent', kind: 'packable', default_category: 'stuff' }],
      tags: [{ id: 't1', name: 'camper', kind: 'triptype' }],
      itemTags: [{ item_id: 'i1', tag_id: 't1' }],
    };
    const out = generateTripItems(lib, { persons: [], triptypes: ['camper'], weather: [], activities: [] });
    expect(out.map(o => o.item_id)).toEqual(['i1']);
  });

  it('does NOT include tagged item when its tag is not in the context', () => {
    const lib: Library = {
      ...empty,
      items: [{ id: 'i1', name: 'tent', kind: 'packable', default_category: 'stuff' }],
      tags: [{ id: 't1', name: 'camper', kind: 'triptype' }],
      itemTags: [{ item_id: 'i1', tag_id: 't1' }],
    };
    const out = generateTripItems(lib, { persons: [], triptypes: ['hotel'], weather: [], activities: [] });
    expect(out).toEqual([]);
  });

  it('includes person-specific items when person is selected', () => {
    const lib: Library = {
      ...empty,
      items: [{ id: 'i1', name: 't-shirt', kind: 'packable', default_category: 'kleren' }],
      persons: [{ id: 'p1', name: 'Tiemen' }],
      itemForPerson: [{ item_id: 'i1', person_id: 'p1' }],
    };
    const out = generateTripItems(lib, { persons: ['p1'], triptypes: [], weather: [], activities: [] });
    expect(out).toEqual([{ item_id: 'i1', person_id: 'p1' }]);
  });

  it('emits one draft per matched person for shared person-bound items', () => {
    const lib: Library = {
      ...empty,
      items: [{ id: 'i1', name: 'paspoort kind', kind: 'packable', default_category: 'stuff' }],
      persons: [{ id: 'p1', name: 'Jakob' }, { id: 'p2', name: 'Charlotte' }],
      itemForPerson: [{ item_id: 'i1', person_id: 'p1' }, { item_id: 'i1', person_id: 'p2' }],
    };
    const out = generateTripItems(lib, { persons: ['p1','p2'], triptypes: [], weather: [], activities: [] });
    expect(out).toHaveLength(2);
    expect(out.map(o => o.person_id).sort()).toEqual(['p1','p2']);
  });

  it('filters out items with 3+ unused feedbacks in matching context', () => {
    const lib: Library = {
      ...empty,
      items: [{ id: 'i1', name: 'muggennet', kind: 'packable', default_category: 'pharmacie' }],
      tags: [
        { id: 't1', name: 'koud', kind: 'weather' },
        { id: 't2', name: 'camper', kind: 'triptype' },
      ],
      itemTags: [{ item_id: 'i1', tag_id: 't1' }, { item_id: 'i1', tag_id: 't2' }],
      feedback: [
        { item_id: 'i1', verdict: 'unused', context_snapshot: { triptypes: ['camper'] } },
        { item_id: 'i1', verdict: 'unused', context_snapshot: { triptypes: ['camper'] } },
        { item_id: 'i1', verdict: 'unused', context_snapshot: { triptypes: ['camper'] } },
      ],
    };
    const out = generateTripItems(lib, { persons: [], triptypes: ['camper'], weather: ['koud'], activities: [] });
    expect(out).toEqual([]);
  });

  it('keeps an item below the unused threshold (only 2 unused)', () => {
    const lib: Library = {
      ...empty,
      items: [{ id: 'i1', name: 'muggennet', kind: 'packable', default_category: 'pharmacie' }],
      tags: [{ id: 't1', name: 'camper', kind: 'triptype' }],
      itemTags: [{ item_id: 'i1', tag_id: 't1' }],
      feedback: [
        { item_id: 'i1', verdict: 'unused', context_snapshot: { triptypes: ['camper'] } },
        { item_id: 'i1', verdict: 'unused', context_snapshot: { triptypes: ['camper'] } },
      ],
    };
    const out = generateTripItems(lib, { persons: [], triptypes: ['camper'], weather: [], activities: [] });
    expect(out.map(o => o.item_id)).toEqual(['i1']);
  });

  it('does not filter unused items if context has no triptype overlap', () => {
    const lib: Library = {
      ...empty,
      items: [{ id: 'i1', name: 'muggennet', kind: 'packable', default_category: 'pharmacie' }],
      tags: [{ id: 't1', name: 'hotel', kind: 'triptype' }],
      itemTags: [{ item_id: 'i1', tag_id: 't1' }],
      feedback: [
        { item_id: 'i1', verdict: 'unused', context_snapshot: { triptypes: ['camper'] } },
        { item_id: 'i1', verdict: 'unused', context_snapshot: { triptypes: ['camper'] } },
        { item_id: 'i1', verdict: 'unused', context_snapshot: { triptypes: ['camper'] } },
      ],
    };
    const out = generateTripItems(lib, { persons: [], triptypes: ['hotel'], weather: [], activities: [] });
    expect(out.map(o => o.item_id)).toEqual(['i1']);
  });

  it('includes always-meename items (no tags, no person) for any context', () => {
    const lib: Library = {
      ...empty,
      items: [{ id: 'i1', name: 'paspoort', kind: 'packable', default_category: 'stuff' }],
    };
    const out = generateTripItems(lib, { persons: [], triptypes: ['citytrip'], weather: [], activities: [] });
    expect(out.map(o => o.item_id)).toEqual(['i1']);
  });
});
