import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireManager } from "@/lib/api-utils";
import { type NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

// GET /api/inventory/orders/[id] - Order detail
export async function GET(_req: NextRequest, { params }: Params) {
  const { error } = await requireManager();
  if (error) return error;

  const { id } = await params;

  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      lines: {
        include: { supply_item: { select: { name: true, unit: true } } },
      },
    },
  });

  if (!order) return errorResponse("Ordine non trovato", 404);

  return json(order);
}

// PATCH /api/inventory/orders/[id] - Update order status
export async function PATCH(req: NextRequest, { params }: Params) {
  const { error } = await requireManager();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  if (!["DRAFT", "ORDERED", "CANCELLED"].includes(status)) {
    return errorResponse("Stato non valido. Usa DRAFT, ORDERED o CANCELLED.");
  }

  const order = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!order) return errorResponse("Ordine non trovato", 404);

  const data: Record<string, unknown> = { status };
  if (status === "ORDERED") data.ordered_at = new Date();

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data,
    include: {
      lines: {
        include: { supply_item: { select: { name: true, unit: true } } },
      },
    },
  });

  return json(updated);
}
