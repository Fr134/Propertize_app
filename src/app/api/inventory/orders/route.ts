import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireManager } from "@/lib/api-utils";
import { getPaginationParams, createPaginatedResponse } from "@/lib/pagination";
import { createPurchaseOrderSchema } from "@/lib/validators";
import { type NextRequest } from "next/server";

// GET /api/inventory/orders - List purchase orders
export async function GET(req: NextRequest) {
  const { error } = await requireManager();
  if (error) return error;

  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status");
  const { page, limit, skip } = getPaginationParams(req);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      include: {
        lines: {
          include: { supply_item: { select: { name: true, unit: true } } },
        },
      },
      orderBy: { created_at: "desc" },
      take: limit,
      skip,
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return json(createPaginatedResponse(orders, total, page, limit));
}

// POST /api/inventory/orders - Create purchase order
export async function POST(req: NextRequest) {
  const { session, error } = await requireManager();
  if (error) return error;

  const body = await req.json();
  const parsed = createPurchaseOrderSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  const { order_ref, notes, lines } = parsed.data;

  const order = await prisma.purchaseOrder.create({
    data: {
      order_ref: order_ref || null,
      notes: notes || null,
      created_by: session!.user.id,
      lines: {
        create: lines.map((l) => ({
          supply_item_id: l.supply_item_id,
          qty_ordered: l.qty_ordered,
          unit_cost: l.unit_cost ?? null,
        })),
      },
    },
    include: {
      lines: {
        include: { supply_item: { select: { name: true, unit: true } } },
      },
    },
  });

  return json(order, 201);
}
