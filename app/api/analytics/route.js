import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseServer";
import { requireAdmin } from "../../../lib/requireAdmin";

// GET: every number the owner dashboard/analytics page needs, computed
// server-side from real rows (never trusted from the client).
export async function GET() {
  const { error: authError } = await requireAdmin({ requireOwner: true });
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const db = supabaseAdmin();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const count = async (table, filters = []) => {
    let q = db.from(table).select("*", { count: "exact", head: true });
    for (const [col, op, val] of filters) q = q[op](col, val);
    const { count } = await q;
    return count || 0;
  };

  const [
    totalCustomers,
    todaysOrders,
    weekOrders,
    monthOrders,
    activeCampaigns,
    campaignClaims,
    campaignRedemptions,
    miniDessertsGiven,
  ] = await Promise.all([
    count("customers"),
    count("orders", [["status", "eq", "COMPLETED"], ["completed_at", "gte", startOfToday]]),
    count("orders", [["status", "eq", "COMPLETED"], ["completed_at", "gte", startOfWeek]]),
    count("orders", [["status", "eq", "COMPLETED"], ["completed_at", "gte", startOfMonth]]),
    count("campaigns", [["status", "eq", "ACTIVE"]]),
    count("campaign_claims"),
    count("campaign_claims", [["status", "eq", "REDEEMED"]]),
    count("mini_dessert_claims"),
  ]);

  const { data: cycles } = await db.from("loyalty_cycles").select("current_progress");
  const milestoneBuckets = [0, 0, 0, 0, 0, 0, 0, 0]; // index = progress 0..7
  for (const c of cycles || []) milestoneBuckets[c.current_progress] = (milestoneBuckets[c.current_progress] || 0) + 1;

  // --- Revenue + profit for the current month ---
  const { data: monthOrderRows } = await db
    .from("orders")
    .select("total_amount")
    .eq("status", "COMPLETED")
    .gte("completed_at", startOfMonth);
  const monthRevenue = (monthOrderRows || []).reduce((sum, o) => sum + Number(o.total_amount), 0);

  const { data: rawEntries } = await db
    .from("raw_material_costs")
    .select("amount")
    .gte("cost_date", startOfMonth.slice(0, 10));
  const rawMaterialTotal = (rawEntries || []).reduce((sum, r) => sum + Number(r.amount), 0);

  const { data: monthlyCost } = await db
    .from("monthly_costs")
    .select("*")
    .eq("month", startOfMonth.slice(0, 10))
    .single();
  const staffSalary = monthlyCost?.staff_salary || 0;
  const electricityBill = monthlyCost?.electricity_bill || 0;

  const finalProfit = monthRevenue - rawMaterialTotal - staffSalary - electricityBill;

  return NextResponse.json({
    totalCustomers,
    todaysOrders,
    weekOrders,
    monthOrders,
    activeCampaigns,
    campaignClaims,
    campaignRedemptions,
    miniDessertsGiven,
    milestoneBuckets, // e.g. milestoneBuckets[3] = customers currently at 3/7
    claimToRedemptionRate: campaignClaims > 0 ? Math.round((campaignRedemptions / campaignClaims) * 100) : 0,
    profit: {
      monthRevenue,
      rawMaterialTotal,
      staffSalary,
      electricityBill,
      finalProfit,
    },
  });
}
