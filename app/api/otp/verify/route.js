import { NextResponse } from "next/server";
import twilio from "twilio";
import { supabaseAdmin } from "../../../../lib/supabaseServer";
import { signSession } from "../../../../lib/otpSession";

// POST { phone: "+919876543210", code: "123456" }
// Public. On success, marks the customer phone_verified=true (creating
// the customer if new) and sets an HTTP-only signed cookie proving this
// browser owns this phone number. Every route that trusts a phone
// number for a customer-facing action (claim, my-journey) should check
// this cookie instead of taking the phone from the request body alone.
export async function POST(req) {
  const { phone, code } = await req.json();
  if (!phone || !code) return NextResponse.json({ error: "PHONE_AND_CODE_REQUIRED" }, { status: 400 });

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  let check;
  try {
    check = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: phone, code });
  } catch (e) {
    return NextResponse.json({ error: e.message || "OTP_VERIFY_FAILED" }, { status: 500 });
  }

  if (check.status !== "approved") {
    return NextResponse.json({ error: "INVALID_CODE" }, { status: 400 });
  }

  const db = supabaseAdmin();
  let { data: customer } = await db.from("customers").select("*").eq("phone", phone).single();
  if (!customer) {
    const { data: created } = await db.from("customers").insert({ phone, phone_verified: true }).select().single();
    customer = created;
  } else if (!customer.phone_verified) {
    await db.from("customers").update({ phone_verified: true }).eq("id", customer.id);
  }

  const token = signSession(phone);
  const res = NextResponse.json({ verified: true });
  res.cookies.set("tangzee_session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
