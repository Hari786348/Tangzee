import crypto from "crypto";

// A tiny signed-cookie session: after OTP verification we set a cookie
// containing the email plus an HMAC signature (secret never leaves the
// server), so later requests can trust "this browser proved it owns
// this email" without a database lookup or a JWT library.
const SECRET = process.env.OTP_SESSION_SECRET;
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function signSession(email) {
  const payload = `${email}.${Date.now() + MAX_AGE_SECONDS * 1000}`;
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export function verifySession(token, expectedEmail) {
  if (!token) return false;
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return false;
  const payloadB64 = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);
  const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  const expectedSig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  if (sig !== expectedSig) return false;

  // payload is "email.expiresAt" — email itself may contain dots, so
  // split on the LAST dot only (timestamp is always numeric, no dots).
  const lastDot = payload.lastIndexOf(".");
  if (lastDot === -1) return false;
  const email = payload.slice(0, lastDot);
  const expiresAt = payload.slice(lastDot + 1);

  if (Date.now() > Number(expiresAt)) return false;
  if (expectedEmail && email !== expectedEmail) return false;
  return email;
                                }
