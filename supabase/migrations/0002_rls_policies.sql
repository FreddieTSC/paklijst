-- Row-Level Security: every table is scoped to households the current user is a member of.

alter table household        enable row level security;
alter table household_member enable row level security;
alter table person           enable row level security;
alter table item             enable row level security;
alter table tag              enable row level security;
alter table item_tag         enable row level security;
alter table item_for_person  enable row level security;
alter table trip             enable row level security;
alter table trip_item        enable row level security;
alter table trip_feedback    enable row level security;

-- Helper: households the calling user belongs to.
create or replace function current_user_households()
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select household_id from household_member where user_id = auth.uid();
$$;

-- household
drop policy if exists household_member_read on household;
create policy household_member_read on household
  for select using (id in (select current_user_households()));

drop policy if exists household_owner_write on household;
create policy household_owner_write on household
  for all using (id in (
    select household_id from household_member
    where user_id = auth.uid() and role = 'owner'
  ))
  with check (id in (
    select household_id from household_member
    where user_id = auth.uid() and role = 'owner'
  ));

-- Allow any authenticated user to INSERT a brand-new household (onboarding flow).
-- The matching household_member row is created in the same transaction by the app.
drop policy if exists household_create_self on household;
create policy household_create_self on household
  for insert with check (auth.uid() is not null);

-- household_member
drop policy if exists hm_self_read on household_member;
create policy hm_self_read on household_member
  for select using (
    user_id = auth.uid()
    or household_id in (select current_user_households())
  );

drop policy if exists hm_owner_write on household_member;
create policy hm_owner_write on household_member
  for all using (
    household_id in (
      select household_id from household_member
      where user_id = auth.uid() and role = 'owner'
    )
  )
  with check (
    household_id in (
      select household_id from household_member
      where user_id = auth.uid() and role = 'owner'
    )
  );

-- Allow a user to insert themselves as the owner of a household they just created.
drop policy if exists hm_self_insert on household_member;
create policy hm_self_insert on household_member
  for insert with check (user_id = auth.uid());

-- Generic household-scoped policies for the rest:
drop policy if exists person_rw on person;
create policy person_rw on person
  for all using (household_id in (select current_user_households()))
  with check    (household_id in (select current_user_households()));

drop policy if exists item_rw on item;
create policy item_rw on item
  for all using (household_id in (select current_user_households()))
  with check    (household_id in (select current_user_households()));

drop policy if exists tag_rw on tag;
create policy tag_rw on tag
  for all using (household_id in (select current_user_households()))
  with check    (household_id in (select current_user_households()));

drop policy if exists item_tag_rw on item_tag;
create policy item_tag_rw on item_tag
  for all using (item_id in (select id from item where household_id in (select current_user_households())))
  with check    (item_id in (select id from item where household_id in (select current_user_households())));

drop policy if exists item_for_person_rw on item_for_person;
create policy item_for_person_rw on item_for_person
  for all using (item_id in (select id from item where household_id in (select current_user_households())))
  with check    (item_id in (select id from item where household_id in (select current_user_households())));

drop policy if exists trip_rw on trip;
create policy trip_rw on trip
  for all using (household_id in (select current_user_households()))
  with check    (household_id in (select current_user_households()));

drop policy if exists trip_item_rw on trip_item;
create policy trip_item_rw on trip_item
  for all using (trip_id in (select id from trip where household_id in (select current_user_households())))
  with check    (trip_id in (select id from trip where household_id in (select current_user_households())));

drop policy if exists trip_feedback_rw on trip_feedback;
create policy trip_feedback_rw on trip_feedback
  for all using (trip_id in (select id from trip where household_id in (select current_user_households())))
  with check    (trip_id in (select id from trip where household_id in (select current_user_households())));
