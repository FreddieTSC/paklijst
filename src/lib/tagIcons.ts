export const TAG_ICON: Record<string, string> = {
  // triptype
  camper:    '🚐',
  citytrip:  '🏙️',
  tent:      '⛺',
  hotel:     '🏨',
  festival:  '🎪',
  zakenreis: '💼',
  // weather
  warm:      '☀️',
  gemiddeld: '🌤️',
  koud:      '❄️',
  regen:     '🌧️',
  // activity
  fiets:     '🚲',
  zwemmen:   '🏊',
  wandelen:  '🥾',
  uitgaan:   '🍷',
  werk:      '💻',
  bbq:       '🔥',
  koffie:    '☕',
  slapen:    '🛏️',
  strand:    '🏖️',
  muggen:    '🦟',
  hygiene:   '🧴',
};

export function iconFor(tagName: string): string | null {
  return TAG_ICON[tagName] ?? null;
}
