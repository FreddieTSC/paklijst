-- Helper to seed the standard set of tags for a freshly created household.
create or replace function seed_default_tags(h_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into tag (household_id, name, kind) values
    (h_id, 'citytrip',  'triptype'),
    (h_id, 'camper',    'triptype'),
    (h_id, 'tent',      'triptype'),
    (h_id, 'hotel',     'triptype'),
    (h_id, 'festival',  'triptype'),
    (h_id, 'zakenreis', 'triptype'),
    (h_id, 'warm',      'weather'),
    (h_id, 'gemiddeld', 'weather'),
    (h_id, 'koud',      'weather'),
    (h_id, 'regen',     'weather'),
    (h_id, 'fiets',     'activity'),
    (h_id, 'zwemmen',   'activity'),
    (h_id, 'wandelen',  'activity'),
    (h_id, 'uitgaan',   'activity'),
    (h_id, 'werk',      'activity')
  on conflict (household_id, name) do nothing;
end;
$$;

grant execute on function seed_default_tags(uuid) to authenticated;
