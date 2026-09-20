import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseServer";
import { requireAdmin } from "../../../../lib/requireAdmin";

// POST { claimCode: "TZ001-X7K9P2" }
// Staff-only. requireAdmin() checks the session server-side before
// anything else runs, so this can never be called by an unauthenticated
// browser regardless of what the frontend shows.
export async function POST(req) {
  const { adminUser, error: authError } = await requireAdmin();
  if (authError) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  const { claimCode } = await req.json();
  if (!claimCode) {
    return NextResponse.json({ error: "CLAIM_CODE_REQUIRED" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: claim, error } = await db.rpc("redeem_campaign_claim", {
    p_claim_code: claimCode,
    p_admin_id: adminUser.id,
  });

  if (error) {
    // e.g. CLAIM_NOT_FOUND, ALREADY_REDEEMED
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ claim });
}
