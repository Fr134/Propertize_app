import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { auth, requireManager } from "../middleware/auth";
import { createLeadSchema, updateLeadSchema, createCallSchema } from "../lib/validators";
import type { AppEnv } from "../types";
import type { LeadStatus } from "@prisma/client";

const router = new Hono<AppEnv>();

// GET /api/crm/leads
router.get("/leads", auth, async (c) => {
  const statusFilter = c.req.query("status") as LeadStatus | undefined;

  const where = statusFilter ? { status: statusFilter } : {};

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { created_at: "desc" },
    include: {
      _count: { select: { calls: true } },
      owner: { select: { id: true, name: true } },
    },
  });

  return c.json(leads);
});

// POST /api/crm/leads
router.post("/leads", auth, requireManager, async (c) => {
  const body = await c.req.json();
  const parsed = createLeadSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const lead = await prisma.lead.create({
    data: {
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      notes: parsed.data.notes || null,
      status: parsed.data.status,
      source: parsed.data.source,
      property_address: parsed.data.property_address || null,
      property_type: parsed.data.property_type ?? null,
      estimated_rooms: parsed.data.estimated_rooms ?? null,
    },
    include: {
      _count: { select: { calls: true } },
      owner: { select: { id: true, name: true } },
    },
  });

  return c.json(lead, 201);
});

// GET /api/crm/leads/:id
router.get("/leads/:id", auth, async (c) => {
  const id = c.req.param("id");

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      calls: { orderBy: { called_at: "desc" } },
      owner: { select: { id: true, name: true } },
      analyses: {
        orderBy: { submitted_at: "desc" },
        select: {
          id: true,
          client_name: true,
          property_address: true,
          status: true,
          submitted_at: true,
          sent_at: true,
        },
      },
    },
  });

  if (!lead) return c.json({ error: "Lead non trovato" }, 404);
  return c.json(lead);
});

// PATCH /api/crm/leads/:id
router.patch("/leads/:id", auth, requireManager, async (c) => {
  const id = c.req.param("id");

  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing) return c.json({ error: "Lead non trovato" }, 404);

  const body = await c.req.json();
  const parsed = updateLeadSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  // Block WON if not converted
  if (parsed.data.status === "WON" && !existing.owner_id) {
    return c.json(
      { error: "Converti il lead in proprietario prima di segnarlo come vinto" },
      400
    );
  }

  const updated = await prisma.lead.update({
    where: { id },
    data: {
      ...parsed.data,
      email: parsed.data.email !== undefined ? (parsed.data.email || null) : undefined,
      phone: parsed.data.phone !== undefined ? (parsed.data.phone || null) : undefined,
      notes: parsed.data.notes !== undefined ? (parsed.data.notes || null) : undefined,
      property_address: parsed.data.property_address !== undefined ? (parsed.data.property_address || null) : undefined,
    },
    include: {
      _count: { select: { calls: true } },
      owner: { select: { id: true, name: true } },
    },
  });

  return c.json(updated);
});

// DELETE /api/crm/leads/:id
router.delete("/leads/:id", auth, requireManager, async (c) => {
  const id = c.req.param("id");

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { _count: { select: { calls: true } } },
  });
  if (!lead) return c.json({ error: "Lead non trovato" }, 404);

  if (lead._count.calls > 0) {
    // Soft delete: set status to LOST
    await prisma.lead.update({ where: { id }, data: { status: "LOST" } });
    return c.json({ message: "Lead segnato come perso (ha chiamate collegate)" });
  }

  await prisma.lead.delete({ where: { id } });
  return c.json({ message: "Lead eliminato" });
});

// POST /api/crm/leads/:id/calls
router.post("/leads/:id/calls", auth, requireManager, async (c) => {
  const leadId = c.req.param("id");
  const userId = c.get("userId");

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return c.json({ error: "Lead non trovato" }, 404);

  const body = await c.req.json();
  const parsed = createCallSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const call = await prisma.call.create({
    data: {
      lead_id: leadId,
      notes: parsed.data.notes,
      called_at: parsed.data.called_at ? new Date(parsed.data.called_at) : new Date(),
      created_by: userId,
    },
  });

  return c.json(call, 201);
});

// POST /api/crm/leads/:id/convert
router.post("/leads/:id/convert", auth, requireManager, async (c) => {
  const id = c.req.param("id");

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return c.json({ error: "Lead non trovato" }, 404);

  if (lead.owner_id) {
    return c.json({ error: "Lead già convertito in proprietario" }, 400);
  }

  const result = await prisma.$transaction(async (tx) => {
    const owner = await tx.owner.create({
      data: {
        name: `${lead.first_name} ${lead.last_name}`,
        email: lead.email,
        phone: lead.phone,
      },
    });

    await tx.lead.update({
      where: { id },
      data: {
        owner_id: owner.id,
        status: "WON",
        converted_at: new Date(),
      },
    });

    return owner;
  });

  return c.json({ owner_id: result.id, owner_name: result.name });
});

export default router;
