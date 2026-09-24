import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "../../../lib/supabaseServer";
import { verifySession } from "../../../lib/otpSession";

// GET /api/my-journey?email=someone@example.com
// Requires an OTP-verified session cookie for this exact email (see
// /api/otp/verify) — a journey can only be viewed by the browser that
// proved it owns that email address.
export async function GET(req) {
  const email = new URL(req.url).searchParams.get("email");
  if (!email) return NextResponse.json({ error: "EMAIL_REQUIRED" }, { status: 400 });

  const sessionToken = cookies().get("tangzee_session")?.value;
  if (!verifySession(sessionToken, email)) {
    return NextResponse.json({ error: "EMAIL_NOT_VERIFIED" }, { status: 401 });
  }

  const db = supabaseAdmin();
  const { data: customer } = await db.from("customers").select("*").eq("email", email).single();
  if (!customer) return NextResponse.json({ customer: null });

  const { data: cycle } = await db.from("loyalty_cycles").select("*").eq("customer_id", customer.id).single();
  const { data: claims } = await db
    .from("campaign_claims")
    .select("*, campaigns(campaign_code, title, reward_description)")
    .eq("customer_id", customer.id)
    .order("claimed_at", { ascending: false });
  const { data: miniDesserts } = await db
    .from("mini_dessert_claims")
    .select("*, desserts(name)")
    .eq("customer_id", customer.id)
    .order("claimed_at", { ascending: false });
  const { data: orders } = await db
    .from("orders")
    .select("*, order_items(*, desserts(name))")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({
    customer,
    cycle: cycle || { current_progress: 0, completed_cycles: 0 },
    claims: claims || [],
    miniDesserts: miniDesserts || [],
    orders: orders || [],
  });
}
