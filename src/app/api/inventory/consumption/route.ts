import { prisma } from "@/lib/prisma";
import { json, requireManager } from "@/lib/api-utils";
import { type NextRequest } from "next/server";

// GET /api/inventory/consumption - Consumption summary
export async function GET(req: NextRequest) {
  const { error } = await requireManager();
  if (error) return error;

  const searchParams = req.nextUrl.searchParams;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = { type: "CONSUMPTION_OUT" };
  if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);
    where.created_at = dateFilter;
  }

  const transactions = await prisma.inventoryTransaction.findMany({
    where,
    include: { supply_item: { select: { name: true, unit: true } } },
  });

  // Group by supply_item_id
  const grouped = new Map<
    string,
    { supply_item_id: string; name: string; unit: string; total_qty: number; tx_count: number }
  >();

  for (const tx of transactions) {
    const existing = grouped.get(tx.supply_item_id);
    if (existing) {
      existing.total_qty += Math.abs(tx.qty);
      existing.tx_count += 1;
    } else {
      grouped.set(tx.supply_item_id, {
        supply_item_id: tx.supply_item_id,
        name: tx.supply_item.name,
        unit: tx.supply_item.unit,
        total_qty: Math.abs(tx.qty),
        tx_count: 1,
      });
    }
  }

  return json(Array.from(grouped.values()));
}
