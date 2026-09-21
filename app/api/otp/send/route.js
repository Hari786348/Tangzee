import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "../../../../lib/supabaseServer";

// POST { email: "someone@example.com" }
// Public. Generates a 6-digit code, saves it to otp_codes, and emails
// it via Resend.
export async function POST(req) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "EMAIL_REQUIRED" }, { status: 400 });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

  const db = supabaseAdmin();
  const { error: dbError } = await db.from("otp_codes").insert({ email, code, expires_at: expiresAt });
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: "Tangzee <onboarding@resend.dev>",
      to: email,
      subject: "Your Tangzee verification code",
      text: `Your code is: ${code}\n\nThis code expires in 10 minutes.`,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || "OTP_SEND_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ sent: true });
  }
