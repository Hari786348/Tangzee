import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "./supabaseServer";

// Verifies the request carries a valid Supabase Auth session AND that the
// signed-in user exists as an active row in admin_users. Every staff-only
// API route calls this first — permission checks happen here, server-side,
// never in the browser.
export async function requireAdmin() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "NOT_AUTHENTICATED" };
  }

  const admin = supabaseAdmin();
  const { data: adminUser } = await admin
    .from("admin_users")
    .select("*")
    .eq("auth_user_id", user.id)
    .eq("active", true)
    .single();

  if (!adminUser) {
    return { error: "NOT_AUTHORIZED" };
  }

  return { adminUser };
}
