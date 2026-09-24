"use client";
import { useEffect, useState } from "react";

const PLUM = "#2F243A";

export default function AuditLogs() {
  const [logs, setLogs] = useState(null);

  useEffect(() => {
    fetch("/api/audit-logs").then((r) => r.json()).then((d) => setLogs(d.logs || []));
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "#FAFAFA", padding: "24px 16px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <h1 style={{ color: PLUM, letterSpacing: 1 }}>AUDIT LOG</h1>
        {!logs && <p>Loading…</p>}
        {logs?.length === 0 && <p style={{ color: "#666" }}>No actions recorded yet.</p>}
        {logs?.map((l) => (
          <div key={l.id} style={{ borderBottom: "1px solid #00000012", padding: "10px 0", fontSize: 13 }}>
            <strong>{l.action}</strong>
            <div style={{ color: "#666", marginTop: 2 }}>
              {l.admin_users?.full_name || "Staff"} · {new Date(l.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
