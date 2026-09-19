// Server-only Supabase client. Uses the SERVICE ROLE key, which bypasses
// RLS. This file must never be imported into a "use client" component —
// it is only ever called from app/api/**/route.js (server) so the key
// stays on the server and is never sent to the browser.
import { createClient } from "@supabase/supabase-js";

export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}
