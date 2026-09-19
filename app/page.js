import Link from "next/link";
import { supabaseAdmin } from "../lib/supabaseServer";

const PLUM = "#2F243A";
const DARK_PLUM = "#3A2E3B";

export const revalidate = 0;

export default async function HomePage() {
  const db = supabaseAdmin();
  const { data: featured } = await db.from("desserts").select("*").eq("featured", true).eq("available", true).limit(3);
  const { data: settings } = await db.from("shop_settings").select("*").eq("id", 1).single();

  return (
    <main style={{ background: "#FFFFFF", color: "#000" }}>
      {/* HERO */}
      <section style={{ background: PLUM, color: "#fff", padding: "48px 20px", textAlign: "center" }}>
        <img src="/brand/tangzee-logo.png" alt="Tangzee" style={{ width: 120, height: 120, borderRadius: "50%", margin: "0 auto" }} />
        <p style={{ marginTop: 20, letterSpacing: 2, opacity: 0.85, fontSize: 13 }}>PREMIUM DESSERTS</p>
        <p style={{ maxWidth: 320, margin: "12px auto 0", opacity: 0.9, fontSize: 15 }}>
          Every Tangzee dessert is made to be noticed — and the difference is always worth finding.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
          <Link href="/desserts" style={primaryBtn}>EXPLORE TANGZEE</Link>
          <Link href="/only-1-difference" style={secondaryBtn}>ONLY 1 DIFFERENCE</Link>
        </div>
      </section>

      {/* FEATURED DESSERTS */}
      {featured && featured.length > 0 && (
        <section style={{ padding: "40px 20px", maxWidth: 640, margin: "0 auto" }}>
          <h2 style={sectionHeading}>FEATURED</h2>
          <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
            {featured.map((d) => (
              <div key={d.id} style={{ border: "1px solid #00000012", borderRadius: 10, padding: 16 }}>
                <p style={{ margin: 0, fontWeight: 600 }}>{d.name}</p>
                {d.description && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#666" }}>{d.description}</p>}
                <p style={{ margin: "8px 0 0", color: PLUM, fontWeight: 700 }}>₹{d.price}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CAMPAIGN CALLOUT */}
      <section style={{ background: DARK_PLUM, color: "#fff", padding: "40px 20px", textAlign: "center" }}>
        <h2 style={{ ...sectionHeading, color: "#fff" }}>ONLY 1 DIFFERENCE</h2>
        <p style={{ maxWidth: 320, margin: "8px auto 0", opacity: 0.85, fontSize: 14 }}>
          Find it on the poster. Circle it. Scan the code. Claim your Tangzee.
        </p>
      </section>

      {/* 7-ORDER JOURNEY CALLOUT */}
      <section style={{ padding: "40px 20px", maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
        <h2 style={sectionHeading}>YOUR JOURNEY</h2>
        <p style={{ fontSize: 14, color: "#444", marginTop: 8 }}>
          7 orders. Then, a little deliciousness for your mind.
        </p>
        <Link href="/my-journey" style={{ ...primaryBtn, background: PLUM, color: "#fff", display: "inline-block", marginTop: 16 }}>
          MY JOURNEY
        </Link>
      </section>

      {/* SHOP INFO */}
      <footer style={{ background: "#000", color: "#fff", padding: "32px 20px", textAlign: "center", fontSize: 13 }}>
        <img src="/brand/tangzee-logo.png" alt="Tangzee" style={{ width: 48, height: 48, borderRadius: "50%", marginBottom: 12 }} />
        <p style={{ margin: "4px 0" }}>{settings?.shop_name || "Tangzee"}</p>
        {settings?.address && <p style={{ margin: "4px 0", opacity: 0.7 }}>{settings.address}</p>}
        {settings?.opening_hours && <p style={{ margin: "4px 0", opacity: 0.7 }}>{settings.opening_hours}</p>}
        {settings?.instagram && <p style={{ margin: "4px 0", opacity: 0.7 }}>{settings.instagram}</p>}
      </footer>
    </main>
  );
}

const sectionHeading = { fontSize: 15, letterSpacing: 2, color: PLUM, textAlign: "center" };
const primaryBtn = { padding: "12px 20px", background: "#fff", color: PLUM, borderRadius: 6, fontWeight: 600, letterSpacing: 1, fontSize: 13, textDecoration: "none" };
const secondaryBtn = { padding: "12px 20px", background: "transparent", color: "#fff", border: "1px solid #FFFFFF66", borderRadius: 6, fontWeight: 600, letterSpacing: 1, fontSize: 13, textDecoration: "none" };
