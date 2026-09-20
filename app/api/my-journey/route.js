import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "../../../lib/supabaseServer";
import { verifySession } from "../../../lib/otpSession";

// GET /api/my-journey?phone=+919876543210
// Requires an OTP-verified session cookie for this exact phone (see
// /api/otp/verify) — a journey can only be viewed by the browser that
// proved it owns that phone number.
export async function GET(req) {
  const phone = new URL(req.url).searchParams.get("phone");
  if (!phone) return NextResponse.json({ error: "PHONE_REQUIRED" }, { status: 400 });

  const sessionToken = cookies().get("tangzee_session")?.value;
  if (!verifySession(sessionToken, phone)) {
    return NextResponse.json({ error: "PHONE_NOT_VERIFIED" }, { status: 401 });
  }

  const db = supabaseAdmin();
  const { data: customer } = await db.from("customers").select("*").eq("phone", phone).single();
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
