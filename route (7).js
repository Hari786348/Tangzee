import { NextResponse } from "next/server";
import twilio from "twilio";

// POST { phone: "+919876543210" }
// Public. Triggers Twilio Verify to send an SMS code. Phone must be in
// E.164 format (country code + number, e.g. +91 for India).
export async function POST(req) {
  const { phone } = await req.json();
  if (!phone) return NextResponse.json({ error: "PHONE_REQUIRED" }, { status: 400 });

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  try {
    await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to: phone, channel: "sms" });
    return NextResponse.json({ sent: true });
  } catch (e) {
    return NextResponse.json({ error: e.message || "OTP_SEND_FAILED" }, { status: 500 });
  }
}
