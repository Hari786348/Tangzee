"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../../lib/supabaseBrowser";

const PLUM = "#2F243A";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin() {
    setError("");
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/admin");
  }

  return (
    <main style={{ minHeight: "100vh", background: PLUM, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 320 }}>
        <h1 style={{ letterSpacing: 2 }}>TANGZEE ADMIN</h1>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
        <button onClick={handleLogin} style={buttonStyle}>LOG IN</button>
        {error && <p style={{ color: "#FFB4B4" }}>{error}</p>}
      </div>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  padding: 12,
  marginTop: 12,
  borderRadius: 6,
  border: "1px solid #FFFFFF66",
  background: "transparent",
  color: "#FFFFFF",
  boxSizing: "border-box",
};

const buttonStyle = {
  width: "100%",
  padding: 12,
  marginTop: 16,
  borderRadius: 6,
  border: "none",
  background: "#FFFFFF",
  color: PLUM,
  fontWeight: 600,
};
