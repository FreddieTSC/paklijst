/**
 * Logical → physical table & RPC names.
 * All Inpaklijst tables live in the shared KK56 Supabase project, prefixed
 * with `inpaklijst_` so they coexist with `kk56_*` and any future siblings.
 * If we ever move to a dedicated schema, this file is the single point of
 * change — every hook references these constants instead of hard-coded names.
 */
export const T = {
  household:        'inpaklijst_household',
  household_member: 'inpaklijst_household_member',
  person:           'inpaklijst_person',
  item:             'inpaklijst_item',
  tag:              'inpaklijst_tag',
  item_tag:         'inpaklijst_item_tag',
  item_for_person:  'inpaklijst_item_for_person',
  trip:             'inpaklijst_trip',
  trip_item:        'inpaklijst_trip_item',
  trip_feedback:    'inpaklijst_trip_feedback',
} as const;

export const RPC = {
  seed_default_tags: 'inpaklijst_seed_default_tags',
  create_household:  'inpaklijst_create_household',
} as const;
