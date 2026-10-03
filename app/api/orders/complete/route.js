import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseServer";
import { requireAdmin } from "../../../../lib/requireAdmin";

// POST { orderId: "uuid" }
// Staff-only. The PENDING -> COMPLETED transition and the +1 to
// loyalty_cycles both happen inside complete_order() in one transaction,
// so an order can never be double-counted even under a double-tap.
export async function POST(req) {
  const { adminUser, error: authError } = await requireAdmin();
  if (authError) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  const { orderId } = await req.json();
  if (!orderId) {
    return NextResponse.json({ error: "ORDER_ID_REQUIRED" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: order, error } = await db.rpc("complete_order", {
    p_order_id: orderId,
    p_admin_id: adminUser.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data: cycle } = await db
    .from("loyalty_cycles")
    .select("*")
    .eq("customer_id", order.customer_id)
    .single();

  // A milkshake/snack-only order doesn't touch loyalty_cycles at all
  // (points only count for "dessert" category items), so there may be
  // no row yet — fall back to 0/7 rather than returning null.
  return NextResponse.json({ order, cycle: cycle || { current_progress: 0, completed_cycles: 0 } });
}
