"use client";
import { useEffect, useState } from "react";

const PLUM = "#2F243A";

export default function CounterMode() {
  const [email, setEmail] = useState("");
  const [customerData, setCustomerData] = useState(null);
  const [desserts, setDesserts] = useState([]);
  const [cart, setCart] = useState({}); // dessertId -> qty
  const [claimCode, setClaimCode] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/desserts")
      .then((r) => r.json())
      .then((d) => setDesserts((d.desserts || []).filter((x) => x.available)));
  }, []);

  async function searchCustomer() {
    setMsg("");
    const res = await fetch(`/api/customers/search?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    setCustomerData(data.customer ? data : { customer: null });
  }

  function addToCart(id) {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  }
  function removeFromCart(id) {
    setCart((c) => {
      const next = { ...c };
      if (next[id] > 1) next[id] -= 1;
      else delete next[id];
      return next;
    });
  }

  async function createOrder() {
    const items = Object.entries(cart).map(([dessertId, quantity]) => ({ dessertId, quantity }));
    if (items.length === 0) return;
    const res = await fetch("/api/orders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, items }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error);
      return;
    }
    setMsg(`Order ${data.order.order_number} created — PENDING. Mark completed once paid.`);
    setCart({});
    searchCustomer();
  }

  async function completeOrder(orderId) {
    const res = await fetch("/api/orders/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error);
      return;
    }
    setMsg(
      data.cycle.current_progress === 0
        ? "Order completed. 7/7 reached — mini dessert eligible below!"
        : `Order completed. Progress: ${data.cycle.current_progress}/7`
    );
    searchCustomer();
  }

  async function verifyClaim() {
    setMsg("");
    // Reuse redeem endpoint's error to also "verify": we look it up via
    // available claims list already fetched per-customer; here we just
    // redeem directly since staff confirms visually first.
    const res = await fetch("/api/campaign/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimCode }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error === "ALREADY_REDEEMED" ? "This claim was already redeemed." : data.error);
      return;
    }
    setMsg(`Redeemed ${data.claim.claim_code}.`);
    setClaimCode("");
    if (customerData?.customer) searchCustomer();
  }

  async function claimMiniDessert() {
    const res = await fetch("/api/mini-dessert/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: customerData.customer.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error);
      return;
    }
    setMsg("Mini dessert marked as claimed. Journey reset to 0/7.");
    searchCustomer();
  }

  const cycle = customerData?.cycle;
  const atSeven = cycle && cycle.current_progress >= 7;
  const billTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const d = desserts.find((x) => x.id === id);
    return sum + (d ? d.price * qty : 0);
  }, 0);

  return (
    <main style={{ minHeight: "100vh", background: "#FAFAFA", padding: 16 }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ color: PLUM, fontSize: 20, letterSpacing: 1 }}>COUNTER MODE</h1>

        <section style={cardStyle}>
          <h3 style={h3Style}>Search customer</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="Customer email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...inputStyle, marginTop: 0 }} />
            <button onClick={searchCustomer} style={{ ...buttonStyle, width: "auto", marginTop: 0, padding: "10px 16px" }}>Find</button>
          </div>

          {customerData?.customer && (
            <div style={{ marginTop: 12 }}>
              <p style={{ margin: 0 }}><strong>{customerData.customer.email}</strong></p>
              <p style={{ margin: "4px 0", color: PLUM, fontWeight: 700 }}>
                Journey: {cycle?.current_progress ?? 0} / 7 &nbsp;·&nbsp; Cycles completed: {cycle?.completed_cycles ?? 0}
              </p>

              {atSeven && (
                <button onClick={claimMiniDessert} style={{ ...buttonStyle, background: "#000" }}>
                  MARK MINI DESSERT AS CLAIMED
                </button>
              )}

              {customerData.availableClaims?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>Available campaign claims:</p>
                  {customerData.availableClaims.map((c) => (
                    <p key={c.id} style={{ fontSize: 13, margin: "2px 0" }}>
                      {c.claim_code} — {c.campaigns?.title}
                    </p>
                  ))}
                </div>
              )}

              {customerData.recentOrders?.some((o) => o.status === "PENDING") && (
                <div style={{ marginTop: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>Pending orders:</p>
                  {customerData.recentOrders.filter((o) => o.status === "PENDING").map((o) => (
                    <div key={o.id} style={{ border: "1px solid #00000015", borderRadius: 8, padding: 10, marginTop: 6 }}>
                      <p style={{ margin: "0 0 6px", fontSize: 12, color: "#888" }}>{o.order_number}</p>
                      {(o.order_items || []).map((it) => (
                        <div key={it.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "2px 0" }}>
                          <span>{it.desserts?.name || "Item"} × {it.quantity}</span>
                          <span>₹{it.price_at_purchase * it.quantity}</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, paddingTop: 6, borderTop: "1px solid #00000015" }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>Total ₹{o.total_amount}</span>
                        <button onClick={() => completeOrder(o.id)} style={smallButtonStyle}>MARK COMPLETED</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {customerData && !customerData.customer && (
            <p style={{ fontSize: 13, color: "#666", marginTop: 8 }}>No customer yet — creating an order below will create one.</p>
          )}
        </section>

        <section style={cardStyle}>
          <h3 style={h3Style}>Create order</h3>
          {desserts.map((d) => (
            <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
              <span style={{ fontSize: 14 }}>{d.name} — ₹{d.price}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => removeFromCart(d.id)} style={smallButtonStyle}>-</button>
                <span>{cart[d.id] || 0}</span>
                <button onClick={() => addToCart(d.id)} style={smallButtonStyle}>+</button>
              </div>
            </div>
          ))}

          {Object.keys(cart).length > 0 && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px dashed #00000025" }}>
              <p style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#999", margin: "0 0 8px" }}>Bill</p>
              {Object.entries(cart).map(([id, qty]) => {
                const d = desserts.find((x) => x.id === id);
                if (!d) return null;
                return (
                  <div key={id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
                    <span>{d.name} × {qty}</span>
                    <span>₹{d.price * qty}</span>
                  </div>
                );
              })}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15, marginTop: 6, paddingTop: 6, borderTop: "1px solid #00000015" }}>
                <span>Total</span>
                <span>₹{billTotal}</span>
              </div>
            </div>
          )}

          <button onClick={createOrder} style={buttonStyle} disabled={!email || Object.keys(cart).length === 0}>
            CREATE ORDER (PENDING) — ₹{billTotal}
          </button>
        </section>

        <section style={cardStyle}>
          <h3 style={h3Style}>Verify / redeem campaign claim</h3>
          <input placeholder="Claim code e.g. TZ001-X7K9P2" value={claimCode} onChange={(e) => setClaimCode(e.target.value)} style={inputStyle} />
          <button onClick={verifyClaim} style={buttonStyle}>REDEEM</button>
        </section>

        {msg && <p style={{ background: "#fff", padding: 12, borderRadius: 8, border: "1px solid #00000015" }}>{msg}</p>}
      </div>
    </main>
  );
}

const cardStyle = { background: "#fff", border: "1px solid #00000012", borderRadius: 10, padding: 16, marginTop: 16 };
const h3Style = { marginTop: 0, fontSize: 14, letterSpacing: 1, textTransform: "uppercase", color: "#666" };
const inputStyle = { width: "100%", padding: 10, marginTop: 8, borderRadius: 6, border: "1px solid #00000030", boxSizing: "border-box" };
const buttonStyle = { marginTop: 12, padding: 10, width: "100%", background: PLUM, color: "#fff", border: "none", borderRadius: 6, fontWeight: 600 };
const smallButtonStyle = { padding: "6px 10px", border: "1px solid #00000030", background: "#fff", borderRadius: 6, fontSize: 12, cursor: "pointer" };
            
