import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { auth } from "../middleware/auth";
import { updateLinenSchema } from "@propertize/shared";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

// PATCH /api/linen
router.patch("/", auth, async (c) => {
  const body = await c.req.json();
  const parsed = updateLinenSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const results = [];
  for (const item of parsed.data.linen) {
    const result = await prisma.linenInventory.upsert({
      where: {
        property_id_type_status: {
          property_id: parsed.data.property_id,
          type: item.type,
          status: item.status,
        },
      },
      update: { quantity: item.quantity },
      create: {
        property_id: parsed.data.property_id,
        type: item.type,
        status: item.status,
        quantity: item.quantity,
      },
    });
    results.push(result);
  }

  return c.json(results);
});

export default router;
