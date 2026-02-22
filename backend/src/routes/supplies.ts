import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { auth, requireManager } from "../middleware/auth";
import { updateSupplySchema } from "../lib/validators";
import { levelToQty } from "../lib/supply-utils";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

// PATCH /api/supplies
router.patch("/", auth, async (c) => {
  const body = await c.req.json();
  const parsed = updateSupplySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const results = [];
  for (const supply of parsed.data.supplies) {
    const key = {
      property_id: parsed.data.property_id,
      supply_item_id: supply.category,
    };

    // Read existing stock to derive meaningful qty from level
    const existing = await prisma.propertySupplyStock.findUnique({
      where: { property_id_supply_item_id: key },
    });

    const qtyStandard = existing?.qty_standard ?? 5;
    const lowThreshold = existing?.low_threshold ?? 1;
    const qtyCurrent = levelToQty(supply.level, qtyStandard, lowThreshold);

    const result = await prisma.propertySupplyStock.upsert({
      where: { property_id_supply_item_id: key },
      update: { qty_current: qtyCurrent, updated_by_task: parsed.data.task_id },
      create: {
        ...key,
        qty_current: qtyCurrent,
        qty_standard: qtyStandard,
        low_threshold: lowThreshold,
        updated_by_task: parsed.data.task_id,
      },
    });
    results.push(result);
  }

  return c.json(results);
});

// GET /api/supplies/low
router.get("/low", auth, requireManager, async (c) => {
  const lowSupplies = await prisma.$queryRaw<
    { id: string; property_id: string; supply_item_id: string; qty_current: number; low_threshold: number; property_name: string; property_code: string }[]
  >`
    SELECT pss.*, p.name as property_name, p.code as property_code
    FROM property_supply_stocks pss
    JOIN properties p ON p.id = pss.property_id
    WHERE pss.qty_current <= pss.low_threshold
    ORDER BY p.name ASC
  `;

  return c.json(lowSupplies);
});

export default router;
