import crypto from "crypto";

const SECRET = process.env.OTP_SESSION_SECRET;
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function signSession(email) {
  const payload = `${email}.${Date.now() + MAX_AGE_SECONDS * 1000}`;
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export function verifySession(token, expectedEmail) {
  if (!token) {
    console.log("DEBUG verifySession: no token");
    return false;
  }
  const dotIndex = token.lastIndexOf(".");
  const payloadB64 = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);
  const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  const expectedSig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");

  console.log("DEBUG verifySession:", {
    secretExists: !!SECRET,
    secretLength: SECRET?.length,
    payload,
    sig,
    expectedSig,
    sigMatch: sig === expectedSig,
  });

  if (sig !== expectedSig) return false;

  const lastDot = payload.lastIndexOf(".");
  const email = payload.slice(0, lastDot);
  const expiresAt = payload.slice(lastDot + 1);

  console.log("DEBUG verifySession part2:", { email, expiresAt, expectedEmail, emailMatch: email === expectedEmail, expired: Date.now() > Number(expiresAt) });

  if (Date.now() > Number(expiresAt)) return false;
  if (expectedEmail && email !== expectedEmail) return false;
  return email;
}
