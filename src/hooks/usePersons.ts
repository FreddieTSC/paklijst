import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useHousehold } from './useHousehold';
import type { Person } from '@/lib/types';

export function usePersons() {
  const { data: hh } = useHousehold();
  const householdId = hh?.household?.id;

  return useQuery<Person[]>({
    queryKey: ['persons', householdId],
    enabled: !!householdId,
    queryFn: async () => {
      const { data, error } = await supabase.from('person')
        .select('*').eq('household_id', householdId!).order('name');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreatePerson() {
  const qc = useQueryClient();
  const { data: hh } = useHousehold();
  const householdId = hh?.household?.id;

  return useMutation({
    mutationFn: async (input: { name: string; is_child: boolean }) => {
      const { data, error } = await supabase.from('person')
        .insert({ household_id: householdId!, ...input, user_id: null })
        .select('*').single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persons', householdId] }),
  });
}

export function useDeletePerson() {
  const qc = useQueryClient();
  const { data: hh } = useHousehold();
  const householdId = hh?.household?.id;
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('person').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persons', householdId] }),
  });
}
