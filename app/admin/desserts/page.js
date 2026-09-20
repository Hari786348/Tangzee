"use client";
import { useEffect, useState } from "react";

const PLUM = "#2F243A";

export default function AdminDesserts() {
  const [desserts, setDesserts] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", price: "", category: "", featured: false });
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/desserts");
    const data = await res.json();
    setDesserts(data.desserts || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function uploadPhoto(file) {
    setUploading(true);
    setErr("");
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/desserts/upload-image", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setErr(data.error);
      return;
    }
    setImageUrl(data.url);
  }

  async function createDessert() {
    setErr("");
    const res = await fetch("/api/desserts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: parseFloat(form.price), image_url: imageUrl || null }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error);
      return;
    }
    setForm({ name: "", description: "", price: "", category: "", featured: false });
    setImageUrl("");
    load();
  }

  async function toggleAvailable(d) {
    await fetch(`/api/desserts/${d.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: !d.available }),
    });
    load();
  }

  async function toggleFeatured(d) {
    await fetch(`/api/desserts/${d.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !d.featured }),
    });
    load();
  }

  return (
    <main style={{ minHeight: "100vh", background: "#FFFFFF", padding: "24px 16px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <h1 style={{ color: PLUM, letterSpacing: 1 }}>DESSERT MANAGEMENT</h1>

        <section style={{ border: "1px solid #00000015", borderRadius: 10, padding: 16, marginBottom: 24 }}>
          <h3 style={{ marginTop: 0 }}>Add dessert</h3>

          {imageUrl && (
            <img src={imageUrl} alt="Dessert preview" style={{ width: "100%", borderRadius: 8, marginBottom: 12 }} />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files[0] && uploadPhoto(e.target.files[0])}
          />
          {uploading && <p style={{ fontSize: 13, color: "#666" }}>Uploading photo…</p>}

          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={inputStyle} />
          <input placeholder="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={inputStyle} />
          <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle} />
          <label style={{ display: "block", marginTop: 8, fontSize: 14 }}>
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured
          </label>
          <button onClick={createDessert} style={buttonStyle}>ADD DESSERT</button>
          {err && <p style={{ color: "crimson" }}>{err}</p>}
        </section>

        {loading ? (
          <p>Loading…</p>
        ) : (
          desserts.map((d) => (
            <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #00000010" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {d.image_url && (
                  <img src={d.image_url} alt={d.name} style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }} />
                )}
                <div>
                  <strong>{d.name}</strong> — ₹{d.price}
                  <div style={{ fontSize: 12, color: "#666" }}>{d.category} {d.featured ? "· ★ featured" : ""} · {d.available ? "available" : "archived"}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => toggleFeatured(d)} style={smallButtonStyle}>{d.featured ? "Unfeature" : "Feature"}</button>
                <button onClick={() => toggleAvailable(d)} style={smallButtonStyle}>{d.available ? "Archive" : "Restore"}</button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

const inputStyle = { width: "100%", padding: 10, marginTop: 8, borderRadius: 6, border: "1px solid #00000030", boxSizing: "border-box" };
const buttonStyle = { marginTop: 12, padding: 10, width: "100%", background: PLUM, color: "#fff", border: "none", borderRadius: 6, fontWeight: 600 };
const smallButtonStyle = { padding: "6px 10px", border: "1px solid #00000030", background: "#fff", borderRadius: 6, fontSize: 12 };
