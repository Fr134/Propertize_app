import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireAuth, requireManager } from "@/lib/api-utils";
import { createSupplyItemSchema } from "@/lib/validators";
import { type NextRequest } from "next/server";

// GET /api/inventory/items - List supply items
export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const searchParams = req.nextUrl.searchParams;
  const active = searchParams.get("active");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (active === "true") where.is_active = true;
  if (search) where.name = { contains: search, mode: "insensitive" };

  const items = await prisma.supplyItem.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return json(items);
}

// POST /api/inventory/items - Create supply item (MANAGER only)
export async function POST(req: Request) {
  const { error } = await requireManager();
  if (error) return error;

  const body = await req.json();
  const parsed = createSupplyItemSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

  const item = await prisma.supplyItem.create({
    data: {
      name: parsed.data.name,
      sku: parsed.data.sku || null,
      unit: parsed.data.unit,
      balance: { create: { qty_on_hand: 0, reorder_point: 0 } },
    },
    include: { balance: true },
  });

  return json(item, 201);
}
