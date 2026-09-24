import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabaseServer";
import { requireAdmin } from "../../../../../lib/requireAdmin";

// PATCH { available: boolean }
// Any active admin (staff included). This is the ONLY dessert field
// staff can change — it never touches name/price/description, so
// staff can mark something out of stock without owner-level menu
// access. Full edits go through PATCH /api/desserts/[id] (owner-only).
export async function PATCH(req, { params }) {
  const { adminUser, error: authError } = await requireAdmin();
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const { available } = await req.json();
  if (typeof available !== "boolean") {
    return NextResponse.json({ error: "AVAILABLE_BOOLEAN_REQUIRED" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("desserts")
    .update({ available, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await db.from("audit_logs").insert({
    actor_id: adminUser.id,
    action: available ? "DESSERT_MARKED_IN_STOCK" : "DESSERT_MARKED_OUT_OF_STOCK",
    record_id: data.id,
  });

  return NextResponse.json({ dessert: data });
}
