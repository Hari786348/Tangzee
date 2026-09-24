import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseServer";
import { requireAdmin } from "../../../../lib/requireAdmin";

// GET /api/customers/search?email=someone@example.com
// Any active admin (staff included) — Counter Mode uses this to look
// up a customer by email and give loyalty points/offers.
export async function GET(req) {
  const { error: authError } = await requireAdmin();
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const email = new URL(req.url).searchParams.get("email");
  if (!email) return NextResponse.json({ error: "EMAIL_REQUIRED" }, { status: 400 });

  const db = supabaseAdmin();

  let { data: customer } = await db.from("customers").select("*").eq("email", email).single();
  if (!customer) {
    return NextResponse.json({ customer: null }); // let staff decide to create via order creation
  }

  const { data: cycle } = await db.from("loyalty_cycles").select("*").eq("customer_id", customer.id).single();
  const { data: claims } = await db
    .from("campaign_claims")
    .select("*, campaigns(campaign_code, title, reward_description)")
    .eq("customer_id", customer.id)
    .eq("status", "AVAILABLE");
  const { data: orders } = await db
    .from("orders")
    .select("*, order_items(*, desserts(name))")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({
    customer,
    cycle: cycle || { current_progress: 0, completed_cycles: 0 },
    availableClaims: claims || [],
    recentOrders: orders || [],
  });
}
