"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

const PLUM = "#2F243A";

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [desserts, setDesserts] = useState([]);
  const [form, setForm] = useState({ campaign_code: "", title: "", featured_dessert_id: "", start_date: "", end_date: "", reward_description: "2 FOR THE PRICE OF 1" });
  const [err, setErr] = useState("");
  const [qrUrls, setQrUrls] = useState({}); // campaignId -> data URL
  const [siteUrl, setSiteUrl] = useState("");

  useEffect(() => {
    setSiteUrl(window.location.origin);
    load();
    fetch("/api/desserts").then((r) => r.json()).then((d) => setDesserts(d.desserts || []));
  }, []);

  async function load() {
    const res = await fetch("/api/campaigns");
    const data = await res.json();
    setCampaigns(data.campaigns || []);
  }

  async function createCampaign() {
    setErr("");
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error);
      return;
    }
    setForm({ campaign_code: "", title: "", featured_dessert_id: "", start_date: "", end_date: "", reward_description: "2 FOR THE PRICE OF 1" });
    load();
  }

  async function setStatus(id, status) {
    await fetch(`/api/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function generateQr(campaign) {
    const url = `${siteUrl}/campaign/${campaign.campaign_code}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 400, margin: 2, color: { dark: PLUM, light: "#FFFFFF" } });
    setQrUrls((prev) => ({ ...prev, [campaign.id]: dataUrl }));
  }

  function copyUrl(code) {
    navigator.clipboard.writeText(`${siteUrl}/campaign/${code}`);
  }

  return (
    <main style={{ minHeight: "100vh", background: "#FFFFFF", padding: "24px 16px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <h1 style={{ color: PLUM, letterSpacing: 1 }}>CAMPAIGNS</h1>

        <section style={cardStyle}>
          <h3 style={h3Style}>Create campaign</h3>
          <input placeholder="Campaign code e.g. TZ001" value={form.campaign_code} onChange={(e) => setForm({ ...form, campaign_code: e.target.value.toUpperCase() })} style={inputStyle} />
          <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
          <select value={form.featured_dessert_id} onChange={(e) => setForm({ ...form, featured_dessert_id: e.target.value })} style={inputStyle}>
            <option value="">Featured dessert…</option>
            {desserts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <input placeholder="Reward description" value={form.reward_description} onChange={(e) => setForm({ ...form, reward_description: e.target.value })} style={inputStyle} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} style={{ ...inputStyle, marginTop: 0 }} />
            <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} style={{ ...inputStyle, marginTop: 0 }} />
          </div>
          <button onClick={createCampaign} style={buttonStyle}>CREATE (DRAFT)</button>
          {err && <p style={{ color: "crimson" }}>{err === "CAMPAIGN_CODE_TAKEN" ? "That campaign code is already used." : err}</p>}
        </section>

        {campaigns.map((c) => (
          <section key={c.id} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <strong>{c.campaign_code}</strong> — {c.title}
                <div style={{ fontSize: 12, color: "#666" }}>
                  {c.status} · {c.desserts?.name || "no dessert set"} · claims {c.claims_count} · redemptions {c.redemptions_count}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
              {c.status !== "ACTIVE" && <button onClick={() => setStatus(c.id, "ACTIVE")} style={smallButtonStyle}>Activate</button>}
              {c.status === "ACTIVE" && <button onClick={() => setStatus(c.id, "PAUSED")} style={smallButtonStyle}>Pause</button>}
              {c.status !== "ARCHIVED" && <button onClick={() => setStatus(c.id, "ARCHIVED")} style={smallButtonStyle}>Archive</button>}
              <button onClick={() => copyUrl(c.campaign_code)} style={smallButtonStyle}>Copy URL</button>
              <button onClick={() => generateQr(c)} style={smallButtonStyle}>Generate QR</button>
            </div>

            {qrUrls[c.id] && (
              <div style={{ marginTop: 12, textAlign: "center" }}>
                <img src={qrUrls[c.id]} alt={`QR for ${c.campaign_code}`} style={{ width: 160, height: 160 }} />
                <br />
                <a href={qrUrls[c.id]} download={`${c.campaign_code}-qr.png`} style={{ color: PLUM, fontSize: 13 }}>
                  Download QR
                </a>
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}

const cardStyle = { border: "1px solid #00000015", borderRadius: 10, padding: 16, marginTop: 16 };
const h3Style = { marginTop: 0, fontSize: 14, letterSpacing: 1, textTransform: "uppercase", color: "#666" };
const inputStyle = { width: "100%", padding: 10, marginTop: 8, borderRadius: 6, border: "1px solid #00000030", boxSizing: "border-box" };
const buttonStyle = { marginTop: 12, padding: 10, width: "100%", background: PLUM, color: "#fff", border: "none", borderRadius: 6, fontWeight: 600 };
const smallButtonStyle = { padding: "6px 10px", border: "1px solid #00000030", background: "#fff", borderRadius: 6, fontSize: 12, cursor: "pointer" };
