import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseServer";
import { requireAdmin } from "../../../lib/requireAdmin";

export async function GET() {
  const { error: authError } = await requireAdmin();
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const db = supabaseAdmin();
  const { data, error } = await db.from("shop_settings").select("*").eq("id", 1).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data });
}

export async function PATCH(req) {
  const { adminUser, error: authError } = await requireAdmin();
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const updates = await req.json();
  const allowedFields = ["hero_title", "hero_subtitle"];
  const safeUpdates = {};
  for (const key of allowedFields) {
    if (key in updates) safeUpdates[key] = updates[key];
  }

  const db = supabaseAdmin();
  const { data, error } = await db.from("shop_settings").update(safeUpdates).eq("id", 1).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await db.from("audit_logs").insert({ actor_id: adminUser.id, action: "SETTINGS_UPDATED", record_id: null });

  return NextResponse.json({ settings: data });
}
