import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseServer";
import { requireAdmin } from "../../../../lib/requireAdmin";

// PATCH { status?, title?, featured_dessert_id?, start_date?, end_date?,
//         reward_description?, poster_image_url? }
// Staff-only. Used for both edits and status changes
// (ACTIVATE/PAUSE/ARCHIVE just send { status: "ACTIVE" | "PAUSED" | "ARCHIVED" }).
export async function PATCH(req, { params }) {
  const { adminUser, error: authError } = await requireAdmin({ requireOwner: true });
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const updates = await req.json();
  updates.updated_at = new Date().toISOString();

  const db = supabaseAdmin();
  const { data, error } = await db.from("campaigns").update(updates).eq("id", params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const action = updates.status ? `CAMPAIGN_${updates.status}` : "CAMPAIGN_EDITED";
  await db.from("audit_logs").insert({ actor_id: adminUser.id, action, record_id: data.id });

  return NextResponse.json({ campaign: data });
}
