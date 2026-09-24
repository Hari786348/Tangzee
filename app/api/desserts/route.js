import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseServer";
import { requireAdmin } from "../../../lib/requireAdmin";

// GET is public (used by the customer menu page as a fallback to the
// direct Supabase read, and by the admin dessert list).
export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db.from("desserts").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ desserts: data });
}

// POST creates a dessert. Owner-only (staff can mark items out of
// stock via PATCH .../availability, but adding/pricing items is an
// owner decision).
export async function POST(req) {
  const { adminUser, error: authError } = await requireAdmin({ requireOwner: true });
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const body = await req.json();
  const { name, description, price, image_url, category, available, featured } = body;

  if (!name || price == null) {
    return NextResponse.json({ error: "NAME_AND_PRICE_REQUIRED" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("desserts")
    .insert({
      name,
      description: description ?? null,
      price,
      image_url: image_url ?? null,
      category: category ?? null,
      available: available ?? true,
      featured: featured ?? false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await db.from("audit_logs").insert({ actor_id: adminUser.id, action: "DESSERT_CREATED", record_id: data.id });

  return NextResponse.json({ dessert: data });
}
