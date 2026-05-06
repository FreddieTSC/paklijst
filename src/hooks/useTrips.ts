import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { T } from '@/lib/db';
import { useHousehold } from './useHousehold';
import type { Trip, TripContext, TripItem, Item, Tag, ItemTag } from '@/lib/types';
import type { TripItemDraft } from '@/lib/generator';

export function useTrips() {
  const { data: hh } = useHousehold();
  const householdId = hh?.household?.id;
  return useQuery<Trip[]>({
    queryKey: ['trips', householdId],
    enabled: !!householdId,
    queryFn: async () => {
      const { data, error } = await supabase.from(T.trip)
        .select('*').eq('household_id', householdId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTrip(tripId: string | undefined) {
  return useQuery<{
    trip: Trip;
    items: (TripItem & { item: Item })[];
    tagsByItemId: Map<string, string[]>;
    tagsById: Map<string, Tag>;
  } | null>({
    queryKey: ['trip', tripId],
    enabled: !!tripId,
    queryFn: async () => {
      const { data: trip, error: tErr } = await supabase.from(T.trip)
        .select('*').eq('id', tripId!).single();
      if (tErr) throw tErr;
      const { data: items, error: iErr } = await supabase.from(T.trip_item)
        .select(`*, item:${T.item}(*)`).eq('trip_id', tripId!);
      if (iErr) throw iErr;

      const itemIds = (items ?? []).map((i: any) => i.item_id);
      const tagsByItemId = new Map<string, string[]>();
      const tagsById = new Map<string, Tag>();

      if (itemIds.length > 0) {
        const { data: itemTags } = await supabase.from(T.item_tag)
          .select('*').in('item_id', itemIds);
        const tagIds = [...new Set((itemTags ?? []).map((it: any) => it.tag_id))];
        if (tagIds.length > 0) {
          const { data: tags } = await supabase.from(T.tag).select('*').in('id', tagIds);
          for (const tag of (tags ?? []) as Tag[]) tagsById.set(tag.id, tag);
        }
        for (const it of (itemTags ?? []) as ItemTag[]) {
          const arr = tagsByItemId.get(it.item_id) ?? [];
          arr.push(it.tag_id);
          tagsByItemId.set(it.item_id, arr);
        }
      }

      return {
        trip,
        items: (items as unknown as (TripItem & { item: Item })[]) ?? [],
        tagsByItemId,
        tagsById,
      };
    },
  });
}

export interface CreateTripInput {
  name: string;
  start_date: string | null;
  end_date: string | null;
  context: TripContext;
  drafts: TripItemDraft[];
}

export function useCreateTrip() {
  const qc = useQueryClient();
  const { data: hh } = useHousehold();
  const householdId = hh?.household?.id;

  return useMutation({
    mutationFn: async (input: CreateTripInput) => {
      const { data: trip, error: e1 } = await supabase.from(T.trip).insert({
        household_id: householdId!,
        name: input.name,
        start_date: input.start_date,
        end_date: input.end_date,
        status: 'active',
        context: input.context as unknown as Trip['context'],
      }).select('*').single();
      if (e1) throw e1;

      if (input.drafts.length) {
        const rows = input.drafts.map(d => ({
          trip_id: trip.id,
          item_id: d.item_id,
          person_id: d.person_id ?? null,
          checked: false,
          added_manually: false,
          qty: Math.max(1, Math.floor(d.qty ?? 1)),
        }));
        // chunk to avoid payload limits
        const chunk = 100;
        for (let i = 0; i < rows.length; i += chunk) {
          const { error } = await supabase.from(T.trip_item).insert(rows.slice(i, i + chunk));
          if (error) throw error;
        }
      }
      return trip;
    },
    onSuccess: (trip) => {
      qc.invalidateQueries({ queryKey: ['trips', householdId] });
      qc.invalidateQueries({ queryKey: ['trip', trip.id] });
    },
  });
}

export function useToggleTripItem(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, checked }: { id: string; checked: boolean }) => {
      const { error } = await supabase.from(T.trip_item).update({
        checked,
        checked_at: checked ? new Date().toISOString() : null,
      }).eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, checked }) => {
      // optimistic
      await qc.cancelQueries({ queryKey: ['trip', tripId] });
      const prev = qc.getQueryData<{ items: TripItem[] } | null>(['trip', tripId]);
      if (prev) {
        qc.setQueryData(['trip', tripId], {
          ...prev,
          items: prev.items.map(it => it.id === id ? { ...it, checked } : it),
        });
      }
      return { prev };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['trip', tripId], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['trip', tripId] }),
  });
}

