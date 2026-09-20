import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseServer";
import { requireAdmin } from "../../../../lib/requireAdmin";

// POST { customerId: "uuid", dessertId?: "uuid" }
// Staff-only. claim_mini_dessert() refuses unless current_progress = 7,
// records the claim, and resets progress to 0 — all inside one
// transaction so 7/7 can never be claimed twice.
export async function POST(req) {
  const { adminUser, error: authError } = await requireAdmin();
  if (authError) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  const { customerId, dessertId } = await req.json();
  if (!customerId) {
    return NextResponse.json({ error: "CUSTOMER_ID_REQUIRED" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: claim, error } = await db.rpc("claim_mini_dessert", {
    p_customer_id: customerId,
    p_admin_id: adminUser.id,
    p_dessert_id: dessertId ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ claim });
}
