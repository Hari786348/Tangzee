import crypto from "crypto";

const SECRET = process.env.OTP_SESSION_SECRET;
// ~13 months (400 days) is the longest a browser will keep a cookie, so this is
// as close to "log in once, stay logged in" as the web allows. The session
// route below also renews it every time the customer visits.
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 400;
const MAX_AGE_SECONDS = SESSION_MAX_AGE_SECONDS;

export function signSession(email) {
  const payload = `${email}.${Date.now() + MAX_AGE_SECONDS * 1000}`;
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export function verifySession(token, expectedEmail) {
  if (!token) return false;
  const dotIndex = token.lastIndexOf(".");
  const payloadB64 = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);
  const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  const expectedSig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");

  const sigBuf = Buffer.from(sig, "hex");
  const expectedBuf = Buffer.from(expectedSig, "hex");
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }

  const lastDot = payload.lastIndexOf(".");
  const email = payload.slice(0, lastDot);
  const expiresAt = payload.slice(lastDot + 1);

  if (Date.now() > Number(expiresAt)) return false;
  if (expectedEmail && email !== expectedEmail) return false;
  return email;
}
