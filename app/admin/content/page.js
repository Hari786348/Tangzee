"use client";
import { useEffect, useState } from "react";

const PLUM = "#2F243A";

export default function AdminContent() {
  const [settings, setSettings] = useState(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState("");

  async function load() {
    const res = await fetch("/api/settings");
    const data = await res.json();
    if (res.ok) {
      setSettings(data.settings);
      setTitle(data.settings.hero_title || "");
      setSubtitle(data.settings.hero_subtitle || "");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function uploadImage(field, file) {
    setUploading(field);
    setMsg("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("field", field);
    const res = await fetch("/api/settings/upload-image", { method: "POST", body: formData });
    const data = await res.json();
    setUploading("");
    if (!res.ok) {
      setMsg(data.error);
      return;
    }
    setSettings(data.settings);
    setMsg("Photo updated — check your homepage.");
  }

  async function saveText() {
    setMsg("");
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hero_title: title, hero_subtitle: subtitle }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error);
      return;
    }
    setMsg("Text updated — check your homepage.");
  }

  return (
    <main style={{ minHeight: "100vh", background: "#FAFAFA", padding: "24px 16px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ color: PLUM, letterSpacing: 1 }}>WEBSITE PHOTOS & TEXT</h1>

        <section style={cardStyle}>
          <h3 style={h3Style}>Hero photo (big photo at the top)</h3>
          {settings?.hero_image_url && (
            <img src={settings.hero_image_url} alt="Current hero" style={{ width: "100%", borderRadius: 8, marginBottom: 12 }} />
          )}
          <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && uploadImage("hero_image_url", e.target.files[0])} />
          {uploading === "hero_image_url" && <p style={{ fontSize: 13, color: "#666" }}>Uploading…</p>}
        </section>

        <section style={cardStyle}>
          <h3 style={h3Style}>Hero text</h3>
          <input placeholder="Main headline" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
          <input placeholder="Subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} style={inputStyle} />
          <button onClick={saveText} style={buttonStyle}>SAVE TEXT</button>
        </section>

        <section style={cardStyle}>
          <h3 style={h3Style}>Featured dessert photo</h3>
          {settings?.featured_image_url && (
            <img src={settings.featured_image_url} alt="Current featured" style={{ width: "100%", borderRadius: 8, marginBottom: 12 }} />
          )}
          <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && uploadImage("featured_image_url", e.target.files[0])} />
          {uploading === "featured_image_url" && <p style={{ fontSize: 13, color: "#666" }}>Uploading…</p>}
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
