import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseServer";
import { requireAdmin } from "../../../lib/requireAdmin";

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function GET() {
  const { error: authError } = await requireAdmin({ requireOwner: true });
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const db = supabaseAdmin();
  const { data: rows, error } = await db
    .from("admin_users")
    .select("id, auth_user_id, full_name, active, created_at")
    .eq("role", "staff")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "LOAD_FAILED" }, { status: 500 });

  const { data: usersData } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const emailById = {};
  for (const u of usersData?.users || []) emailById[u.id] = u.email;

  const staff = (rows || []).map((r) => ({
    id: r.id,
    fullName: r.full_name,
    active: r.active,
    email: emailById[r.auth_user_id] || "",
    createdAt: r.created_at,
  }));
  return NextResponse.json({ staff });
}

export async function POST(req) {
  const { adminUser, error: authError } = await requireAdmin({ requireOwner: true });
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const { email, password, fullName } = await req.json();
  if (!isValidEmail(email)) return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
  if (!password || password.length < 6) return NextResponse.json({ error: "PASSWORD_TOO_SHORT" }, { status: 400 });

  const db = supabaseAdmin();
  const { data: created, error: createErr } = await db.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
  });
  if (createErr || !created?.user) {
    const already = createErr?.message?.toLowerCase().includes("already");
    return NextResponse.json({ error: already ? "EMAIL_ALREADY_USED" : "CREATE_FAILED" }, { status: already ? 409 : 500 });
  }

  const { data: row, error: rowErr } = await db
    .from("admin_users")
    .insert({ auth_user_id: created.user.id, full_name: fullName || null, role: "staff" })
    .select()
    .single();
  if (rowErr) {
    await db.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: "CREATE_FAILED" }, { status: 500 });
  }

  await db.from("audit_logs").insert({
    actor_id: adminUser.id,
    action: "STAFF_CREATED",
    record_id: row.id,
    details: { email: email.trim() },
  });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req) {
  const { adminUser, error: authError } = await requireAdmin({ requireOwner: true });
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const { id, email, password, fullName, active } = await req.json();
  if (!id) return NextResponse.json({ error: "ID_REQUIRED" }, { status: 400 });

  const db = supabaseAdmin();
  const { data: row } = await db.from("admin_users").select("*").eq("id", id).eq("role", "staff").single();
  if (!row) return NextResponse.json({ error: "STAFF_NOT_FOUND" }, { status: 404 });

  const authUpdates = {};
  if (email && email.trim()) {
    if (!isValidEmail(email)) return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
    authUpdates.email = email.trim();
    authUpdates.email_confirm = true;
  }
  if (password) {
    if (password.length < 6) return NextResponse.json({ error: "PASSWORD_TOO_SHORT" }, { status: 400 });
    authUpdates.password = password;
  }
  if (Object.keys(authUpdates).length > 0) {
    const { error: updErr } = await db.auth.admin.updateUserById(row.auth_user_id, authUpdates);
    if (updErr) {
      const already = updErr.message?.toLowerCase().includes("already");
      return NextResponse.json({ error: already ? "EMAIL_ALREADY_USED" : "UPDATE_FAILED" }, { status: already ? 409 : 500 });
    }
  }

  const rowUpdates = {};
  if (typeof fullName === "string") rowUpdates.full_name = fullName.trim() || null;
  if (typeof active === "boolean") rowUpdates.active = active;
  if (Object.keys(rowUpdates).length > 0) {
    const { error: rowErr } = await db.from("admin_users").update(rowUpdates).eq("id", id);
    if (rowErr) return NextResponse.json({ error: "UPDATE_FAILED" }, { status: 500 });
  }

  await db.from("audit_logs").insert({
    actor_id: adminUser.id,
    action: typeof active === "boolean" ? (active ? "STAFF_ACTIVATED" : "STAFF_DEACTIVATED") : "STAFF_UPDATED",
    record_id: id,
    details: {
      emailChanged: !!authUpdates.email,
      passwordChanged: !!authUpdates.password,
    },
  });
  return NextResponse.json({ ok: true });
    }
