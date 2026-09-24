import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseServer";
import { signSession } from "../../../../lib/otpSession";

// POST { email: "someone@example.com", code: "123456" }
// Public. Checks the code against otp_codes, and if valid, sets a
// signed cookie proving this browser owns this email.
export async function POST(req) {
  const { email, code } = await req.json();
  if (!email || !code) return NextResponse.json({ error: "EMAIL_AND_CODE_REQUIRED" }, { status: 400 });

  const db = supabaseAdmin();

  const { data: otpRow, error: otpError } = await db
    .from("otp_codes")
    .select("*")
    .eq("email", email)
    .eq("code", code)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (otpError || !otpRow) {
    return NextResponse.json({ error: "INVALID_CODE" }, { status: 400 });
  }

  if (new Date(otpRow.expires_at) < new Date()) {
    return NextResponse.json({ error: "CODE_EXPIRED" }, { status: 400 });
  }

  let { data: customer } = await db.from("customers").select("*").eq("email", email).single();
  if (!customer) {
    const { data: created } = await db.from("customers").insert({ email, email_verified: true }).select().single();
    customer = created;
  } else if (!customer.email_verified) {
    await db.from("customers").update({ email_verified: true }).eq("id", customer.id);
  }

  await db.from("otp_codes").delete().eq("email", email).eq("code", code);

  const token = signSession(email);
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
