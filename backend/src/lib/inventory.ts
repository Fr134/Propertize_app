import type { PrismaClient } from "@prisma/client";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Post consumption transactions when a task is approved.
 * Must be called inside a prisma.$transaction.
 */
export async function postConsumptionTx(
  tx: TxClient,
  taskId: string,
  approvedBy: string
): Promise<void> {
  const usages = await tx.taskSupplyUsage.findMany({
    where: { task_id: taskId, qty_used: { gt: 0 } },
  });

  if (usages.length === 0) return;

  for (const usage of usages) {
    const balance = await tx.inventoryBalance.findUnique({
      where: { supply_item_id: usage.supply_item_id },
    });

    const currentQty = balance?.qty_on_hand ?? 0;
    const newQty = currentQty - usage.qty_used;

    await tx.inventoryTransaction.create({
      data: {
        supply_item_id: usage.supply_item_id,
        type: "CONSUMPTION_OUT",
        qty: -usage.qty_used,
        reference_id: taskId,
        notes:
          newQty < 0
            ? `Clamped: richiesti ${usage.qty_used}, disponibili ${currentQty}`
            : null,
        created_by: approvedBy,
      },
    });

    await tx.inventoryBalance.upsert({
      where: { supply_item_id: usage.supply_item_id },
      update: { qty_on_hand: Math.max(0, newQty) },
      create: {
        supply_item_id: usage.supply_item_id,
        qty_on_hand: 0,
        reorder_point: 0,
      },
    });
  }
}
