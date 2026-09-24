import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseServer";
import { requireAdmin } from "../../../../lib/requireAdmin";

// POST { email: "someone@example.com", items: [{ dessertId, quantity }] }
// Staff-only. Creates the customer if new, then a PENDING order with
// items priced at current dessert price (price_at_purchase snapshot).
// Order starts PENDING — it only counts toward the 7-order journey once
// /api/orders/complete is called.
export async function POST(req) {
  const { adminUser, error: authError } = await requireAdmin();
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const { email, items } = await req.json();
  if (!email || !items || items.length === 0) {
    return NextResponse.json({ error: "EMAIL_AND_ITEMS_REQUIRED" }, { status: 400 });
  }

  const db = supabaseAdmin();

  let { data: customer } = await db.from("customers").select("*").eq("email", email).single();
  if (!customer) {
    const { data: created, error: createErr } = await db.from("customers").insert({ email }).select().single();
    if (createErr) return NextResponse.json({ error: "CUSTOMER_CREATE_FAILED" }, { status: 500 });
    customer = created;
  }

  const dessertIds = items.map((i) => i.dessertId);
  const { data: dessertRows } = await db.from("desserts").select("id, price").in("id", dessertIds);
  const priceMap = Object.fromEntries((dessertRows || []).map((d) => [d.id, d.price]));

  const total = items.reduce((sum, i) => sum + (priceMap[i.dessertId] || 0) * i.quantity, 0);
  const orderNumber = "TZ" + Date.now().toString().slice(-8);

  const { data: order, error: orderErr } = await db
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_id: customer.id,
      total_amount: total,
      status: "PENDING",
      created_by: adminUser.id,
    })
    .select()
    .single();

  if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 500 });

  const orderItems = items.map((i) => ({
    order_id: order.id,
    dessert_id: i.dessertId,
    quantity: i.quantity,
    price_at_purchase: priceMap[i.dessertId] || 0,
  }));
  await db.from("order_items").insert(orderItems);

  return NextResponse.json({ order, customer });
}
