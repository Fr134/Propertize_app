import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { auth, requireManager } from "../middleware/auth";
import { getPaginationParams, createPaginatedResponse } from "../lib/pagination";
import {
  createSupplyItemSchema,
  updateSupplyItemSchema,
  adjustStockSchema,
  createPurchaseOrderSchema,
  receivePurchaseOrderSchema,
} from "../lib/validators";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

// GET /api/inventory/items
router.get("/items", auth, async (c) => {
  const active = c.req.query("active");
  const search = c.req.query("search");

  const where: Record<string, unknown> = {};
  if (active === "true") where.is_active = true;
  if (search) where.name = { contains: search, mode: "insensitive" };

  const items = await prisma.supplyItem.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return c.json(items);
});

// POST /api/inventory/items
router.post("/items", auth, requireManager, async (c) => {
  const body = await c.req.json();
  const parsed = createSupplyItemSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const item = await prisma.supplyItem.create({
    data: {
      name: parsed.data.name,
      sku: parsed.data.sku || null,
      unit: parsed.data.unit,
      balance: { create: { qty_on_hand: 0, reorder_point: 0 } },
    },
    include: { balance: true },
  });

  return c.json(item, 201);
});

// PATCH /api/inventory/items/:id
router.patch("/items/:id", auth, requireManager, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateSupplyItemSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const existing = await prisma.supplyItem.findUnique({ where: { id } });
  if (!existing) return c.json({ error: "Articolo non trovato" }, 404);

  const item = await prisma.supplyItem.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.sku !== undefined && { sku: parsed.data.sku || null }),
      ...(parsed.data.unit !== undefined && { unit: parsed.data.unit }),
      ...(parsed.data.is_active !== undefined && { is_active: parsed.data.is_active }),
    },
  });

  return c.json(item);
});

// GET /api/inventory/stock
router.get("/stock", auth, requireManager, async (c) => {
  const low = c.req.query("low");

  const balances = await prisma.inventoryBalance.findMany({
    include: { supply_item: true },
    orderBy: { supply_item: { name: "asc" } },
  });

  const result =
    low === "true"
      ? balances.filter((b) => b.reorder_point > 0 && b.qty_on_hand <= b.reorder_point)
      : balances;

  return c.json(result);
});

// PATCH /api/inventory/stock/:supplyItemId
router.patch("/stock/:supplyItemId", auth, requireManager, async (c) => {
  const supplyItemId = c.req.param("supplyItemId");
  const userId = c.get("userId");
  const body = await c.req.json();
  const parsed = adjustStockSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const item = await prisma.supplyItem.findUnique({ where: { id: supplyItemId } });
  if (!item) return c.json({ error: "Articolo non trovato" }, 404);

  const currentBalance = await prisma.inventoryBalance.findUnique({
    where: { supply_item_id: supplyItemId },
  });
  const currentQty = currentBalance?.qty_on_hand ?? 0;
  const delta = parsed.data.qty_on_hand - currentQty;

  const result = await prisma.$transaction(async (tx) => {
    if (delta !== 0) {
      await tx.inventoryTransaction.create({
        data: {
          supply_item_id: supplyItemId,
          type: "ADJUSTMENT",
          qty: delta,
          notes:
            parsed.data.notes ||
            `Rettifica manuale: ${currentQty} → ${parsed.data.qty_on_hand}`,
          created_by: userId,
        },
      });
    }

    return tx.inventoryBalance.upsert({
      where: { supply_item_id: supplyItemId },
      update: {
        qty_on_hand: parsed.data.qty_on_hand,
        ...(parsed.data.reorder_point !== undefined && {
          reorder_point: parsed.data.reorder_point,
        }),
      },
      create: {
        supply_item_id: supplyItemId,
        qty_on_hand: parsed.data.qty_on_hand,
        reorder_point: parsed.data.reorder_point ?? 0,
      },
    });
  });

  return c.json(result);
});

// GET /api/inventory/transactions
router.get("/transactions", auth, requireManager, async (c) => {
  const { page, limit, skip } = getPaginationParams(c);
  const supplyItemId = c.req.query("supply_item_id");
  const type = c.req.query("type");
  const from = c.req.query("from");
  const to = c.req.query("to");

  const where: Record<string, unknown> = {};
  if (supplyItemId) where.supply_item_id = supplyItemId;
  if (type) where.type = type;
  if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);
    where.created_at = dateFilter;
  }

  const [transactions, total] = await Promise.all([
    prisma.inventoryTransaction.findMany({
      where,
      include: { supply_item: { select: { name: true, unit: true } } },
      orderBy: { created_at: "desc" },
      take: limit,
      skip,
    }),
    prisma.inventoryTransaction.count({ where }),
  ]);

  return c.json(createPaginatedResponse(transactions, total, page, limit));
});

// GET /api/inventory/consumption
router.get("/consumption", auth, requireManager, async (c) => {
  const from = c.req.query("from");
  const to = c.req.query("to");

  const where: Record<string, unknown> = { type: "CONSUMPTION_OUT" };
  if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);
    where.created_at = dateFilter;
  }

  const transactions = await prisma.inventoryTransaction.findMany({
    where,
    include: { supply_item: { select: { name: true, unit: true } } },
  });

  const grouped = new Map<
    string,
    {
      supply_item_id: string;
      name: string;
      unit: string;
      total_qty: number;
      tx_count: number;
    }
  >();

  for (const tx of transactions) {
    const existing = grouped.get(tx.supply_item_id);
    if (existing) {
      existing.total_qty += Math.abs(tx.qty);
      existing.tx_count += 1;
    } else {
      grouped.set(tx.supply_item_id, {
        supply_item_id: tx.supply_item_id,
        name: tx.supply_item.name,
        unit: tx.supply_item.unit,
        total_qty: Math.abs(tx.qty),
        tx_count: 1,
      });
    }
  }

  return c.json(Array.from(grouped.values()));
});

