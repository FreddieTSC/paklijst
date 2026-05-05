-- Atomic onboarding: creates a household, owner-member row, persons,
-- and seeds default tags in one transaction. SECURITY DEFINER so it
-- bypasses the chicken-and-egg between the household INSERT policy
-- and household_member's read-policy on the just-created row.

create or replace function inpaklijst_create_household(
  p_name         text,
  p_display_name text,
  p_persons      jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id     uuid := auth.uid();
  v_household   uuid;
  v_person      jsonb;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'household name is required';
  end if;
  if coalesce(trim(p_display_name), '') = '' then
    raise exception 'display name is required';
  end if;

  insert into inpaklijst_household (name)
    values (trim(p_name))
    returning id into v_household;

  insert into inpaklijst_household_member (household_id, user_id, role, display_name)
    values (v_household, v_user_id, 'owner', trim(p_display_name));

  if jsonb_typeof(p_persons) = 'array' then
    for v_person in select * from jsonb_array_elements(p_persons)
    loop
      if coalesce(trim(v_person->>'name'), '') <> '' then
        insert into inpaklijst_person (household_id, name, is_child)
          values (
            v_household,
            trim(v_person->>'name'),
            coalesce((v_person->>'is_child')::boolean, false)
          );
      end if;
    end loop;
  end if;

  perform inpaklijst_seed_default_tags(v_household);

  return v_household;
end;
$$;

grant execute on function inpaklijst_create_household(text, text, jsonb) to authenticated;
