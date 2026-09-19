import crypto from "crypto";

// A tiny signed-cookie session: after OTP verification we set a cookie
// containing the phone number plus an HMAC signature (secret never
// leaves the server), so later requests can trust "this browser proved
// it owns this phone number" without a database lookup or a JWT library.
const SECRET = process.env.OTP_SESSION_SECRET;
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function signSession(phone) {
  const payload = `${phone}.${Date.now() + MAX_AGE_SECONDS * 1000}`;
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export function verifySession(token, expectedPhone) {
  if (!token) return false;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return false;
  const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  const expectedSig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  if (sig !== expectedSig) return false;

  const [phone, expiresAt] = payload.split(".");
  if (Date.now() > Number(expiresAt)) return false;
  if (expectedPhone && phone !== expectedPhone) return false;
  return phone;
}
