import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseServer";
import { requireAdmin } from "../../../lib/requireAdmin";

// GET /api/expenses?month=2026-09  (defaults to current month)
// Returns the raw material entries for that month + the month's
// staff salary / electricity bill (0 if not entered yet).
export async function GET(req) {
  const { error: authError } = await requireAdmin({ requireOwner: true });
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const monthParam = new URL(req.url).searchParams.get("month");
  const now = new Date();
  const monthStart = monthParam ? `${monthParam}-01` : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const monthStartDate = new Date(monthStart);
  const nextMonthStart = new Date(monthStartDate.getFullYear(), monthStartDate.getMonth() + 1, 1).toISOString().slice(0, 10);

  const db = supabaseAdmin();

  const { data: rawEntries } = await db
    .from("raw_material_costs")
    .select("*")
    .gte("cost_date", monthStart)
    .lt("cost_date", nextMonthStart)
    .order("cost_date", { ascending: false });

  const { data: monthlyCost } = await db
    .from("monthly_costs")
    .select("*")
    .eq("month", monthStart)
    .single();

  const rawMaterialTotal = (rawEntries || []).reduce((sum, r) => sum + Number(r.amount), 0);

  return NextResponse.json({
    month: monthStart,
    rawEntries: rawEntries || [],
    rawMaterialTotal,
    staffSalary: monthlyCost?.staff_salary || 0,
    electricityBill: monthlyCost?.electricity_bill || 0,
  });
}

// POST { date, amount, note? } — logs one raw material cost entry.
export async function POST(req) {
  const { adminUser, error: authError } = await requireAdmin({ requireOwner: true });
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const { date, amount, note } = await req.json();
  if (!date || amount == null || isNaN(Number(amount)) || Number(amount) < 0) {
    return NextResponse.json({ error: "DATE_AND_VALID_AMOUNT_REQUIRED" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("raw_material_costs")
    .insert({ cost_date: date, amount: Number(amount), note: note || null, created_by: adminUser.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "SAVE_FAILED" }, { status: 500 });

  await db.from("audit_logs").insert({
    actor_id: adminUser.id,
    action: "RAW_MATERIAL_COST_LOGGED",
    record_id: data.id,
    details: { date, amount: Number(amount) },
  });

  return NextResponse.json({ entry: data });
}

// PATCH { month: "2026-09", staffSalary, electricityBill } — sets this
// month's salary + electricity bill (upsert, one row per month).
export async function PATCH(req) {
  const { adminUser, error: authError } = await requireAdmin({ requireOwner: true });
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const { month, staffSalary, electricityBill } = await req.json();
  if (!month) return NextResponse.json({ error: "MONTH_REQUIRED" }, { status: 400 });

  const monthStart = `${month}-01`;
  const db = supabaseAdmin();

  const { data, error } = await db
    .from("monthly_costs")
    .upsert(
      {
        month: monthStart,
        staff_salary: Number(staffSalary) || 0,
        electricity_bill: Number(electricityBill) || 0,
        updated_by: adminUser.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "month" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: "SAVE_FAILED" }, { status: 500 });

  await db.from("audit_logs").insert({
    actor_id: adminUser.id,
    action: "MONTHLY_COSTS_UPDATED",
    record_id: data.id,
    details: { month: monthStart, staffSalary: data.staff_salary, electricityBill: data.electricity_bill },
  });

  return NextResponse.json({ monthlyCost: data });
}
