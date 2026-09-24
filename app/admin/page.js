"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const PLUM = "#2F243A";

const ownerTiles = [
  { href: "/admin/counter", label: "COUNTER MODE", desc: "Search customer, take orders, redeem claims" },
  { href: "/admin/desserts", label: "ADD / EDIT DESSERTS", desc: "Manage your menu" },
  { href: "/admin/content", label: "WEBSITE PHOTOS & TEXT", desc: "Change the homepage hero photo and wording" },
  { href: "/admin/campaigns", label: "CAMPAIGNS & QR", desc: "Create posters, generate QR codes" },
  { href: "/admin/analytics", label: "ANALYTICS", desc: "See how the shop is doing" },
  { href: "/admin/audit-logs", label: "ACTIVITY LOG", desc: "See recent staff actions" },
];

const staffTiles = [
  { href: "/admin/counter", label: "COUNTER MODE", desc: "Search customer, take orders, redeem claims" },
  { href: "/admin/desserts", label: "DESSERTS", desc: "Mark items in stock / out of stock" },
];

export default function AdminHome() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d) => setRole(d.role || "staff"))
      .finally(() => setLoading(false));
  }, []);

  const tiles = role === "owner" ? ownerTiles : staffTiles;

  return (
    <main style={{ minHeight: "100vh", background: "#FAFAFA", padding: "24px 16px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ color: PLUM, letterSpacing: 1, fontSize: 22, marginBottom: 20 }}>
          {role === "owner" ? "TANGZEE OWNER HOME" : "TANGZEE STAFF HOME"}
        </h1>
        {loading ? (
          <p style={{ color: "#666" }}>Loading…</p>
        ) : (
          tiles.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              style={{
                display: "block",
                background: "#fff",
                border: "1px solid #00000015",
                borderRadius: 12,
                padding: 20,
                marginBottom: 14,
                textDecoration: "none",
              }}
            >
              <p style={{ margin: 0, color: PLUM, fontWeight: 700, fontSize: 16, letterSpacing: 0.5 }}>{t.label}</p>
              <p style={{ margin: "6px 0 0", color: "#666", fontSize: 13 }}>{t.desc}</p>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
