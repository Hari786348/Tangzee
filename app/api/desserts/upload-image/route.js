import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseServer";
import { requireAdmin } from "../../../../lib/requireAdmin";

export async function POST(req) {
  const { adminUser, error: authError } = await requireAdmin();
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file) {
    return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const ext = file.name?.split(".").pop() || "jpg";
  const path = `dessert-${Date.now()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await db.storage
    .from("content")
    .upload(path, arrayBuffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = db.storage.from("content").getPublicUrl(path);
  const publicUrl = publicUrlData.publicUrl;

  await db.from("audit_logs").insert({ actor_id: adminUser.id, action: "DESSERT_IMAGE_UPLOADED", record_id: null });

  return NextResponse.json({ url: publicUrl });
                                           }
