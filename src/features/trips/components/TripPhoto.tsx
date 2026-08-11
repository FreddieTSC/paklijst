import { useState } from 'react';
import { fallbackTripPhoto } from '@/lib/tripPhotos';
import type { Trip } from '@/lib/types';

interface Props {
  trip: Pick<Trip, 'image_url' | 'context'>;
  wrapperClassName: string;
  imgClassName: string;
  overlayClassName?: string;
}

/**
 * Trip header photo. A stored image_url can rot — Unsplash removes photos, and
 * an uploaded file can be deleted from the bucket — which used to leave an empty
 * band. On a load error we drop to a context photo, and hide the block entirely
 * if that fails too.
 */
export function TripPhoto({ trip, wrapperClassName, imgClassName, overlayClassName }: Props) {
  const [failed, setFailed] = useState<string[]>([]);

  // A trip without a photo stays without one — the fallback only rescues a
  // stored url that fails to load.
  const candidates = trip.image_url
    ? [trip.image_url, fallbackTripPhoto(trip.context)]
    : [];
  const src = candidates.find(c => !failed.includes(c));
  if (!src) return null;

  return (
    <div className={wrapperClassName}>
      <img src={src} alt="" className={imgClassName}
           onError={() => setFailed(f => [...f, src])} />
      {overlayClassName && <div className={overlayClassName} />}
    </div>
  );
}
