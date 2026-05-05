-- Inpaklijst schema (initial)
-- Run in the Supabase SQL editor in order: 0001 → 0002 → 0003.

create extension if not exists "pgcrypto";

create table if not exists household (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists household_member (
  household_id  uuid not null references household(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          text not null check (role in ('owner','member')),
  display_name  text not null,
  primary key (household_id, user_id)
);

create table if not exists person (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references household(id) on delete cascade,
  name          text not null,
  is_child      boolean not null default false,
  user_id       uuid references auth.users(id) on delete set null
);

create table if not exists item (
  id                uuid primary key default gen_random_uuid(),
  household_id      uuid not null references household(id) on delete cascade,
  name              text not null,
  kind              text not null check (kind in ('packable','todo')),
  wear_on_travel    boolean not null default false,
  default_category  text not null check (default_category in
    ('stuff','eten','electronica','pharmacie','spelletjes','kleren','todo')),
  notes             text
);

create table if not exists tag (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references household(id) on delete cascade,
  name          text not null,
  kind          text not null check (kind in ('triptype','weather','activity','custom')),
  unique (household_id, name)
);

create table if not exists item_tag (
  item_id  uuid not null references item(id) on delete cascade,
  tag_id   uuid not null references tag(id)  on delete cascade,
  primary key (item_id, tag_id)
);

create table if not exists item_for_person (
  item_id    uuid not null references item(id)   on delete cascade,
  person_id  uuid not null references person(id) on delete cascade,
  primary key (item_id, person_id)
);

create table if not exists trip (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references household(id) on delete cascade,
  name          text not null,
  start_date    date,
  end_date      date,
  status        text not null default 'planning'
                check (status in ('planning','active','closed')),
  context       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create table if not exists trip_item (
  id              uuid primary key default gen_random_uuid(),
  trip_id         uuid not null references trip(id) on delete cascade,
  item_id         uuid not null references item(id) on delete cascade,
  person_id       uuid references person(id) on delete set null,
  checked         boolean not null default false,
  checked_by      uuid references auth.users(id),
  checked_at      timestamptz,
  added_manually  boolean not null default false,
  unique (trip_id, item_id, person_id)
);

create table if not exists trip_feedback (
  id                uuid primary key default gen_random_uuid(),
  trip_id           uuid not null references trip(id) on delete cascade,
  item_id           uuid not null references item(id) on delete cascade,
  verdict           text not null check (verdict in ('used','unused','missing')),
  context_snapshot  jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now()
);

create index if not exists idx_item_household        on item (household_id);
create index if not exists idx_tag_household         on tag (household_id);
create index if not exists idx_trip_household        on trip (household_id);
create index if not exists idx_trip_item_trip        on trip_item (trip_id);
create index if not exists idx_trip_feedback_item    on trip_feedback (item_id);