export function useRemoveTripItem(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(T.trip_item).delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['trip', tripId] });
      const prev = qc.getQueryData<{ items: TripItem[] } | null>(['trip', tripId]);
      if (prev) {
        qc.setQueryData(['trip', tripId], {
          ...prev,
          items: prev.items.filter(it => it.id !== id),
        });
      }
      return { prev };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['trip', tripId], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['trip', tripId] }),
  });
}

export interface CloseTripVerdict {
  item_id: string;
  verdict: 'used' | 'unused' | 'missing';
}

export function useCloseTrip(tripId: string) {
  const qc = useQueryClient();
  const { data: hh } = useHousehold();
  const householdId = hh?.household?.id;

  return useMutation({
    mutationFn: async ({ verdicts, context }: { verdicts: CloseTripVerdict[]; context: TripContext }) => {
      const snapshot = context as unknown as Trip['context'];
      if (verdicts.length) {
        const rows = verdicts.map(v => ({
          trip_id: tripId,
          item_id: v.item_id,
          verdict: v.verdict,
          context_snapshot: snapshot,
        }));
        const chunk = 100;
        for (let i = 0; i < rows.length; i += chunk) {
          const { error } = await supabase.from(T.trip_feedback).insert(rows.slice(i, i + chunk));
          if (error) throw error;
        }
      }
      const { error } = await supabase.from(T.trip).update({ status: 'closed' }).eq('id', tripId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trip', tripId] });
      qc.invalidateQueries({ queryKey: ['trips', householdId] });
      qc.invalidateQueries({ queryKey: ['trip_feedback_all', householdId] });
    },
  });
}

export function useDuplicateTrip() {
  const qc = useQueryClient();
  const { data: hh } = useHousehold();
  const householdId = hh?.household?.id;

  return useMutation({
    mutationFn: async (sourceTripId: string) => {
      const { data: source, error: e1 } = await supabase.from(T.trip)
        .select('*').eq('id', sourceTripId).single();
      if (e1) throw e1;

      const { data: sourceItems, error: e2 } = await supabase.from(T.trip_item)
        .select('*').eq('trip_id', sourceTripId);
      if (e2) throw e2;

      const { data: trip, error: e3 } = await supabase.from(T.trip).insert({
        household_id: householdId!,
        name: `${source.name} (kopie)`,
        start_date: null,
        end_date: null,
        status: 'active',
        context: source.context,
      }).select('*').single();
      if (e3) throw e3;

      if (sourceItems && sourceItems.length > 0) {
        const rows = sourceItems.map((si: TripItem) => ({
          trip_id: trip.id,
          item_id: si.item_id,
          person_id: si.person_id,
          checked: false,
          added_manually: si.added_manually,
          qty: si.qty ?? 1,
        }));
        const chunk = 100;
        for (let i = 0; i < rows.length; i += chunk) {
          const { error } = await supabase.from(T.trip_item).insert(rows.slice(i, i + chunk));
          if (error) throw error;
        }
      }
      return trip;
    },
    onSuccess: (trip) => {
      qc.invalidateQueries({ queryKey: ['trips', householdId] });
      qc.invalidateQueries({ queryKey: ['trip', trip.id] });
    },
  });
}

export function useUpdateTrip() {
  const qc = useQueryClient();
  const { data: hh } = useHousehold();
  const householdId = hh?.household?.id;

  return useMutation({
    mutationFn: async ({ tripId, ...updates }: {
      tripId: string;
      name?: string;
      start_date?: string | null;
      end_date?: string | null;
      status?: 'planning' | 'active' | 'closed';
    }) => {
      const { data, error } = await supabase.from(T.trip)
        .update(updates).eq('id', tripId).select('*').single();
      if (error) throw error;
      return data;
    },
    onSuccess: (trip) => {
      qc.invalidateQueries({ queryKey: ['trip', trip.id] });
      qc.invalidateQueries({ queryKey: ['trips', householdId] });
    },
  });
}

export function useDeleteTrip() {
  const qc = useQueryClient();
  const { data: hh } = useHousehold();
  const householdId = hh?.household?.id;

  return useMutation({
    mutationFn: async (tripId: string) => {
      const { error } = await supabase.from(T.trip).delete().eq('id', tripId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips', householdId] });
    },
  });
}

export function useAddTripItem(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { item_id: string; person_id?: string | null }) => {
      const { data, error } = await supabase.from(T.trip_item).insert({
        trip_id: tripId,
        item_id: input.item_id,
        person_id: input.person_id ?? null,
        checked: false,
        added_manually: true,
      }).select('*').single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip', tripId] }),
  });
}
