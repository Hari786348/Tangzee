import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "../../../../lib/supabaseServer";
import { verifySession } from "../../../../lib/otpSession";

// POST { email: "someone@example.com", campaignCode: "TZ001", photoUrl?: string }
// Public route (no login) — but requires an OTP-verified session cookie
// for this exact email (see /api/otp/verify), so a claim can't be
// created for an email someone doesn't actually own. Every other rule
// (active, date window, one-claim-per-customer) is enforced inside the
// claim_campaign() SQL function.
export async function POST(req) {
  const { email, campaignCode, photoUrl } = await req.json();

  if (!email || !campaignCode) {
    return NextResponse.json({ error: "EMAIL_AND_CAMPAIGN_REQUIRED" }, { status: 400 });
  }

  const sessionToken = cookies().get("tangzee_session")?.value;
  const verifiedEmail = verifySession(sessionToken, email);
  console.log("DEBUG claim:", { hasToken: !!sessionToken, tokenPreview: sessionToken?.slice(0, 20), inputEmail: email, verifiedEmail });
  if (!verifiedEmail) {
    return NextResponse.json({ error: "EMAIL_NOT_VERIFIED" }, { status: 401 });
  }

  const db = supabaseAdmin();

  let { data: customer } = await db.from("customers").select("*").eq("email", email).single();
  if (!customer) {
    const { data: created, error: createErr } = await db
      .from("customers")
      .insert({ email })
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
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ claim });
}
