import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useHousehold } from './useHousehold';
import type { Trip, TripContext, TripItem, Item } from '@/lib/types';
import type { TripItemDraft } from '@/lib/generator';

export function useTrips() {
  const { data: hh } = useHousehold();
  const householdId = hh?.household?.id;
  return useQuery<Trip[]>({
    queryKey: ['trips', householdId],
    enabled: !!householdId,
    queryFn: async () => {
      const { data, error } = await supabase.from('trip')
        .select('*').eq('household_id', householdId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTrip(tripId: string | undefined) {
  return useQuery<{ trip: Trip; items: (TripItem & { item: Item })[] } | null>({
    queryKey: ['trip', tripId],
    enabled: !!tripId,
    queryFn: async () => {
      const { data: trip, error: tErr } = await supabase.from('trip')
        .select('*').eq('id', tripId!).single();
      if (tErr) throw tErr;
      const { data: items, error: iErr } = await supabase.from('trip_item')
        .select('*, item:item_id(*)').eq('trip_id', tripId!);
      if (iErr) throw iErr;
      return { trip, items: (items as unknown as (TripItem & { item: Item })[]) ?? [] };
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
      const { data: trip, error: e1 } = await supabase.from('trip').insert({
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
        }));
        // chunk to avoid payload limits
        const chunk = 100;
        for (let i = 0; i < rows.length; i += chunk) {
          const { error } = await supabase.from('trip_item').insert(rows.slice(i, i + chunk));
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
      const { error } = await supabase.from('trip_item').update({
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
      const { error } = await supabase.from('trip_item').delete().eq('id', id);
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

export function useAddTripItem(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { item_id: string; person_id?: string | null }) => {
      const { data, error } = await supabase.from('trip_item').insert({
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
