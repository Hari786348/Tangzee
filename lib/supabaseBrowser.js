// Browser-safe Supabase client. Uses the anon key, which RLS restricts
// to read-only access on desserts (available=true), campaigns
// (status='ACTIVE') and shop_settings. All writes and business logic
// go through the app/api/** server routes instead.
import { createClient } from "@supabase/supabase-js";

export function supabaseBrowser() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
