import { prisma } from "@/lib/prisma";
import { json, requireManager } from "@/lib/api-utils";
import { type NextRequest } from "next/server";

// GET /api/inventory/forecast - Stock forecast
export async function GET(req: NextRequest) {
  const { error } = await requireManager();
  if (error) return error;

  const searchParams = req.nextUrl.searchParams;
  const days = Math.max(1, parseInt(searchParams.get("days") || "30", 10));

  const since = new Date();
  since.setDate(since.getDate() - days);

  // Get all active items with balances
  const items = await prisma.supplyItem.findMany({
    where: { is_active: true },
    include: { balance: true },
  });

  // Get consumption transactions in the period
  const transactions = await prisma.inventoryTransaction.findMany({
    where: { type: "CONSUMPTION_OUT", created_at: { gte: since } },
  });

  // Group consumption by item
  const consumptionMap = new Map<string, number>();
  for (const tx of transactions) {
    const current = consumptionMap.get(tx.supply_item_id) ?? 0;
    consumptionMap.set(tx.supply_item_id, current + Math.abs(tx.qty));
  }

  const forecast = items.map((item) => {
    const totalConsumed = consumptionMap.get(item.id) ?? 0;
    const avgDaily = totalConsumed / days;
    const qtyOnHand = item.balance?.qty_on_hand ?? 0;
    const reorderPoint = item.balance?.reorder_point ?? 0;
    const daysRemaining = avgDaily > 0 ? Math.floor(qtyOnHand / avgDaily) : null;

    return {
      supply_item_id: item.id,
      name: item.name,
      unit: item.unit,
      qty_on_hand: qtyOnHand,
      reorder_point: reorderPoint,
      total_consumed: totalConsumed,
      avg_daily: Math.round(avgDaily * 100) / 100,
      days_remaining: daysRemaining,
      needs_reorder: qtyOnHand <= reorderPoint,
    };
  });

  return json(forecast);
}
