-- Row-Level Security: every Inpaklijst table is scoped to households
-- the current user is a member of.

alter table inpaklijst_household        enable row level security;
alter table inpaklijst_household_member enable row level security;
alter table inpaklijst_person           enable row level security;
alter table inpaklijst_item             enable row level security;
alter table inpaklijst_tag              enable row level security;
alter table inpaklijst_item_tag         enable row level security;
alter table inpaklijst_item_for_person  enable row level security;
alter table inpaklijst_trip             enable row level security;
alter table inpaklijst_trip_item        enable row level security;
alter table inpaklijst_trip_feedback    enable row level security;

-- Helper: households the calling user belongs to.
create or replace function inpaklijst_current_user_households()
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select household_id from inpaklijst_household_member where user_id = auth.uid();
$$;
grant execute on function inpaklijst_current_user_households() to authenticated;

-- household
drop policy if exists inpaklijst_household_member_read on inpaklijst_household;
create policy inpaklijst_household_member_read on inpaklijst_household
  for select using (id in (select inpaklijst_current_user_households()));

-- NOTE: an "owner-only update/delete" policy on inpaklijst_household needs to look up
-- the calling user's role in inpaklijst_household_member. Doing that via a direct
-- subquery would loop through household_member's RLS — and household_member's policies
-- (below) would in turn trigger this lookup again. We omit owner-write policies here
-- in fase 1 (no UI to update/delete households yet) and will reintroduce them in fase 2
-- via a SECURITY DEFINER helper that bypasses RLS for the lookup.

-- Allow any authenticated user to INSERT a brand-new household (onboarding flow).
-- The matching household_member row is created in the same transaction by the app.
drop policy if exists inpaklijst_household_create_self on inpaklijst_household;
create policy inpaklijst_household_create_self on inpaklijst_household
  for insert with check (auth.uid() is not null);

-- household_member
drop policy if exists inpaklijst_hm_self_read on inpaklijst_household_member;
create policy inpaklijst_hm_self_read on inpaklijst_household_member
  for select using (
    user_id = auth.uid()
    or household_id in (select inpaklijst_current_user_households())
  );

-- See note above: owner-write on household_member would self-recurse. Skipped in fase 1.

-- Allow a user to insert themselves as the owner of a household they just created.
drop policy if exists inpaklijst_hm_self_insert on inpaklijst_household_member;
create policy inpaklijst_hm_self_insert on inpaklijst_household_member
  for insert with check (user_id = auth.uid());

-- Generic household-scoped policies for the rest:
drop policy if exists inpaklijst_person_rw on inpaklijst_person;
create policy inpaklijst_person_rw on inpaklijst_person
  for all using (household_id in (select inpaklijst_current_user_households()))
  with check    (household_id in (select inpaklijst_current_user_households()));

drop policy if exists inpaklijst_item_rw on inpaklijst_item;
create policy inpaklijst_item_rw on inpaklijst_item
  for all using (household_id in (select inpaklijst_current_user_households()))
  with check    (household_id in (select inpaklijst_current_user_households()));

drop policy if exists inpaklijst_tag_rw on inpaklijst_tag;
create policy inpaklijst_tag_rw on inpaklijst_tag
  for all using (household_id in (select inpaklijst_current_user_households()))
  with check    (household_id in (select inpaklijst_current_user_households()));

drop policy if exists inpaklijst_item_tag_rw on inpaklijst_item_tag;
create policy inpaklijst_item_tag_rw on inpaklijst_item_tag
  for all using (item_id in (select id from inpaklijst_item where household_id in (select inpaklijst_current_user_households())))
  with check    (item_id in (select id from inpaklijst_item where household_id in (select inpaklijst_current_user_households())));

drop policy if exists inpaklijst_item_for_person_rw on inpaklijst_item_for_person;
create policy inpaklijst_item_for_person_rw on inpaklijst_item_for_person
  for all using (item_id in (select id from inpaklijst_item where household_id in (select inpaklijst_current_user_households())))
  with check    (item_id in (select id from inpaklijst_item where household_id in (select inpaklijst_current_user_households())));

drop policy if exists inpaklijst_trip_rw on inpaklijst_trip;
create policy inpaklijst_trip_rw on inpaklijst_trip
  for all using (household_id in (select inpaklijst_current_user_households()))
  with check    (household_id in (select inpaklijst_current_user_households()));

drop policy if exists inpaklijst_trip_item_rw on inpaklijst_trip_item;
create policy inpaklijst_trip_item_rw on inpaklijst_trip_item
  for all using (trip_id in (select id from inpaklijst_trip where household_id in (select inpaklijst_current_user_households())))
  with check    (trip_id in (select id from inpaklijst_trip where household_id in (select inpaklijst_current_user_households())));

drop policy if exists inpaklijst_trip_feedback_rw on inpaklijst_trip_feedback;
create policy inpaklijst_trip_feedback_rw on inpaklijst_trip_feedback
  for all using (trip_id in (select id from inpaklijst_trip where household_id in (select inpaklijst_current_user_households())))
  with check    (trip_id in (select id from inpaklijst_trip where household_id in (select inpaklijst_current_user_households())));
