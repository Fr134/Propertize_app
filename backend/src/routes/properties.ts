import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { auth, requireManager } from "../middleware/auth";
import { getPaginationParams, createPaginatedResponse } from "../lib/pagination";
import {
  createPropertySchema,
  createExpenseSchema,
} from "../lib/validators";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

// GET /api/properties
router.get("/", auth, async (c) => {
  const { page, limit, skip } = getPaginationParams(c);

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { tasks: true } },
        owner: { select: { id: true, name: true } },
      },
      take: limit,
      skip,
    }),
    prisma.property.count(),
  ]);

  return c.json(createPaginatedResponse(properties, total, page, limit));
});

// POST /api/properties
router.post("/", auth, requireManager, async (c) => {
  const body = await c.req.json();
  const parsed = createPropertySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const existing = await prisma.property.findUnique({
    where: { code: parsed.data.code },
  });
  if (existing) {
    return c.json({ error: "Esiste gia' un immobile con questo codice" }, 400);
  }

  const property = await prisma.property.create({
    data: {
      name: parsed.data.name,
      code: parsed.data.code,
      address: parsed.data.address,
      property_type: parsed.data.property_type,
      owner_id: parsed.data.owner_id || null,
    },
  });

  return c.json(property, 201);
});

// GET /api/properties/:id
router.get("/:id", auth, async (c) => {
  const id = c.req.param("id");

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      checklist_template: true,
      linen_inventory: { orderBy: [{ type: "asc" }, { status: "asc" }] },
    },
  });

  if (!property) return c.json({ error: "Immobile non trovato" }, 404);
  return c.json(property);
});

// GET /api/properties/:id/supplies
router.get("/:id/supplies", auth, async (c) => {
  const id = c.req.param("id");
  const supplies = await prisma.propertySupplyStock.findMany({
    where: { property_id: id },
    include: { supply_item: { select: { name: true, unit: true } } },
    orderBy: { supply_item: { name: "asc" } },
  });
  return c.json(supplies);
});

// GET /api/properties/:id/linen
router.get("/:id/linen", auth, async (c) => {
  const id = c.req.param("id");
  const linen = await prisma.linenInventory.findMany({
    where: { property_id: id },
    orderBy: [{ type: "asc" }, { status: "asc" }],
  });
  return c.json(linen);
});

// GET /api/properties/:id/expenses
router.get("/:id/expenses", auth, requireManager, async (c) => {
  const id = c.req.param("id");

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) return c.json({ error: "Immobile non trovato" }, 404);

  const expenses = await prisma.expense.findMany({
    where: { property_id: id },
    include: {
      author: { select: { id: true, first_name: true, last_name: true } },
      photos: { orderBy: { uploaded_at: "asc" } },
    },
    orderBy: { expense_date: "desc" },
  });

  return c.json(expenses);
});

// POST /api/properties/:id/expenses
router.post("/:id/expenses", auth, requireManager, async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) return c.json({ error: "Immobile non trovato" }, 404);

  const body = await c.req.json();
  const parsed = createExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const expense = await prisma.expense.create({
    data: {
      property_id: id,
      created_by: userId,
      description: parsed.data.description,
      amount: parsed.data.amount,
      vat_amount: parsed.data.vat_amount ?? null,
      expense_date: parsed.data.expense_date
        ? new Date(parsed.data.expense_date)
        : new Date(),
      is_billed: true,
      billed_at: new Date(),
    },
    include: {
      author: { select: { id: true, first_name: true, last_name: true } },
      photos: true,
    },
  });

  return c.json(expense, 201);
});

export default router;
