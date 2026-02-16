import { prisma } from "@/lib/prisma";
import { json, requireManager } from "@/lib/api-utils";
import { getPaginationParams, createPaginatedResponse } from "@/lib/pagination";
import { type NextRequest } from "next/server";

// GET /api/inventory/transactions - Transaction log
export async function GET(req: NextRequest) {
  const { error } = await requireManager();
  if (error) return error;

  const searchParams = req.nextUrl.searchParams;
  const supplyItemId = searchParams.get("supply_item_id");
  const type = searchParams.get("type");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const { page, limit, skip } = getPaginationParams(req);

  const where: Record<string, unknown> = {};
  if (supplyItemId) where.supply_item_id = supplyItemId;
  if (type) where.type = type;
  if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);
    where.created_at = dateFilter;
  }

  const [transactions, total] = await Promise.all([
    prisma.inventoryTransaction.findMany({
      where,
      include: { supply_item: { select: { name: true, unit: true } } },
      orderBy: { created_at: "desc" },
      take: limit,
      skip,
    }),
    prisma.inventoryTransaction.count({ where }),
  ]);

  return json(createPaginatedResponse(transactions, total, page, limit));
}
