import Link from "next/link";
import { supabaseAdmin } from "../lib/supabaseServer";
import { TANGZEE_CONTENT } from "../lib/content";

const DEEP_PLUM = "#2F243A";
const DARKER_PLUM = "#1D1424";
const WARM_PLUM = "#3A2C42";
const CREAM = "#F7F0E5";
const IVORY = "#FFF9F0";
const GOLD = "#D8B36A";
const LIGHT_GOLD = "#E8CC91";

export const revalidate = 0;

export default async function HomePage() {
  const db = supabaseAdmin();
  const { data: featured } = await db.from("desserts").select("*").eq("featured", true).eq("available", true).limit(3);
  const { data: settings } = await db.from("shop_settings").select("*").eq("id", 1).single();
  const { hero, featuredDessert } = TANGZEE_CONTENT;
  const heroImage = settings?.hero_image_url || hero.image;
  const heroTitle = settings?.hero_title || hero.title;
  const heroSubtitle = settings?.hero_subtitle || hero.subtitle;
  const featuredImage = settings?.featured_image_url || featuredDessert.image;

  return (
    <main style={{ background: IVORY }}>
      <header style={{ background: DARKER_PLUM, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <img src="/brand/tangzee-logo.png" alt="Tangzee" style={{ width: 40, height: 40, borderRadius: "50%" }} />
        <nav style={{ display: "flex", gap: 18 }}>
          {[["Desserts", "/desserts"], ["Only 1 Difference", "/only-1-difference"], ["My Journey", "/my-journey"]].map(([label, href]) => (
            <Link key={href} href={href} className="tangzee-gold-underline" style={{ color: CREAM, fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <section className="fade-up" style={{ position: "relative", minHeight: "78vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", overflow: "hidden", backgroundColor: DEEP_PLUM, backgroundImage: `linear-gradient(180deg, rgba(29,20,36,0.55), rgba(29,20,36,0.85)), url(${heroImage})`, backgroundSize: "cover", backgroundPosition: "center" }}>
        <div style={{ padding: "0 24px", maxWidth: 480 }}>
          <p style={{ color: GOLD, letterSpacing: 4, fontSize: 12, fontFamily: "var(--font-sans)", marginBottom: 18 }}>{hero.eyebrow}</p>
          <h1 style={{ color: IVORY, fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: 40, lineHeight: 1.15, margin: 0 }}>{heroTitle}</h1>
          <p style={{ color: CREAM, fontSize: 15, marginTop: 20, fontStyle: "italic", opacity: 0.9 }}>{heroSubtitle}</p>
          <Link href="/desserts" style={{ display: "inline-block", marginTop: 32, padding: "14px 28px", border: `1px solid ${GOLD}`, color: GOLD, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", textDecoration: "none" }}>
            Explore our desserts &rarr;
          </Link>
        </div>
      </section>

      <section className="fade-up" style={{ padding: "64px 20px", maxWidth: 720, margin: "0 auto" }}>
        <p style={{ textAlign: "center", color: GOLD, letterSpacing: 3, fontSize: 11, marginBottom: 8 }}>THE COLLECTION</p>
        <h2 style={{ textAlign: "center", fontFamily: "var(--font-serif)", color: DEEP_PLUM, fontWeight: 500, fontSize: 28, margin: "0 0 40px" }}>Every dessert, made to be noticed</h2>
        {featured && featured.length > 0 ? (
          <div style={{ display: "grid", gap: 20 }}>
            {featured.map((d) => (
              <div key={d.id} className="tangzee-card" style={{ border: `1px solid ${GOLD}33`, borderRadius: 4, padding: 24, background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 18, color: DEEP_PLUM }}>{d.name}</p>
                  {d.description && <p style={{ margin: "6px 0 0", fontSize: 13, color: "#6b5f6e" }}>{d.description}</p>}
                </div>
                <span style={{ color: GOLD, fontFamily: "var(--font-serif)", fontSize: 18 }}>&rarr;</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: "center", color: "#8a7d8c" }}>New desserts coming soon.</p>
        )}
      </section>

      <section className="fade-up" style={{ background: WARM_PLUM, display: "flex", flexDirection: "column" }}>
        <div className="tangzee-zoom-wrap" style={{ height: 320 }}>
          <img src={featuredImage} alt="Featured dessert" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
        <div style={{ padding: "40px 24px", color: IVORY, textAlign: "center" }}>
          <p style={{ color: GOLD, letterSpacing: 3, fontSize: 11, marginBottom: 10 }}>{featuredDessert.label}</p>
          {featured && featured[0] ? (
            <>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 24, margin: 0, fontWeight: 500 }}>{featured[0].name}</h3>
              {featured[0].description && <p style={{ fontSize: 14, opacity: 0.85, marginTop: 10, maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>{featured[0].description}</p>}
              <p style={{ fontFamily: "var(--font-serif)", fontSize: 20, color: LIGHT_GOLD, marginTop: 14 }}>&#8377;{featured[0].price}</p>
            </>
          ) : (
            <p style={{ opacity: 0.7, fontSize: 14 }}>Set a featured dessert from the owner dashboard.</p>
          )}
        </div>
      </section>

      <section className="fade-up" style={{ background: DEEP_PLUM, color: IVORY, padding: "56px 24px", textAlign: "center" }}>
        <p style={{ color: GOLD, letterSpacing: 3, fontSize: 11, marginBottom: 10 }}>THE CAMPAIGN</p>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 26, fontWeight: 500, margin: 0 }}>Only 1 Difference</h2>
        <p style={{ fontSize: 14, opacity: 0.85, maxWidth: 320, margin: "14px auto 0" }}>Find it on the poster. Circle it. Scan the code. Claim your Tangzee.</p>
        <Link href="/only-1-difference" style={{ display: "inline-block", marginTop: 24, padding: "12px 24px", border: `1px solid ${GOLD}`, color: GOLD, fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", textDecoration: "none" }}>
          See the campaign
        </Link>
      </section>

      <section className="fade-up" style={{ background: CREAM, padding: "56px 24px", textAlign: "center" }}>
        <p style={{ color: GOLD, letterSpacing: 3, fontSize: 11, marginBottom: 10 }}>LOYALTY, REIMAGINED</p>
        <h2 style={{ fontFamily: "var(--font-serif)", color: DEEP_PLUM, fontSize: 24, fontWeight: 500, margin: 0 }}>Your Journey</h2>
        <p style={{ fontSize: 14, color: "#6b5f6e", marginTop: 10 }}>7 orders. Then, a little deliciousness for your mind.</p>
        <Link href="/my-journey" style={{ display: "inline-block", marginTop: 20, padding: "12px 24px", background: DEEP_PLUM, color: IVORY, fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", textDecoration: "none" }}>
          My Journey
        </Link>
      </section>

      <footer style={{ background: DARKER_PLUM, color: CREAM, padding: "36px 24px", textAlign: "center", fontSize: 13 }}>
        <img src="/brand/tangzee-logo.png" alt="Tangzee" style={{ width: 44, height: 44, borderRadius: "50%", marginBottom: 14 }} />
        <p style={{ margin: "4px 0", fontFamily: "var(--font-serif)", fontSize: 16 }}>{settings?.shop_name || "Tangzee"}</p>
        {settings?.address && <p style={{ margin: "4px 0", opacity: 0.7 }}>{settings.address}</p>}
        {settings?.opening_hours && <p style={{ margin: "4px 0", opacity: 0.7 }}>{settings.opening_hours}</p>}
        {settings?.instagram && <p style={{ margin: "4px 0", opacity: 0.7 }}>{settings.instagram}</p>}
      </footer>
    </main>
  );
}
