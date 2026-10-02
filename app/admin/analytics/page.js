"use client";
import { useEffect, useState } from "react";

const PLUM = "#2F243A";

function currentMonthStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(monthStr, delta) {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(monthStr) {
  const [y, m] = monthStr.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default function AdminAnalytics() {
  const [month, setMonth] = useState(currentMonthStr());
  const [stats, setStats] = useState(null);
  const [todayCost, setTodayCost] = useState("");
  const [salaryInput, setSalaryInput] = useState("");
  const [elecInput, setElecInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  function load(m) {
    fetch(`/api/analytics?month=${m}`).then((r) => r.json()).then((d) => {
      setStats(d);
      setSalaryInput(d.month?.staffSalary || "");
      setElecInput(d.month?.electricityBill || "");
    });
  }

  useEffect(() => { load(month); }, [month]);

  async function logRawMaterial() {
    if (!todayCost) return;
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: new Date().toISOString().slice(0, 10), amount: todayCost }),
    });
    setSaving(false);
    if (res.ok) { setTodayCost(""); setMsg("Raw material cost added."); load(month); }
    else setMsg("Couldn't save — try again.");
  }

  async function saveMonthlyCosts() {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/expenses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, staffSalary: salaryInput, electricityBill: elecInput }),
    });
    setSaving(false);
    if (res.ok) { setMsg("Monthly costs saved."); load(month); }
    else setMsg("Couldn't save — try again.");
  }

  if (!stats) return <main style={{ padding: 24 }}>Loading…</main>;

  const isCurrentMonth = month === stats.currentMonth;
  const m = stats.month;

  const liveTiles = [
    ["Total customers", stats.totalCustomers],
    ["Today's orders", stats.todaysOrders],
    ["This week's orders", stats.weekOrders],
    ["This month's orders", stats.monthOrders],
    ["Active campaigns", stats.activeCampaigns],
    ["Campaign claims", stats.campaignClaims],
    ["Campaign redemptions", stats.campaignRedemptions],
    ["Claim → redemption rate", `${stats.claimToRedemptionRate}%`],
    ["Mini desserts given", stats.miniDessertsGiven],
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#FAFAFA", padding: "24px 16px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <h1 style={{ color: PLUM, letterSpacing: 1 }}>ANALYTICS</h1>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, background: "#fff", border: "1px solid #00000012", borderRadius: 10, padding: 12 }}>
          <button onClick={() => setMonth(shiftMonth(month, -1))} style={navBtnStyle}>←</button>
          <strong style={{ color: PLUM }}>{monthLabel(month)}{isCurrentMonth ? " (current)" : ""}</strong>
          <button onClick={() => setMonth(shiftMonth(month, 1))} disabled={isCurrentMonth} style={{ ...navBtnStyle, opacity: isCurrentMonth ? 0.3 : 1 }}>→</button>
        </div>

        <section style={cardStyle}>
          <h3 style={cardHeading}>Profit — {monthLabel(month)}</h3>
          <div style={rowStyle}>
            <span>Revenue</span>
            <span>
              ₹{m.revenue}
              {isCurrentMonth && stats.revenueChangePct !== null && (
                <span style={{ fontSize: 11, marginLeft: 6, color: stats.revenueChangePct >= 0 ? "#1a7a3c" : "crimson" }}>
                  ({stats.revenueChangePct >= 0 ? "+" : ""}{stats.revenueChangePct}% vs last month)
                </span>
              )}
            </span>
          </div>
          <div style={rowStyle}><span>Orders</span><span>{m.ordersCount}</span></div>
          <div style={rowStyle}><span>Avg order value</span><span>₹{m.avgOrderValue}</span></div>
          <div style={rowStyle}><span>− Raw material cost</span><span>₹{m.rawMaterialTotal}</span></div>
          <div style={rowStyle}><span>− Staff salary</span><span>₹{m.staffSalary}</span></div>
          <div style={rowStyle}><span>− Electricity bill</span><span>₹{m.electricityBill}</span></div>
          <div style={{ ...rowStyle, borderTop: "1px solid #00000015", marginTop: 8, paddingTop: 10, fontWeight: 700 }}>
            <span>Final profit</span>
            <span style={{ color: m.finalProfit >= 0 ? "#1a7a3c" : "crimson" }}>₹{m.finalProfit}</span>
          </div>
        </section>

        {m.topDesserts?.length > 0 && (
          <section style={cardStyle}>
            <h3 style={cardHeading}>Top sellers — {monthLabel(month)}</h3>
            {m.topDesserts.map((d, i) => (
              <div key={d.name} style={rowStyle}>
                <span>{i + 1}. {d.name} × {d.quantity}</span>
                <span>₹{d.revenue}</span>
              </div>
            ))}
          </section>
        )}

        {m.categoryBreakdown?.length > 0 && (
          <section style={cardStyle}>
            <h3 style={cardHeading}>Revenue by category — {monthLabel(month)}</h3>
            {m.categoryBreakdown.map((c) => (
              <div key={c.category} style={rowStyle}>
                <span style={{ textTransform: "capitalize" }}>{c.category}</span>
                <span>₹{c.revenue}</span>
              </div>
            ))}
          </section>
        )}

        {isCurrentMonth && (
          <>
            <section style={cardStyle}>
              <h3 style={cardHeading}>Add today's raw material cost</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="number" placeholder="Amount (₹)" value={todayCost} onChange={(e) => setTodayCost(e.target.value)} style={inputStyle} />
                <button onClick={logRawMaterial} disabled={saving || !todayCost} style={btnStyle}>ADD</button>
              </div>
            </section>

            <section style={cardStyle}>
              <h3 style={cardHeading}>This month's staff salary &amp; electricity bill</h3>
              <input type="number" placeholder="Staff salary (₹)" value={salaryInput} onChange={(e) => setSalaryInput(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
              <input type="number" placeholder="Electricity bill (₹)" value={elecInput} onChange={(e) => setElecInput(e.target.value)} style={{ ...inputStyle, width: "100%", marginTop: 8 }} />
              <button onClick={saveMonthlyCosts} disabled={saving} style={{ ...btnStyle, width: "100%", marginTop: 10 }}>SAVE</button>
              {msg && <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>{msg}</p>}
            </section>
          </>
        )}

        <section style={{ ...cardStyle, background: PLUM, color: "#fff" }}>
          <h3 style={{ ...cardHeading, color: "#D8B36A" }}>All-time totals</h3>
          <div style={{ ...rowStyle, color: "#fff" }}><span>Revenue (ever)</span><span>₹{stats.allTime.revenue}</span></div>
          <div style={{ ...rowStyle, color: "#fff" }}><span>Orders (ever)</span><span>{stats.allTime.orders}</span></div>
          <div style={{ ...rowStyle, color: "#fff" }}><span>− Raw material cost</span><span>₹{stats.allTime.rawMaterialTotal}</span></div>
          <div style={{ ...rowStyle, color: "#fff" }}><span>− Staff salary</span><span>₹{stats.allTime.staffSalary}</span></div>
          <div style={{ ...rowStyle, color: "#fff" }}><span>− Electricity bill</span><span>₹{stats.allTime.electricityBill}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #FFFFFF33", marginTop: 8, paddingTop: 10, fontWeight: 700 }}>
            <span>Total profit</span>
            <span style={{ color: stats.allTime.profit >= 0 ? "#8fe3a8" : "#ff9b9b" }}>₹{stats.allTime.profit}</span>
          </div>
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
          {liveTiles.map(([label, value]) => (
            <div key={label} style={tileStyle}>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: PLUM }}>{value}</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>{label}</p>
            </div>
          ))}
        </div>

        <section style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 14, letterSpacing: 1, textTransform: "uppercase", color: "#666" }}>
            Customers currently at each milestone
          </h3>
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0" }}>
              <span style={{ width: 36, fontSize: 13 }}>{n}/7</span>
              <div style={{ flex: 1, background: "#00000010", borderRadius: 4, height: 10 }}>
                <div
                  style={{
                    width: `${Math.min(100, (stats.milestoneBuckets[n] || 0) * 10)}%`,
                    background: PLUM,
                    height: 10,
                    borderRadius: 4,
                  }}
                />
              </div>
              <span style={{ width: 24, fontSize: 13, textAlign: "right" }}>{stats.milestoneBuckets[n] || 0}</span>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

const tileStyle = { background: "#fff", border: "1px solid #00000012", borderRadius: 10, padding: 16 };
const cardStyle = { background: "#fff", border: "1px solid #00000012", borderRadius: 10, padding: 16, marginTop: 16 };
const cardHeading = { margin: "0 0 10px", fontSize: 13, letterSpacing: 0.5, color: PLUM };
const rowStyle = { display: "flex", justifyContent: "space-between", fontSize: 14, padding: "4px 0" };
const inputStyle = { flex: 1, padding: 10, borderRadius: 6, border: "1px solid #00000030", fontSize: 14 };
const btnStyle = { padding: "10px 16px", borderRadius: 6, border: "none", background: PLUM, color: "#fff", fontSize: 13, fontWeight: 600 };
const navBtnStyle = { padding: "8px 16px", borderRadius: 6, border: "1px solid #00000020", background: "#fff", color: PLUM, fontWeight: 700, fontSize: 16 };
