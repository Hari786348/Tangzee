"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const PLUM = "#2F243A";

const ERRORS = {
  INVALID_EMAIL: "That email doesn't look right.",
  PASSWORD_TOO_SHORT: "Password must be at least 6 characters.",
  EMAIL_ALREADY_USED: "That email is already used by another login.",
  OWNER_ONLY: "Only the owner can manage staff.",
  NOT_AUTHENTICATED: "Please log in again.",
  NOT_AUTHORIZED: "Please log in again.",
};

export default function StaffAccounts() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/staff");
    if (!res.ok) {
      setBlocked(true);
      setLoading(false);
      return;
    }
    const d = await res.json();
    setStaff(d.staff || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addStaff() {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: newName, email: newEmail, password: newPassword }),
    });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMsg(ERRORS[d.error] || "Couldn't add staff. Try again.");
      return;
    }
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setMsg("Staff added. They can log in now.");
    load();
  }

  function startEdit(s) {
    setEditingId(s.id);
    setEditName(s.fullName || "");
    setEditEmail(s.email);
    setEditPassword("");
    setMsg("");
  }

  async function saveEdit(s) {
    setSaving(true);
    setMsg("");
    const body = { id: s.id, fullName: editName };
    if (editEmail.trim() && editEmail.trim() !== s.email) body.email = editEmail;
    if (editPassword) body.password = editPassword;
    const res = await fetch("/api/staff", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMsg(ERRORS[d.error] || "Couldn't save. Try again.");
      return;
    }
    setEditingId(null);
    setMsg("Saved.");
    load();
  }

  async function setActive(s, active) {
    setMsg("");
    const res = await fetch("/api/staff", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id, active }),
    });
    if (!res.ok) {
      setMsg("Couldn't update. Try again.");
      return;
    }
    setMsg(active ? "Staff reactivated." : "Staff deactivated — they can no longer use the admin.");
    load();
  }

  if (loading) return <main style={mainStyle}><p>Loading…</p></main>;

  if (blocked) {
    return (
      <main style={mainStyle}>
        <div style={wrapStyle}>
          <p>Only the owner can open this page.</p>
          <Link href="/admin" style={{ color: PLUM }}>← Back</Link>
        </div>
      </main>
    );
  }

  return (
    <main style={mainStyle}>
      <div style={wrapStyle}>
        <Link href="/admin" style={{ color: PLUM, fontSize: 13, textDecoration: "none" }}>← Back</Link>
        <h1 style={{ color: PLUM, letterSpacing: 1, fontSize: 22, margin: "8px 0 16px" }}>STAFF ACCOUNTS</h1>

        <section style={cardStyle}>
          <h3 style={headingStyle}>Add staff</h3>
          <input placeholder="Name (optional)" value={newName} onChange={(e) => setNewName(e.target.value)} style={inputStyle} />
          <input type="email" placeholder="Staff email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} style={inputStyle} />
          <input type="text" placeholder="Password (min 6 characters)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} />
          <button onClick={addStaff} disabled={saving || !newEmail || !newPassword} style={buttonStyle}>
            {saving ? "SAVING…" : "ADD STAFF"}
          </button>
        </section>

        {msg && <p style={{ fontSize: 13, color: "#555", margin: "0 0 12px" }}>{msg}</p>}

        {staff.length === 0 && <p style={{ color: "#777", fontSize: 14 }}>No staff yet. Add one above.</p>}

        {staff.map((s) => (
          <section key={s.id} style={{ ...cardStyle, opacity: s.active ? 1 : 0.65 }}>
            {editingId === s.id ? (
              <>
                <input placeholder="Name" value={editName} onChange={(e) => setEditName(e.target.value)} style={inputStyle} />
                <input type="email" placeholder="Email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={inputStyle} />
                <input type="text" placeholder="New password (leave blank to keep)" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} style={inputStyle} />
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button onClick={() => saveEdit(s)} disabled={saving} style={{ ...buttonStyle, marginTop: 0 }}>SAVE</button>
                  <button onClick={() => setEditingId(null)} style={{ ...buttonStyle, marginTop: 0, background: "#fff", color: PLUM, border: "1px solid #00000030" }}>CANCEL</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, color: PLUM }}>{s.fullName || "Staff"}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "#555", wordBreak: "break-all" }}>{s.email}</p>
                  </div>
                  <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 10, background: s.active ? "#D8B36A" : "#00000012", color: s.active ? PLUM : "#777", fontWeight: 700, flexShrink: 0 }}>
                    {s.active ? "ACTIVE" : "OFF"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button onClick={() => startEdit(s)} style={smallButtonStyle}>Change email / password</button>
                  <button onClick={() => setActive(s, !s.active)} style={smallButtonStyle}>
                    {s.active ? "Deactivate" : "Reactivate"}
                  </button>
                </div>
              </>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}

const mainStyle = { minHeight: "100vh", background: "#FAFAFA", padding: "24px 16px" };
const wrapStyle = { maxWidth: 480, margin: "0 auto" };
const cardStyle = { background: "#fff", border: "1px solid #00000015", borderRadius: 12, padding: 16, marginBottom: 14 };
const headingStyle = { margin: "0 0 10px", fontSize: 13, letterSpacing: 0.5, color: PLUM };
const inputStyle = { width: "100%", padding: 12, borderRadius: 6, border: "1px solid #00000030", fontSize: 14, marginTop: 8, boxSizing: "border-box" };
const buttonStyle = { width: "100%", marginTop: 12, padding: 12, borderRadius: 6, border: "none", background: PLUM, color: "#fff", fontWeight: 600, fontSize: 13, letterSpacing: 0.5 };
const smallButtonStyle = { flex: 1, padding: "9px 10px", borderRadius: 6, border: "1px solid #00000030", background: "#fff", color: PLUM, fontSize: 12, fontWeight: 600 };
