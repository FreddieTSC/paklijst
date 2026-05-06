import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { T } from '@/lib/db';
import { useHousehold } from './useHousehold';
import type { Item, ItemTag, ItemForPerson, Category, ItemKind } from '@/lib/types';

export interface ItemWithRelations extends Item {
  tag_ids: string[];
  person_ids: string[];
}

export function useItems() {
  const { data: hh } = useHousehold();
  const householdId = hh?.household?.id;

  return useQuery<ItemWithRelations[]>({
    queryKey: ['items', householdId],
    enabled: !!householdId,
    queryFn: async () => {
      const [itemsRes, itRes, ipRes] = await Promise.all([
        supabase.from(T.item).select('*').eq('household_id', householdId!).order('name'),
        supabase.from(T.item_tag).select('*'),
        supabase.from(T.item_for_person).select('*'),
      ]);
      if (itemsRes.error) throw itemsRes.error;
      if (itRes.error) throw itRes.error;
      if (ipRes.error) throw ipRes.error;

      const tagsByItem = new Map<string, string[]>();
      for (const it of itRes.data as ItemTag[]) {
        const arr = tagsByItem.get(it.item_id) ?? [];
        arr.push(it.tag_id);
        tagsByItem.set(it.item_id, arr);
      }
      const personsByItem = new Map<string, string[]>();
      for (const ip of ipRes.data as ItemForPerson[]) {
        const arr = personsByItem.get(ip.item_id) ?? [];
        arr.push(ip.person_id);
        personsByItem.set(ip.item_id, arr);
      }

      return (itemsRes.data as Item[]).map(i => ({
        ...i,
        tag_ids:    tagsByItem.get(i.id)    ?? [],
        person_ids: personsByItem.get(i.id) ?? [],
      }));
    },
  });
}

export interface ItemDraft {
  id?: string;
  name: string;
  kind: ItemKind;
  default_category: Category;
  wear_on_travel: boolean;
  notes: string | null;
  qty: number;
  qty_per_day: boolean;
  tag_ids: string[];
  person_ids: string[];
}

export function useUpsertItem() {
  const qc = useQueryClient();
  const { data: hh } = useHousehold();
  const householdId = hh?.household?.id;

  return useMutation({
    mutationFn: async (draft: ItemDraft) => {
      let itemId = draft.id;
      const payload = {
        household_id: householdId!,
        name: draft.name,
        kind: draft.kind,
        default_category: draft.default_category,
        wear_on_travel: draft.wear_on_travel,
        notes: draft.notes,
        qty: Math.max(1, Math.floor(draft.qty || 1)),
        qty_per_day: draft.qty_per_day,
      };
      if (itemId) {
        const { error } = await supabase.from(T.item).update(payload).eq('id', itemId);
        if (error) throw error;
        // Replace tag and person links
        await supabase.from(T.item_tag).delete().eq('item_id', itemId);
        await supabase.from(T.item_for_person).delete().eq('item_id', itemId);
      } else {
        const { data, error } = await supabase.from(T.item).insert(payload).select('id').single();
        if (error) throw error;
        itemId = data.id;
      }
      if (draft.tag_ids.length) {
        const { error } = await supabase.from(T.item_tag)
          .insert(draft.tag_ids.map(tag_id => ({ item_id: itemId!, tag_id })));
        if (error) throw error;
      }
      if (draft.person_ids.length) {
        const { error } = await supabase.from(T.item_for_person)
          .insert(draft.person_ids.map(person_id => ({ item_id: itemId!, person_id })));
        if (error) throw error;
      }
      return itemId!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items', householdId] }),
  });
}

export function useRenameItem() {
  const qc = useQueryClient();
  const { data: hh } = useHousehold();
  const householdId = hh?.household?.id;
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from(T.item).update({ name }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items', householdId] });
      qc.invalidateQueries({ predicate: q => q.queryKey[0] === 'trip' });
    },
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  const { data: hh } = useHousehold();
  const householdId = hh?.household?.id;
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(T.item).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items', householdId] }),
  });
}
