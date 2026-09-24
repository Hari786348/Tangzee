"use client";
import { useState } from "react";

const PLUM = "#2F243A";

export default function MyJourney() {
  const [email, setEmail] = useState("");
  const [otpStage, setOtpStage] = useState("enter-email"); // enter-email | enter-code | verified
  const [otpCode, setOtpCode] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function sendOtp() {
    setErrorMsg("");
    setLoading(true);
    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const d = await res.json();
    setLoading(false);
    if (!res.ok) {
      setErrorMsg(d.error || "Couldn't send the code. Check the email and try again.");
      return;
    }
    setOtpStage("enter-code");
  }

  async function verifyOtp() {
    setErrorMsg("");
    setLoading(true);
    const res = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: otpCode }),
    });
    const d = await res.json();
    if (!res.ok) {
      setLoading(false);
      setErrorMsg(d.error === "INVALID_CODE" ? "That code isn't right — try again." : d.error);
      return;
    }
    setOtpStage("verified");
    await lookup();
  }

  async function lookup() {
    setLoading(true);
    const res = await fetch(`/api/my-journey?email=${encodeURIComponent(email)}`);
    const d = await res.json();
    setData(d);
    setLoading(false);
  }

  const progress = data?.cycle?.current_progress ?? 0;

  return (
    <main style={{ minHeight: "100vh", background: PLUM, color: "#fff", padding: "32px 20px" }}>
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <h1 style={{ letterSpacing: 2, fontSize: 24 }}>TANGZEE</h1>

        {otpStage === "enter-email" && (
          <div style={{ marginTop: 24 }}>
            <p>Enter your email to see your journey.</p>
            <input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
            <button onClick={sendOtp} disabled={loading || !email} style={buttonStyle}>
              {loading ? "SENDING…" : "SEND CODE"}
            </button>
            {errorMsg && <p style={{ marginTop: 12, opacity: 0.85 }}>{errorMsg}</p>}
          </div>
        )}

        {otpStage === "enter-code" && (
          <div style={{ marginTop: 24 }}>
            <p>Enter the code we emailed to {email}</p>
            <input type="text" placeholder="6-digit code" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} style={inputStyle} />
            <button onClick={verifyOtp} disabled={loading || !otpCode} style={buttonStyle}>
              {loading ? "VERIFYING…" : "VERIFY"}
            </button>
            {errorMsg && <p style={{ marginTop: 12, opacity: 0.85 }}>{errorMsg}</p>}
          </div>
        )}

        {otpStage === "verified" && loading && <p style={{ marginTop: 24 }}>Loading your journey…</p>}

        {otpStage === "verified" && data?.customer && (
          <div style={{ marginTop: 24 }}>
            <p style={{ opacity: 0.8, margin: 0 }}>WELCOME BACK.</p>
            <p style={{ fontSize: 13, letterSpacing: 1, opacity: 0.7, marginTop: 16 }}>CURRENT JOURNEY</p>
            <p style={{ fontSize: 28, fontWeight: 700, margin: "4px 0" }}>{progress} / 7 ORDERS</p>

            <div style={{ display: "flex", gap: 4, margin: "16px 0" }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i < progress ? "#fff" : "#FFFFFF33" }} />
              ))}
            </div>

            {progress >= 7 ? (
              <p style={{ fontSize: 15 }}>A little deliciousness is waiting for you — show this screen at Tangzee.</p>
            ) : (
              <p style={{ fontSize: 14, opacity: 0.85 }}>{progress} orders completed. {7 - progress} more to go.<br />7 orders. Then, a little deliciousness for your mind.</p>
            )}

            <p style={{ fontSize: 13, opacity: 0.6, marginTop: 8 }}>Completed cycles: {data.cycle.completed_cycles}</p>

            {data.claims?.length > 0 && (
              <section style={{ marginTop: 24 }}>
                <h3 style={sectionTitle}>Campaign claims</h3>
                {data.claims.map((c) => (
                  <div key={c.id} style={rowStyle}>
                    <span>{c.campaigns?.title} — {c.claim_code}</span>
                    <span style={{ opacity: 0.7 }}>{c.status}</span>
                  </div>
                ))}
              </section>
            )}

            {data.miniDesserts?.length > 0 && (
              <section style={{ marginTop: 24 }}>
                <h3 style={sectionTitle}>Mini-dessert history</h3>
                {data.miniDesserts.map((m) => (
                  <div key={m.id} style={rowStyle}>
                    <span>Cycle {m.cycle_number} — {m.desserts?.name || "Mini dessert"}</span>
                    <span style={{ opacity: 0.7 }}>{new Date(m.claimed_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </section>
            )}

            {data.orders?.length > 0 && (
              <section style={{ marginTop: 24 }}>
                <h3 style={sectionTitle}>Order history</h3>
                {data.orders.map((o) => (
                  <div key={o.id} style={billStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.7, fontSize: 12 }}>
                      <span>{o.order_number}</span>
                      <span>{new Date(o.created_at).toLocaleDateString()}</span>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      {(o.order_items || []).map((it) => (
                        <div key={it.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
                          <span>{it.desserts?.name || "Item"} × {it.quantity}</span>
                          <span>₹{it.price_at_purchase * it.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1px solid #FFFFFF33" }}>
                      <span style={{ fontWeight: 700 }}>Total ₹{o.total_amount}</span>
                      <span style={{ opacity: 0.7, fontSize: 12 }}>{o.status}</span>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </div>
        )}

        {otpStage === "verified" && data && !data.customer && (
          <p style={{ marginTop: 24, opacity: 0.8 }}>No Tangzee history yet for this email — order in-store to start your journey.</p>
        )}
      </div>
    </main>
  );
}

const sectionTitle = { fontSize: 12, letterSpacing: 1, textTransform: "uppercase", opacity: 0.7, marginBottom: 8 };
const rowStyle = { display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid #FFFFFF1A" };
const billStyle = { border: "1px solid #FFFFFF33", borderRadius: 8, padding: 12, marginBottom: 10 };
const inputStyle = { width: "100%", padding: 14, borderRadius: 6, border: "1px solid #FFFFFF66", background: "transparent", color: "#fff", boxSizing: "border-box" };
const buttonStyle = { marginTop: 12, width: "100%", padding: 14, borderRadius: 6, border: "none", background: "#fff", color: PLUM, fontWeight: 600 };
          
