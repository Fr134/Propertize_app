import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { auth, requireManager } from "../middleware/auth";
import { requirePermission } from "../middleware/permissions";
import { createLeadSchema, updateLeadSchema, createCallSchema, reassignSchema } from "../lib/validators";
import { DEFAULT_ONBOARDING_STEPS } from "../lib/onboarding-defaults";
import { getNextAssignee, incrementAssignmentCount, decrementAssignmentCount } from "../lib/assignment";
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
      assigned_to: { select: { id: true, first_name: true, last_name: true } },
    },
  });

  return c.json(leads);
});

// POST /api/crm/leads
router.post("/leads", auth, requireManager, requirePermission("can_manage_leads"), async (c) => {
  const body = await c.req.json();
  const parsed = createLeadSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  // Auto-assign via round-robin
  const assigneeId = await getNextAssignee("leads");

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
      assigned_to_id: assigneeId,
    },
    include: {
      _count: { select: { calls: true } },
      owner: { select: { id: true, name: true } },
      assigned_to: { select: { id: true, first_name: true, last_name: true } },
    },
  });

  if (assigneeId) {
    await incrementAssignmentCount(assigneeId, "leads");
  }

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
      assigned_to: { select: { id: true, first_name: true, last_name: true } },
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
router.patch("/leads/:id", auth, requireManager, requirePermission("can_manage_leads"), async (c) => {
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

  // Decrement assignment count when lead is marked as LOST
  const isBecomingLost =
    parsed.data.status === "LOST" && existing.status !== "LOST";

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
      assigned_to: { select: { id: true, first_name: true, last_name: true } },
    },
  });

  if (isBecomingLost && existing.assigned_to_id) {
    await decrementAssignmentCount(existing.assigned_to_id, "leads");
  }

  return c.json(updated);
});

// DELETE /api/crm/leads/:id
router.delete("/leads/:id", auth, requireManager, requirePermission("can_manage_leads"), async (c) => {
  const id = c.req.param("id");

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { _count: { select: { calls: true } } },
  });
  if (!lead) return c.json({ error: "Lead non trovato" }, 404);

  if (lead._count.calls > 0) {
    // Soft delete: set status to LOST
    await prisma.lead.update({ where: { id }, data: { status: "LOST" } });
    if (lead.assigned_to_id) {
      await decrementAssignmentCount(lead.assigned_to_id, "leads");
    }
    return c.json({ message: "Lead segnato come perso (ha chiamate collegate)" });
  }

  if (lead.assigned_to_id) {
    await decrementAssignmentCount(lead.assigned_to_id, "leads");
  }
  await prisma.lead.delete({ where: { id } });
  return c.json({ message: "Lead eliminato" });
});

// POST /api/crm/leads/:id/calls
router.post("/leads/:id/calls", auth, requireManager, requirePermission("can_manage_leads"), async (c) => {
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
router.post("/leads/:id/convert", auth, requireManager, requirePermission("can_manage_leads"), async (c) => {
  const id = c.req.param("id");

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return c.json({ error: "Lead non trovato" }, 404);

  if (lead.owner_id) {
    return c.json({ error: "Lead già convertito in proprietario" }, 400);
  }

  // Auto-assign onboarding via round-robin
  const onboardingAssigneeId = await getNextAssignee("onboarding");

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

    // Auto-start onboarding workflow
    await tx.onboardingWorkflow.create({
      data: {
        owner_id: owner.id,
        assigned_to_id: onboardingAssigneeId,
        steps: {
          create: DEFAULT_ONBOARDING_STEPS.map((s) => ({
            step_key: s.step_key,
            label: s.label,
            description: s.description,
            order: s.order,
          })),
        },
      },
    });

    // Auto-create onboarding file for the owner
    await tx.onboardingFile.create({
      data: {
        owner_id: owner.id,
        owner_email: lead.email || undefined,
        owner_phone: lead.phone || undefined,
        owner_first_name: lead.first_name,
        owner_last_name: lead.last_name,
      },
    });

    return owner;
  });

  if (onboardingAssigneeId) {
    await incrementAssignmentCount(onboardingAssigneeId, "onboarding");
  }

  // Decrement leads count since lead is now WON/converted
  if (lead.assigned_to_id) {
    await decrementAssignmentCount(lead.assigned_to_id, "leads");
  }

  return c.json({ owner_id: result.id, owner_name: result.name });
});

// PATCH /api/crm/leads/:id/reassign (MANAGER only)
router.patch("/leads/:id/reassign", auth, requireManager, requirePermission("can_manage_leads"), async (c) => {
  const id = c.req.param("id");

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return c.json({ error: "Lead non trovato" }, 404);

  const body = await c.req.json();
  const parsed = reassignSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  // Verify target user exists and has permission
  const targetUser = await prisma.user.findUnique({
    where: { id: parsed.data.assigned_to_id },
  });
  if (!targetUser || !targetUser.active || targetUser.role !== "MANAGER") {
    return c.json({ error: "Utente non valido" }, 400);
  }
  if (!targetUser.is_super_admin && !targetUser.can_manage_leads) {
    return c.json({ error: "L'utente non ha il permesso CRM" }, 400);
  }

  // Decrement old assignee count
  if (lead.assigned_to_id) {
    await decrementAssignmentCount(lead.assigned_to_id, "leads");
  }

  // Assign to new user
  const updated = await prisma.lead.update({
    where: { id },
    data: { assigned_to_id: parsed.data.assigned_to_id },
    include: {
      _count: { select: { calls: true } },
      owner: { select: { id: true, name: true } },
      assigned_to: { select: { id: true, first_name: true, last_name: true } },
    },
  });

  await incrementAssignmentCount(parsed.data.assigned_to_id, "leads");

  return c.json(updated);
});

export default router;
