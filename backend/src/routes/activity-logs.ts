import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { auth, requireManager } from "../middleware/auth";
import { requirePermission } from "../middleware/permissions";
import { createActivityLogSchema, updateActivityLogSchema } from "../lib/validators";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

// GET /api/activity-logs?property_id=X&category=Y&from=Z&to=W
router.get("/", auth, requireManager, async (c) => {
  const propertyId = c.req.query("property_id");
  const category = c.req.query("category");
  const from = c.req.query("from");
  const to = c.req.query("to");

  if (!propertyId) {
    return c.json({ error: "property_id obbligatorio" }, 400);
  }

  const where: Record<string, unknown> = { property_id: propertyId };
  if (category) where.category = category;
  if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);
    where.date = dateFilter;
  }

  const logs = await prisma.propertyActivityLog.findMany({
    where,
    include: {
      author: { select: { id: true, first_name: true, last_name: true } },
    },
    orderBy: [{ date: "desc" }, { created_at: "desc" }],
  });

  return c.json(logs);
});

// POST /api/activity-logs
router.post("/", auth, requireManager, requirePermission("can_manage_operations"), async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const parsed = createActivityLogSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const log = await prisma.propertyActivityLog.create({
    data: {
      property_id: parsed.data.property_id,
      created_by: userId,
      date: new Date(parsed.data.date),
      category: parsed.data.category,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      is_resolved: parsed.data.is_resolved ?? false,
      resolved_at: parsed.data.is_resolved ? new Date() : null,
    },
    include: {
      author: { select: { id: true, first_name: true, last_name: true } },
    },
  });

  return c.json(log, 201);
});

// PATCH /api/activity-logs/:id
router.patch("/:id", auth, requireManager, requirePermission("can_manage_operations"), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateActivityLogSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const existing = await prisma.propertyActivityLog.findUnique({ where: { id } });
  if (!existing) return c.json({ error: "Attivita non trovata" }, 404);

  const data: Record<string, unknown> = {};
  if (parsed.data.date) data.date = new Date(parsed.data.date);
  if (parsed.data.category) data.category = parsed.data.category;
  if (parsed.data.title) data.title = parsed.data.title;
  if (parsed.data.description !== undefined) data.description = parsed.data.description;
  if (parsed.data.is_resolved !== undefined) {
    data.is_resolved = parsed.data.is_resolved;
    data.resolved_at = parsed.data.is_resolved ? new Date() : null;
  }

  const updated = await prisma.propertyActivityLog.update({
    where: { id },
    data,
    include: {
      author: { select: { id: true, first_name: true, last_name: true } },
    },
  });

  return c.json(updated);
});

// DELETE /api/activity-logs/:id
router.delete("/:id", auth, requireManager, requirePermission("can_manage_operations"), async (c) => {
  const id = c.req.param("id");

  const existing = await prisma.propertyActivityLog.findUnique({ where: { id } });
  if (!existing) return c.json({ error: "Attivita non trovata" }, 404);

  await prisma.propertyActivityLog.delete({ where: { id } });
  return c.json({ success: true });
});

export default router;
