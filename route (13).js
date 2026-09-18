import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseServer";
import { requireAdmin } from "../../../lib/requireAdmin";

// GET: list all campaigns with claim/redemption counts. Staff-only
// (the public campaign page fetches a single campaign a different way).
export async function GET() {
  const { error: authError } = await requireAdmin();
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const db = supabaseAdmin();
  const { data: campaigns, error } = await db
    .from("campaigns")
    .select("*, desserts(name)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const withCounts = await Promise.all(
    campaigns.map(async (c) => {
      const { count: claims } = await db
        .from("campaign_claims")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", c.id);
      const { count: redemptions } = await db
        .from("campaign_claims")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", c.id)
        .eq("status", "REDEEMED");
      return { ...c, claims_count: claims || 0, redemptions_count: redemptions || 0 };
    })
  );

  return NextResponse.json({ campaigns: withCounts });
}

// POST: create a campaign. campaign_code must be unique — the DB's
// unique constraint is the real enforcement; this just surfaces a clean
// error if it collides.
export async function POST(req) {
  const { adminUser, error: authError } = await requireAdmin();
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const body = await req.json();
  const { campaign_code, title, featured_dessert_id, start_date, end_date, reward_description, poster_image_url } = body;

  if (!campaign_code || !title) {
    return NextResponse.json({ error: "CODE_AND_TITLE_REQUIRED" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("campaigns")
    .insert({
      campaign_code,
      title,
      featured_dessert_id: featured_dessert_id || null,
      start_date: start_date || null,
      end_date: end_date || null,
      reward_description: reward_description || "2 FOR THE PRICE OF 1",
      poster_image_url: poster_image_url || null,
      status: "DRAFT",
    })
    .select()
    .single();

  if (error) {
    const msg = error.message.includes("duplicate") ? "CAMPAIGN_CODE_TAKEN" : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  await db.from("audit_logs").insert({ actor_id: adminUser.id, action: "CAMPAIGN_CREATED", record_id: data.id });

  return NextResponse.json({ campaign: data });
}
