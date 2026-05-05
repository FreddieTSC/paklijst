import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { Household, HouseholdMember } from '@/lib/types';

export interface HouseholdContext {
  household: Household | null;
  member: HouseholdMember | null;
}

export function useHousehold() {
  const { user, loading: authLoading } = useAuth();

  return useQuery<HouseholdContext>({
    queryKey: ['household', user?.id],
    enabled: !!user && !authLoading,
    queryFn: async () => {
      const { data: members, error: mErr } = await supabase
        .from('household_member')
        .select('*')
        .eq('user_id', user!.id)
        .limit(1);
      if (mErr) throw mErr;
      const member = members?.[0] ?? null;
      if (!member) return { household: null, member: null };

      const { data: hh, error: hErr } = await supabase
        .from('household')
        .select('*')
        .eq('id', member.household_id)
        .single();
      if (hErr) throw hErr;
      return { household: hh, member };
    },
  });
}
