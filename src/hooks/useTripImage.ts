import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { T } from '@/lib/db';

const BUCKET = 'trip-images';

export function useUploadTripImage(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${tripId}/${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);

      const { error: updateErr } = await supabase
        .from(T.trip)
        .update({ image_url: publicUrl })
        .eq('id', tripId);
      if (updateErr) throw updateErr;

      return publicUrl;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trip', tripId] });
      qc.invalidateQueries({ predicate: q => q.queryKey[0] === 'trips' });
    },
  });
}

export function useRemoveTripImage(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from(T.trip)
        .update({ image_url: null })
        .eq('id', tripId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trip', tripId] });
      qc.invalidateQueries({ predicate: q => q.queryKey[0] === 'trips' });
    },
  });
}
