import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { auth, requireManager } from "../middleware/auth";
import { createOwnerSchema, updateOwnerSchema } from "../lib/validators";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

// GET /api/owners
router.get("/", auth, requireManager, async (c) => {
  const owners = await prisma.owner.findMany({
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
    },
  });

  return c.json(owner, 201);
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
  if (!owner) return c.json({ error: "Proprietario non trovato" }, 404);

  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.email !== undefined) data.email = parsed.data.email || null;

  const updated = await prisma.owner.update({ where: { id }, data });
  return c.json(updated);
});

export default router;
