import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseServer";
import { requireAdmin } from "../../../../lib/requireAdmin";

// PATCH { name?, description?, price?, image_url?, category?, available?, featured? }
// Owner-only. Full edit (name/price/etc). For staff marking an item
// out of stock, use PATCH .../availability instead.
export async function PATCH(req, { params }) {
  const { adminUser, error: authError } = await requireAdmin({ requireOwner: true });
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const updates = await req.json();
  if (typeof updates.category === "string") updates.category = updates.category.trim();
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

// DELETE removes a dessert permanently. Owner-only. Blocked if the
// item has ever been ordered (deleting it would break past bills) —
// archive it instead so it just disappears from the live menu.
export async function DELETE(req, { params }) {
  const { adminUser, error: authError } = await requireAdmin({ requireOwner: true });
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const db = supabaseAdmin();

  const { count: orderCount } = await db
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("dessert_id", params.id);

  if (orderCount && orderCount > 0) {
    return NextResponse.json(
      { error: "HAS_ORDER_HISTORY", orderCount },
      { status: 409 }
    );
  }

  const { error } = await db.from("desserts").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await db.from("audit_logs").insert({ actor_id: adminUser.id, action: "DESSERT_DELETED", record_id: params.id });

  return NextResponse.json({ success: true });
}
