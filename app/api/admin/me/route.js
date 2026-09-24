import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/requireAdmin";

// GET: tells the client which admin is logged in and their role, so
// admin pages can show/hide owner-only sections. This is read-only
// self-info — every owner-only ACTION is still enforced server-side
// in its own route via requireAdmin({ requireOwner: true }), so this
// route being called with the "wrong" answer can never grant access.
export async function GET() {
  const { adminUser, error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: 401 });

  return NextResponse.json({
    role: adminUser.role,
    fullName: adminUser.full_name,
  });
}
