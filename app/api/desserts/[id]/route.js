import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseServer";
import { requireAdmin } from "../../../../lib/requireAdmin";

// PATCH { name?, description?, price?, image_url?, category?, available?, featured? }
// Staff-only. Used for edit AND archive (archive = { available: false }).
export async function PATCH(req, { params }) {
  const { adminUser, error: authError } = await requireAdmin();
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const updates = await req.json();
  updates.updated_at = new Date().toISOString();

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("desserts")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await db.from("audit_logs").insert({ actor_id: adminUser.id, action: "DESSERT_EDITED", record_id: data.id });

  return NextResponse.json({ dessert: data });
}

// DELETE removes a dessert permanently. Staff-only.
export async function DELETE(req, { params }) {
  const { adminUser, error: authError } = await requireAdmin();
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const db = supabaseAdmin();
  const { error } = await db.from("desserts").delete().eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await db.from("audit_logs").insert({ actor_id: adminUser.id, action: "DESSERT_DELETED", record_id: params.id });

  return NextResponse.json({ success: true });
    }
