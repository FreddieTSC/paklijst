import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { T } from '@/lib/db';

export function useRealtimeTrip(tripId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!tripId) return;

    const channel = supabase
      .channel(`trip_items:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: T.trip_item,
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['trip', tripId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, qc]);
}
