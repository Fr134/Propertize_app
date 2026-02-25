import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { auth, requireManager } from "../middleware/auth";
import { requirePermission } from "../middleware/permissions";
import { checklistTemplateSchema } from "../lib/validators";
import type { AppEnv } from "../types";
import type { Prisma } from "@prisma/client";

const router = new Hono<AppEnv>();

// GET /api/properties/:propertyId/checklist-template
router.get("/:propertyId/checklist-template", auth, async (c) => {
  const propertyId = c.req.param("propertyId");

  const template = await prisma.checklistTemplate.findUnique({
    where: { property_id: propertyId },
  });

  if (!template) {
    return c.json({ items: [] });
  }

  return c.json({ items: template.items });
});

// POST /api/properties/:propertyId/checklist-template
router.post("/:propertyId/checklist-template", auth, requireManager, requirePermission("can_manage_operations"), async (c) => {
  const propertyId = c.req.param("propertyId");

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return c.json({ error: "Immobile non trovato" }, 404);

  const body = await c.req.json();
  const parsed = checklistTemplateSchema.safeParse(body.items);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const template = await prisma.checklistTemplate.upsert({
    where: { property_id: propertyId },
    update: { items: parsed.data as unknown as Prisma.InputJsonValue },
    create: { property_id: propertyId, items: parsed.data as unknown as Prisma.InputJsonValue },
  });

  return c.json({ items: template.items });
});

export default router;
