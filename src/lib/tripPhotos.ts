/**
 * Curated Unsplash photos per tag. When creating a trip the most relevant
 * photo is picked based on the trip's context (triptypes > activities > weather).
 * Multiple options per tag so repeat trips don't all look the same.
 */

const BASE = 'https://images.unsplash.com/photo-';
const PARAMS = '?w=1200&h=400&fit=crop&q=80';
const u = (id: string) => `${BASE}${id}${PARAMS}`;

const PHOTOS: Record<string, string[]> = {
  // triptypes — highest priority
  camper:    [u('1561361513-2d000a50f0dc'), u('1523987355-ad5ab4ef1588'), u('1506012787-fff22806ab9b')],
  citytrip:  [u('1480714378408-67cf0d13bc1b'), u('1519501025264-65ba15a82390'), u('1477959858617-67f85cf4f1df')],
  tent:      [u('1504280390367-361c6d9f38f4'), u('1478131143263-91c2830560f0'), u('1510312305653-8ed496efae75')],
  hotel:     [u('1566073771259-6a8506099945'), u('1551882547-ff40c63fe5fa'), u('1582719508461-905c673c839b')],
  festival:  [u('1533174072545-7a4b6ad7a6c3'), u('1514525253161-7a46d19cd819'), u('1459749411175-04bf5292ceea')],
  zakenreis: [u('1497366216548-37526070297c'), u('1497366811353-6870744d04b2'), u('1486406146926-c627a92ad1ab')],
  kamperen:  [u('1504280390367-361c6d9f38f4'), u('1510312305653-8ed496efae75'), u('1478131143263-91c2830560f0')],

  // activities
  fiets:     [u('1541625602330-2277a4c46182'), u('1507035895480-2b3156c31fc8'), u('1476480862126-209bfaa8c3a7')],
  zwemmen:   [u('1530053969600-cacd2b839f68'), u('1507525428034-b723cf961d3e'), u('1519046904884-53103b34b206')],
  wandelen:  [u('1551632811-561732d1e306'), u('1501555088652-021faa106b9b'), u('1533240332-0c5f1babd19c')],
  uitgaan:   [u('1414235077428-338989a2e8c0'), u('1470337458703-46ad1756a187'), u('1510812431401-41d2bd2722f3')],
  werk:      [u('1497366216548-37526070297c'), u('1486312338219-ce68d2c6f44d'), u('1497366811353-6870744d04b2')],
  bbq:       [u('1555939594-58d7cb561ad1'), u('1529692236671-f1f6cf9683ba'), u('1534797258661-05a3a390e5d6')],
  strand:    [u('1507525428034-b723cf961d3e'), u('1519046904884-53103b34b206'), u('1506929562872-bb421503ef21')],

  // weather — lowest priority, used as fallback
  warm:      [u('1507525428034-b723cf961d3e'), u('1473496169904-658ba7c44d8a'), u('1504701954957-2010ec3bcec1')],
  koud:      [u('1477601263568-180e2c2c0e79'), u('1517299321609-52687d1bc55a'), u('1491002052546-bf38f186af56')],
  regen:     [u('1515694346937-b85b7b5411d4'), u('1428592953211-077101b2021b'), u('1501691223387-dd0500403074')],
  gemiddeld: [u('1500964757637-c85e8a162699'), u('1441974231531-c6227db76b6e'), u('1506905925346-21bda4d32df4')],
};

/**
 * Pick the best matching photo for a trip context.
 * Priority: triptypes → activities → weather → random fallback.
 */
export function pickTripPhoto(context: {
  triptypes?: string[];
  activities?: string[];
  weather?: string[];
}): string {
  const { triptypes = [], activities = [], weather = [] } = context;

  // Try triptypes first, then activities, then weather
  for (const pool of [triptypes, activities, weather]) {
    for (const tag of pool) {
      const key = tag.toLowerCase();
      const photos = PHOTOS[key];
      if (photos?.length) {
        return photos[Math.floor(Math.random() * photos.length)];
      }
    }
  }

  // Fallback: random from all photos
  const all = Object.values(PHOTOS).flat();
  return all[Math.floor(Math.random() * all.length)];
}
