import { prisma } from "@/lib/prisma";
import { json, requireManager } from "@/lib/api-utils";
import { type NextRequest } from "next/server";

// GET /api/inventory/stock - List all inventory balances
export async function GET(req: NextRequest) {
  const { error } = await requireManager();
  if (error) return error;

  const low = req.nextUrl.searchParams.get("low");

  const where: Record<string, unknown> = {};
  if (low === "true") {
    // Items at or below reorder point (and reorder_point > 0)
    where.AND = [
      { reorder_point: { gt: 0 } },
      { qty_on_hand: { lte: prisma.inventoryBalance.fields.reorder_point } },
    ];
  }

  const balances = await prisma.inventoryBalance.findMany({
    include: {
      supply_item: true,
    },
    orderBy: { supply_item: { name: "asc" } },
  });

  // Filter low stock in JS since Prisma can't compare two columns directly
  const result = low === "true"
    ? balances.filter((b) => b.reorder_point > 0 && b.qty_on_hand <= b.reorder_point)
    : balances;

  return json(result);
}
