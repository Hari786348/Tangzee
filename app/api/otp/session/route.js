import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, signSession, SESSION_MAX_AGE_SECONDS } from "../../../../lib/otpSession";

// GET — checks the tangzee_session cookie set by /api/otp/verify.
// Returns { email } if this browser already proved it owns an email,
// so pages like My Journey can skip email + OTP for a returning
// customer. Every successful check also renews the cookie, so a
// customer who visits now and then stays logged in indefinitely.
export async function GET() {
  const token = cookies().get("tangzee_session")?.value;
  const email = verifySession(token);
  if (!email) return NextResponse.json({ email: null });

  const res = NextResponse.json({ email });
  res.cookies.set("tangzee_session", signSession(email), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
  return res;
}
