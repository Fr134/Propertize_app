import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireManager } from "@/lib/api-utils";
import { receivePurchaseOrderSchema } from "@/lib/validators";
import { type NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

// POST /api/inventory/orders/[id]/receive - Receive purchase order
export async function POST(req: NextRequest, { params }: Params) {
  const { session, error } = await requireManager();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = receivePurchaseOrderSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { lines: true },
  });

  if (!order) return errorResponse("Ordine non trovato", 404);
  if (order.status === "RECEIVED") return errorResponse("Ordine già ricevuto");
  if (order.status === "CANCELLED") return errorResponse("Ordine annullato");

  const { lines: receivedLines } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    for (const rl of receivedLines) {
      const orderLine = order.lines.find(
        (l) => l.supply_item_id === rl.supply_item_id
      );
      if (!orderLine) continue;

      // Update line qty_received
      await tx.purchaseOrderLine.update({
        where: { id: orderLine.id },
        data: { qty_received: rl.qty_received },
      });

      if (rl.qty_received <= 0) continue;

      // Create PURCHASE_IN transaction
      await tx.inventoryTransaction.create({
        data: {
          supply_item_id: rl.supply_item_id,
          type: "PURCHASE_IN",
          qty: rl.qty_received,
          reference_id: id,
          notes: `Ricevuto da ordine ${order.order_ref || id}`,
          created_by: session!.user.id,
        },
      });

      // Increment balance
      await tx.inventoryBalance.upsert({
        where: { supply_item_id: rl.supply_item_id },
        update: { qty_on_hand: { increment: rl.qty_received } },
        create: {
          supply_item_id: rl.supply_item_id,
          qty_on_hand: rl.qty_received,
          reorder_point: 0,
        },
      });
    }

    // Mark order as RECEIVED
    return tx.purchaseOrder.update({
      where: { id },
      data: { status: "RECEIVED", received_at: new Date() },
      include: {
        lines: {
          include: { supply_item: { select: { name: true, unit: true } } },
        },
      },
    });
  });

  return json(result);
}
