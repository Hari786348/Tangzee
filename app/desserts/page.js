import { supabaseAdmin } from "../../lib/supabaseServer";

const PLUM = "#2F243A";

export const revalidate = 0; // always show current menu

export default async function DessertsPage() {
  const db = supabaseAdmin();
  const { data: desserts } = await db
    .from("desserts")
    .select("*")
    .eq("available", true)
    .order("category");

  const byCategory = {};
  for (const d of desserts || []) {
    const rawCat = (d.category || "Signature").trim() || "Signature";
    const key = rawCat.toLowerCase();
    if (!byCategory[key]) byCategory[key] = { label: rawCat, items: [] };
    byCategory[key].items.push(d);
  }

  return (
    <main style={{ minHeight: "100vh", background: "#FFFFFF", padding: "32px 20px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ color: PLUM, letterSpacing: 2 }}>TANGZEE DESSERTS</h1>

        {Object.entries(byCategory).map(([key, { label, items }]) => (
          <section key={key} style={{ marginTop: 32 }}>
            <h2 style={{ color: "#000", fontSize: 16, letterSpacing: 1, textTransform: "uppercase" }}>
              {label}
            </h2>
            <div style={{ display: "grid", gap: 16, marginTop: 12 }}>
              {items.map((d) => (
                <div
                  key={d.id}
                  style={{
                    border: "1px solid #00000015",
                    borderRadius: 10,
                    padding: 16,
                    display: "flex",
                    gap: 14,
                    alignItems: "center",
                  }}
                >
                  {d.image_url && (
                    <img
                      src={d.image_url}
                      alt={d.name}
                      style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600 }}>
                        {d.name} {d.featured && <span style={{ color: PLUM, fontSize: 12 }}>★ FEATURED</span>}
                      </p>
                      {d.description && (
                        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#666" }}>{d.description}</p>
                      )}
                    </div>
                    <p style={{ margin: 0, fontWeight: 700, color: PLUM }}>₹{d.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {(!desserts || desserts.length === 0) && (
          <p style={{ color: "#666", marginTop: 32 }}>No desserts available yet.</p>
        )}
      </div>
    </main>
  );
          }
