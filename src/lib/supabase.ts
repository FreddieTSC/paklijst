import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL  as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anon) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
    'Copy .env.example to .env.local and fill in your Supabase project credentials.',
  );
}

// We deliberately don't pass <Database> generic here. The hand-written
// Database shape doesn't satisfy the SDK's strict GenericTable constraint
// (interfaces lack the implicit string index signature that Record<string,unknown>
// requires). Runtime is identical; we just give up SDK-side query inference.
// Hooks and callers cast results to the local types defined in src/lib/types.ts.
export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true },
});