// GET /api/inventory/forecast
router.get("/forecast", auth, requireManager, async (c) => {
  const days = Math.max(1, parseInt(c.req.query("days") || "30", 10));
  const since = new Date();
  since.setDate(since.getDate() - days);

  const items = await prisma.supplyItem.findMany({
    where: { is_active: true },
    include: { balance: true },
  });

  const transactions = await prisma.inventoryTransaction.findMany({
    where: { type: "CONSUMPTION_OUT", created_at: { gte: since } },
  });

  const consumptionMap = new Map<string, number>();
  for (const tx of transactions) {
    const current = consumptionMap.get(tx.supply_item_id) ?? 0;
    consumptionMap.set(tx.supply_item_id, current + Math.abs(tx.qty));
  }

  const forecast = items.map((item) => {
    const totalConsumed = consumptionMap.get(item.id) ?? 0;
    const avgDaily = totalConsumed / days;
    const qtyOnHand = item.balance?.qty_on_hand ?? 0;
    const reorderPoint = item.balance?.reorder_point ?? 0;
    const daysRemaining = avgDaily > 0 ? Math.floor(qtyOnHand / avgDaily) : null;

    return {
      supply_item_id: item.id,
      name: item.name,
      unit: item.unit,
      qty_on_hand: qtyOnHand,
      reorder_point: reorderPoint,
      total_consumed: totalConsumed,
      avg_daily: Math.round(avgDaily * 100) / 100,
      days_remaining: daysRemaining,
      needs_reorder: qtyOnHand <= reorderPoint,
    };
  });

  return c.json(forecast);
});

// GET /api/inventory/orders
router.get("/orders", auth, requireManager, async (c) => {
  const { page, limit, skip } = getPaginationParams(c);
  const status = c.req.query("status");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      include: {
        lines: {
          include: { supply_item: { select: { name: true, unit: true } } },
        },
      },
      orderBy: { created_at: "desc" },
      take: limit,
      skip,
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return c.json(createPaginatedResponse(orders, total, page, limit));
});

// POST /api/inventory/orders
router.post("/orders", auth, requireManager, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const parsed = createPurchaseOrderSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const { order_ref, notes, lines } = parsed.data;

  const order = await prisma.purchaseOrder.create({
    data: {
      order_ref: order_ref || null,
      notes: notes || null,
      created_by: userId,
      lines: {
        create: lines.map((l) => ({
          supply_item_id: l.supply_item_id,
          qty_ordered: l.qty_ordered,
          unit_cost: l.unit_cost ?? null,
        })),
      },
    },
    include: {
      lines: {
        include: { supply_item: { select: { name: true, unit: true } } },
      },
    },
  });

  return c.json(order, 201);
});

// GET /api/inventory/orders/:id
router.get("/orders/:id", auth, requireManager, async (c) => {
  const id = c.req.param("id");

  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      lines: {
        include: { supply_item: { select: { name: true, unit: true } } },
      },
    },
  });

  if (!order) return c.json({ error: "Ordine non trovato" }, 404);
  return c.json(order);
});

// PATCH /api/inventory/orders/:id
router.patch("/orders/:id", auth, requireManager, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { status } = body;

  if (!["DRAFT", "ORDERED", "CANCELLED"].includes(status)) {
    return c.json({ error: "Stato non valido. Usa DRAFT, ORDERED o CANCELLED." }, 400);
  }

  const order = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!order) return c.json({ error: "Ordine non trovato" }, 404);

  const data: Record<string, unknown> = { status };
  if (status === "ORDERED") data.ordered_at = new Date();

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data,
    include: {
      lines: {
        include: { supply_item: { select: { name: true, unit: true } } },
      },
    },
  });

  return c.json(updated);
});

// POST /api/inventory/orders/:id/receive
router.post("/orders/:id/receive", auth, requireManager, async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");
  const body = await c.req.json();
  const parsed = receivePurchaseOrderSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { lines: true },
  });

  if (!order) return c.json({ error: "Ordine non trovato" }, 404);
  if (order.status === "RECEIVED") return c.json({ error: "Ordine già ricevuto" }, 400);
  if (order.status === "CANCELLED") return c.json({ error: "Ordine annullato" }, 400);

  const result = await prisma.$transaction(async (tx) => {
    for (const rl of parsed.data.lines) {
      const orderLine = order.lines.find(
        (l) => l.supply_item_id === rl.supply_item_id
      );
      if (!orderLine) continue;

      await tx.purchaseOrderLine.update({
        where: { id: orderLine.id },
        data: { qty_received: rl.qty_received },
      });

      if (rl.qty_received <= 0) continue;

      await tx.inventoryTransaction.create({
        data: {
          supply_item_id: rl.supply_item_id,
          type: "PURCHASE_IN",
          qty: rl.qty_received,
          reference_id: id,
          notes: `Ricevuto da ordine ${order.order_ref || id}`,
          created_by: userId,
        },
      });

      await tx.inventoryBalance.upsert({
        where: { supply_item_id: rl.supply_item_id },
        update: { qty_on_hand: { increment: rl.qty_received } },
        create: {
          supply_item_id: rl.supply_item_id,
          qty_on_hand: rl.qty_received,
          reorder_point: 0,
        },
      });
    }

    return tx.purchaseOrder.update({
      where: { id },
      data: { status: "RECEIVED", received_at: new Date() },
      include: {
        lines: {
          include: { supply_item: { select: { name: true, unit: true } } },
        },
      },
    });
  });

  return c.json(result);
});

export default router;
