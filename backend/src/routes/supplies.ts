import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { auth, requireManager } from "../middleware/auth";
import { updateSupplySchema } from "../lib/validators";
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
    const result = await prisma.supplyLevel.upsert({
      where: {
        property_id_category: {
          property_id: parsed.data.property_id,
          category: supply.category,
        },
      },
      update: { level: supply.level, task_id: parsed.data.task_id },
      create: {
        property_id: parsed.data.property_id,
        category: supply.category,
        level: supply.level,
        task_id: parsed.data.task_id,
      },
    });
    results.push(result);
  }

  return c.json(results);
});

// GET /api/supplies/low
router.get("/low", auth, requireManager, async (c) => {
  const lowSupplies = await prisma.supplyLevel.findMany({
    where: { level: { in: ["IN_ESAURIMENTO", "ESAURITO"] } },
    include: { property: { select: { id: true, name: true, code: true } } },
    orderBy: [{ level: "asc" }, { category: "asc" }],
  });

  return c.json(lowSupplies);
});

export default router;
