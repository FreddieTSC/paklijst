-- Inpaklijst schema (initial)
-- All tables live in `public` with the `inpaklijst_` prefix to coexist with
-- other apps in the same Supabase project (e.g. kk56_*). Logical names are
-- abstracted in src/lib/db.ts so a future move to a dedicated schema is a
-- single-file change.

create extension if not exists "pgcrypto";

create table if not exists inpaklijst_household (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists inpaklijst_household_member (
  household_id  uuid not null references inpaklijst_household(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          text not null check (role in ('owner','member')),
  display_name  text not null,
  primary key (household_id, user_id)
);

create table if not exists inpaklijst_person (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references inpaklijst_household(id) on delete cascade,
  name          text not null,
  is_child      boolean not null default false,
  user_id       uuid references auth.users(id) on delete set null
);

create table if not exists inpaklijst_item (
  id                uuid primary key default gen_random_uuid(),
  household_id      uuid not null references inpaklijst_household(id) on delete cascade,
  name              text not null,
  kind              text not null check (kind in ('packable','todo')),
  wear_on_travel    boolean not null default false,
  default_category  text not null check (default_category in
    ('stuff','eten','electronica','pharmacie','spelletjes','kleren','todo')),
  notes             text
);

create table if not exists inpaklijst_tag (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references inpaklijst_household(id) on delete cascade,
  name          text not null,
  kind          text not null check (kind in ('triptype','weather','activity','custom')),
  unique (household_id, name)
);

create table if not exists inpaklijst_item_tag (
  item_id  uuid not null references inpaklijst_item(id) on delete cascade,
  tag_id   uuid not null references inpaklijst_tag(id)  on delete cascade,
  primary key (item_id, tag_id)
);

create table if not exists inpaklijst_item_for_person (
  item_id    uuid not null references inpaklijst_item(id)   on delete cascade,
  person_id  uuid not null references inpaklijst_person(id) on delete cascade,
  primary key (item_id, person_id)
);

create table if not exists inpaklijst_trip (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references inpaklijst_household(id) on delete cascade,
  name          text not null,
  start_date    date,
  end_date      date,
  status        text not null default 'planning'
                check (status in ('planning','active','closed')),
  context       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create table if not exists inpaklijst_trip_item (
  id              uuid primary key default gen_random_uuid(),
  trip_id         uuid not null references inpaklijst_trip(id) on delete cascade,
  item_id         uuid not null references inpaklijst_item(id) on delete cascade,
  person_id       uuid references inpaklijst_person(id) on delete set null,
  checked         boolean not null default false,
  checked_by      uuid references auth.users(id),
  checked_at      timestamptz,
  added_manually  boolean not null default false,
  unique (trip_id, item_id, person_id)
);

create table if not exists inpaklijst_trip_feedback (
  id                uuid primary key default gen_random_uuid(),
  trip_id           uuid not null references inpaklijst_trip(id) on delete cascade,
  item_id           uuid not null references inpaklijst_item(id) on delete cascade,
  verdict           text not null check (verdict in ('used','unused','missing')),
  context_snapshot  jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now()
);

create index if not exists idx_inpaklijst_item_household        on inpaklijst_item (household_id);
create index if not exists idx_inpaklijst_tag_household         on inpaklijst_tag (household_id);
create index if not exists idx_inpaklijst_trip_household        on inpaklijst_trip (household_id);
create index if not exists idx_inpaklijst_trip_item_trip        on inpaklijst_trip_item (trip_id);
create index if not exists idx_inpaklijst_trip_feedback_item    on inpaklijst_trip_feedback (item_id);
