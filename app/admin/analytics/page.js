"use client";
import { useEffect, useState } from "react";

const PLUM = "#2F243A";

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch("/api/analytics").then((r) => r.json()).then(setStats);
  }, []);

  if (!stats) return <main style={{ padding: 24 }}>Loading…</main>;

  const tiles = [
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
          {tiles.map(([label, value]) => (
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
