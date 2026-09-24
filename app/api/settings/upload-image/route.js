import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseServer";
import { requireAdmin } from "../../../../lib/requireAdmin";

export async function POST(req) {
  const { adminUser, error: authError } = await requireAdmin({ requireOwner: true });
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");
  const field = formData.get("field");

  const allowedFields = ["hero_image_url", "featured_image_url"];
  if (!file || !allowedFields.includes(field)) {
    return NextResponse.json({ error: "FILE_AND_VALID_FIELD_REQUIRED" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const ext = file.name?.split(".").pop() || "jpg";
  const path = `${field}-${Date.now()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await db.storage
    .from("content")
    .upload(path, arrayBuffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = db.storage.from("content").getPublicUrl(path);
  const publicUrl = publicUrlData.publicUrl;

  const { data: settings, error: updateError } = await db
    .from("shop_settings")
    .update({ [field]: publicUrl })
    .eq("id", 1)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await db.from("audit_logs").insert({ actor_id: adminUser.id, action: "CONTENT_IMAGE_UPDATED", record_id: null });

  return NextResponse.json({ settings });
}
