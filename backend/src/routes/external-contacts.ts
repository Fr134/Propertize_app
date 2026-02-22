import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { auth, requireManager } from "../middleware/auth";
import { createExternalContactSchema } from "../lib/validators";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

// GET /api/external-contacts
router.get("/", auth, async (c) => {
  const category = c.req.query("category");
  const where: Record<string, unknown> = { is_active: true };
  if (category) where.category = category;

  const contacts = await prisma.externalContact.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return c.json(contacts);
});

// POST /api/external-contacts
router.post("/", auth, requireManager, async (c) => {
  const body = await c.req.json();
  const parsed = createExternalContactSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    data[key] = typeof value === "string" && value === "" ? null : value;
  }

  const contact = await prisma.externalContact.create({ data: data as never });
  return c.json(contact, 201);
});

// PATCH /api/external-contacts/:id
router.patch("/:id", auth, requireManager, async (c) => {
  const id = c.req.param("id");

  const existing = await prisma.externalContact.findUnique({ where: { id } });
  if (!existing) return c.json({ error: "Contatto non trovato" }, 404);

  const body = await c.req.json();
  const parsed = createExternalContactSchema.partial().safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    data[key] = typeof value === "string" && value === "" ? null : value;
  }

  const contact = await prisma.externalContact.update({
    where: { id },
    data,
  });

  return c.json(contact);
});

// DELETE /api/external-contacts/:id (soft delete)
router.delete("/:id", auth, requireManager, async (c) => {
  const id = c.req.param("id");

  const existing = await prisma.externalContact.findUnique({ where: { id } });
  if (!existing) return c.json({ error: "Contatto non trovato" }, 404);

  await prisma.externalContact.update({
    where: { id },
    data: { is_active: false },
  });

  return c.json({ ok: true });
});

export default router;
