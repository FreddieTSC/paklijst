# Supabase setup

## 1. Create a project

1. Go to https://supabase.com/dashboard, create a new project.
2. Pick the closest region (eu-central-1 for Belgium).
3. Save the database password somewhere — you won't need it for the app, but it's useful for psql.

## 2. Run the migrations

Open the SQL editor in your project dashboard and paste each file in order:

1. `migrations/0001_init_schema.sql`
2. `migrations/0002_rls_policies.sql`
3. `migrations/0003_seed_tags_function.sql`
4. `migrations/0004_create_household_rpc.sql`

Run each one. They are idempotent, so re-running is safe.

## 3. Get your keys

In Settings → API:

- **Project URL** → `VITE_SUPABASE_URL` and `SUPABASE_URL`
- **anon public key** → `VITE_SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (only for the import script — never put this in the front-end build)

Copy `.env.example` to `.env.local` in the repo root and fill in the values.

## 4. (Once the app runs) create a household and run the import

1. `npm run dev`, open http://localhost:5173
2. Sign up → onboarding → create your household + persons.
3. Find the household ID in the database (Table editor → `inpaklijst_household` → copy `id`), or via SQL:
   ```sql
   select id, name from inpaklijst_household;
   ```
4. Set env vars and run:
   ```bash
   export SUPABASE_URL=https://xxxxx.supabase.co
   export SUPABASE_SERVICE_ROLE_KEY=eyJ...
   export HOUSEHOLD_ID=<the uuid you copied>
   npm run import
   ```
   It prints the parsed plan and asks for confirmation before writing.
