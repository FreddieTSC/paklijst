import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { T } from '@/lib/db';
import { useHousehold } from './useHousehold';
import type { Tag, TagKind } from '@/lib/types';

export function useTags() {
  const { data: hh } = useHousehold();
  const householdId = hh?.household?.id;
  return useQuery<Tag[]>({
    queryKey: ['tags', householdId],
    enabled: !!householdId,
    queryFn: async () => {
      const { data, error } = await supabase.from(T.tag)
        .select('*').eq('household_id', householdId!).order('kind').order('name');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  const { data: hh } = useHousehold();
  const householdId = hh?.household?.id;
  return useMutation({
    mutationFn: async (input: { name: string; kind: TagKind }) => {
      const { data, error } = await supabase.from(T.tag)
        .insert({ household_id: householdId!, ...input })
        .select('*').single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags', householdId] }),
  });
}
