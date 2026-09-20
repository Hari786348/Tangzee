import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "../../../../lib/supabaseServer";
import { verifySession } from "../../../../lib/otpSession";

// POST { phone: "+919876543210", campaignCode: "TZ001", photoUrl?: string }
// Public route (no login) — but requires an OTP-verified session cookie
// for this exact phone (see /api/otp/verify), so a claim can't be
// created for a phone number someone doesn't actually own. Every other
// rule (active, date window, one-claim-per-customer) is enforced inside
// the claim_campaign() SQL function.
export async function POST(req) {
  const { phone, campaignCode, photoUrl } = await req.json();

  if (!phone || !campaignCode) {
    return NextResponse.json({ error: "PHONE_AND_CAMPAIGN_REQUIRED" }, { status: 400 });
  }

  const sessionToken = cookies().get("tangzee_session")?.value;
  if (!verifySession(sessionToken, phone)) {
    return NextResponse.json({ error: "PHONE_NOT_VERIFIED" }, { status: 401 });
  }

  const db = supabaseAdmin();

  // Find or create the customer by phone.
  // NOTE: real OTP verification should happen before this call — see
  // README "Phone verification" section for provider options.
  let { data: customer } = await db.from("customers").select("*").eq("phone", phone).single();
  if (!customer) {
    const { data: created, error: createErr } = await db
      .from("customers")
      .insert({ phone })
      .select()
      .single();
    if (createErr) {
      return NextResponse.json({ error: "CUSTOMER_CREATE_FAILED" }, { status: 500 });
    }
    customer = created;
  }

  const { data: claim, error } = await db.rpc("claim_campaign", {
    p_customer_id: customer.id,
    p_campaign_code: campaignCode,
    p_photo_url: photoUrl ?? null,
  });

  if (error) {
    // error.message carries the exact RAISE EXCEPTION reason, e.g.
    // ALREADY_CLAIMED, CAMPAIGN_NOT_ACTIVE, CAMPAIGN_EXPIRED
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ claim });
}
