import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { auth, requireManager } from "../middleware/auth";
import { createOwnerSchema, updateOwnerSchema } from "../lib/validators";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

// GET /api/owners
router.get("/", auth, requireManager, async (c) => {
  const status = c.req.query("status");

  const where: Record<string, unknown> = {
    status: { not: "deleted" },
  };
  if (status === "active" || status === "inactive") {
    where.status = status;
  }

  const owners = await prisma.owner.findMany({
    where,
    orderBy: { name: "asc" },
    include: { _count: { select: { properties: true } } },
  });

  return c.json(owners);
});

// POST /api/owners
router.post("/", auth, requireManager, async (c) => {
  const body = await c.req.json();
  const parsed = createOwnerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const owner = await prisma.owner.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      fiscal_code: parsed.data.fiscal_code || null,
      iban: parsed.data.iban || null,
      notes: parsed.data.notes || null,
    },
  });

  return c.json(owner, 201);
});

// GET /api/owners/:id
router.get("/:id", auth, requireManager, async (c) => {
  const id = c.req.param("id");

  const owner = await prisma.owner.findUnique({
    where: { id },
    include: {
      properties: {
        select: { id: true, name: true, code: true, active: true },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!owner || owner.status === "deleted") {
    return c.json({ error: "Proprietario non trovato" }, 404);
  }

  return c.json(owner);
});

// PATCH /api/owners/:id
router.patch("/:id", auth, requireManager, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateOwnerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const owner = await prisma.owner.findUnique({ where: { id } });
  if (!owner || owner.status === "deleted") {
    return c.json({ error: "Proprietario non trovato" }, 404);
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.email !== undefined) data.email = parsed.data.email || null;
  if (parsed.data.phone !== undefined) data.phone = parsed.data.phone || null;
  if (parsed.data.address !== undefined) data.address = parsed.data.address || null;
  if (parsed.data.fiscal_code !== undefined) data.fiscal_code = parsed.data.fiscal_code || null;
  if (parsed.data.iban !== undefined) data.iban = parsed.data.iban || null;
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes || null;

  const updated = await prisma.owner.update({
    where: { id },
    data,
    include: {
      properties: {
        select: { id: true, name: true, code: true, active: true },
        orderBy: { name: "asc" },
      },
    },
  });

  return c.json(updated);
});

// DELETE /api/owners/:id (soft delete)
router.delete("/:id", auth, requireManager, async (c) => {
  const id = c.req.param("id");

  const owner = await prisma.owner.findUnique({
    where: { id },
    include: { properties: { where: { active: true }, select: { id: true } } },
  });

  if (!owner || owner.status === "deleted") {
    return c.json({ error: "Proprietario non trovato" }, 404);
  }

  if (owner.properties.length > 0) {
    return c.json({ error: "Impossibile eliminare un proprietario con immobili attivi" }, 400);
  }

  await prisma.owner.update({
    where: { id },
    data: { status: "deleted" },
  });

  return c.json({ success: true });
});

export default router;
