import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseServer";
import { requireAdmin } from "../../../lib/requireAdmin";

function monthStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthStartOf(monthStr) {
  return `${monthStr}-01`;
}
function shiftMonthStr(monthStr, delta) {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Returns a month's analytics bundle — from the permanent cache if
// it's a past month and already saved, otherwise computed live (and
// saved to the cache if it's a past month, so it's instant next time).
async function getMonthData(db, month) {
  const start = monthStartOf(month);
  const isCurrent = month === monthStr(new Date());

  if (!isCurrent) {
    const { data: cached } = await db.from("monthly_snapshots").select("data").eq("month", start).single();
    if (cached) return cached.data;
  }

  const { data, error } = await db.rpc("get_monthly_analytics", { p_month: start });
  if (error) throw error;

  if (!isCurrent) {
    await db.from("monthly_snapshots").upsert({ month: start, data }, { onConflict: "month" });
  }
  return data;
}

// GET /api/analytics?month=2026-09  (defaults to current month)
// Owner-only. Returns: live "right now" tiles (independent of which
// month is being browsed), the requested month's full breakdown,
// its revenue trend vs the previous month (current month only), and
// all-time totals.
export async function GET(req) {
  const { error: authError } = await requireAdmin({ requireOwner: true });
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const db = supabaseAdmin();
  const current = monthStr(new Date());
  const requestedMonth = new URL(req.url).searchParams.get("month") || current;

  try {
    const [liveRes, monthData, overallRes] = await Promise.all([
      db.rpc("get_live_stats"),
      getMonthData(db, requestedMonth),
      db.rpc("get_overall_analytics"),
    ]);
    if (liveRes.error) throw liveRes.error;
    if (overallRes.error) throw overallRes.error;

    let revenueChangePct = null;
    if (requestedMonth === current) {
      const prevData = await getMonthData(db, shiftMonthStr(requestedMonth, -1));
      if (prevData.revenue > 0) {
        revenueChangePct = Math.round(((monthData.revenue - prevData.revenue) / prevData.revenue) * 100);
      } else if (monthData.revenue > 0) {
        revenueChangePct = 100;
      } else {
        revenueChangePct = 0;
      }
    }

    return NextResponse.json({
      currentMonth: current,
      month: monthData,
      allTime: overallRes.data,
      revenueChangePct,
      ...liveRes.data,
    });
  } catch (e) {
    return NextResponse.json({ error: "LOAD_FAILED" }, { status: 500 });
  }
      }
