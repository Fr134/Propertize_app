import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireManager } from "@/lib/api-utils";
import { adjustStockSchema } from "@/lib/validators";

// PATCH /api/inventory/stock/[supplyItemId] - Manual stock adjustment
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ supplyItemId: string }> }
) {
  const { session, error } = await requireManager();
  if (error) return error;

  const { supplyItemId } = await params;
  const body = await req.json();
  const parsed = adjustStockSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

  const item = await prisma.supplyItem.findUnique({ where: { id: supplyItemId } });
  if (!item) return errorResponse("Articolo non trovato", 404);

  const currentBalance = await prisma.inventoryBalance.findUnique({
    where: { supply_item_id: supplyItemId },
  });
  const currentQty = currentBalance?.qty_on_hand ?? 0;
  const delta = parsed.data.qty_on_hand - currentQty;

  const result = await prisma.$transaction(async (tx) => {
    if (delta !== 0) {
      await tx.inventoryTransaction.create({
        data: {
          supply_item_id: supplyItemId,
          type: "ADJUSTMENT",
          qty: delta,
          notes: parsed.data.notes || `Rettifica manuale: ${currentQty} → ${parsed.data.qty_on_hand}`,
          created_by: session!.user.id,
        },
      });
    }

    return tx.inventoryBalance.upsert({
      where: { supply_item_id: supplyItemId },
      update: {
        qty_on_hand: parsed.data.qty_on_hand,
        ...(parsed.data.reorder_point !== undefined && { reorder_point: parsed.data.reorder_point }),
      },
      create: {
        supply_item_id: supplyItemId,
        qty_on_hand: parsed.data.qty_on_hand,
        reorder_point: parsed.data.reorder_point ?? 0,
      },
    });
  });

  return json(result);
}
