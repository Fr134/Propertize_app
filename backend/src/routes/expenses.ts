import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { auth, requireManager } from "../middleware/auth";
import { requirePermission } from "../middleware/permissions";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

const updateExpenseSchema = z.object({
  is_billed: z.boolean().optional(),
  is_paid: z.boolean().optional(),
});

// PATCH /api/expenses/:id
router.patch("/:id", auth, requireManager, requirePermission("can_manage_finance"), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) return c.json({ error: "Spesa non trovata" }, 404);

  const data: Record<string, unknown> = {};

  if (parsed.data.is_billed !== undefined) {
    data.is_billed = parsed.data.is_billed;
    data.billed_at = parsed.data.is_billed ? new Date() : null;
    if (!parsed.data.is_billed) {
      data.is_paid = false;
      data.paid_at = null;
    }
  }

  if (parsed.data.is_paid !== undefined) {
    const willBeBilled =
      data.is_billed !== undefined ? data.is_billed : expense.is_billed;
    if (parsed.data.is_paid && !willBeBilled) {
      return c.json(
        { error: "Non puoi segnare come pagata una spesa non fatturata" },
        400
      );
    }
    data.is_paid = parsed.data.is_paid;
    data.paid_at = parsed.data.is_paid ? new Date() : null;
  }

  const updated = await prisma.expense.update({
    where: { id },
    data,
    include: {
      author: { select: { id: true, first_name: true, last_name: true } },
      photos: { orderBy: { uploaded_at: "asc" } },
    },
  });

  return c.json(updated);
});

// POST /api/expenses/:id/photos
router.post("/:id/photos", auth, requireManager, requirePermission("can_manage_finance"), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { photoUrl } = body as { photoUrl: string };

  if (!photoUrl) return c.json({ error: "photoUrl richiesto" }, 400);

  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) return c.json({ error: "Spesa non trovata" }, 404);

  const count = await prisma.expensePhoto.count({ where: { expense_id: id } });
  if (count >= 10) return c.json({ error: "Massimo 10 foto per spesa" }, 400);

  const photo = await prisma.expensePhoto.create({
    data: { expense_id: id, photo_url: photoUrl },
  });

  return c.json(photo, 201);
});

export default router;
