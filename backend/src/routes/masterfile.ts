import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { auth, requireManager } from "../middleware/auth";
import {
  masterfileSchema,
  updatePropertyOperationalSchema,
  createInventoryItemSchema,
  updateInventoryItemSchema,
} from "../lib/validators";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

// ============================================
// Operational fields (on Property model)
// ============================================

// PATCH /api/masterfile/:propertyId/operational
router.patch("/:propertyId/operational", auth, requireManager, async (c) => {
  const propertyId = c.req.param("propertyId");

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return c.json({ error: "Immobile non trovato" }, 404);

  const body = await c.req.json();
  const parsed = updatePropertyOperationalSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  // Convert empty strings to null for optional fields
  const data: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    data[key] = value === "" ? null : (value as string);
  }

  const updated = await prisma.property.update({
    where: { id: propertyId },
    data,
  });

  return c.json(updated);
});

// GET /api/masterfile/:propertyId/operational
router.get("/:propertyId/operational", auth, async (c) => {
  const propertyId = c.req.param("propertyId");

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      name: true,
      code: true,
      wifi_network: true,
      wifi_password: true,
      door_code: true,
      alarm_code: true,
      gas_meter_location: true,
      water_shutoff: true,
      electricity_panel: true,
      trash_schedule: true,
      checkin_notes: true,
      checkout_notes: true,
      internal_notes: true,
      contract_url: true,
    },
  });

  if (!property) return c.json({ error: "Immobile non trovato" }, 404);
  return c.json(property);
});

// ============================================
// Masterfile (PropertyMasterFile model)
// ============================================

// GET /api/masterfile/:propertyId
router.get("/:propertyId", auth, async (c) => {
  const propertyId = c.req.param("propertyId");

  const masterfile = await prisma.propertyMasterFile.findUnique({
    where: { property_id: propertyId },
    include: {
      property: { select: { name: true, code: true } },
    },
  });

  if (!masterfile) return c.json({ error: "Masterfile non trovato" }, 404);
  return c.json(masterfile);
});

// POST /api/masterfile/:propertyId
router.post("/:propertyId", auth, requireManager, async (c) => {
  const propertyId = c.req.param("propertyId");

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return c.json({ error: "Immobile non trovato" }, 404);

  const body = await c.req.json();
  const parsed = masterfileSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  // Convert empty strings to null
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (typeof value === "string" && value === "") {
      data[key] = null;
    } else {
      data[key] = value;
    }
  }

  const masterfile = await prisma.propertyMasterFile.upsert({
    where: { property_id: propertyId },
    update: data,
    create: { property_id: propertyId, ...data },
  });

  return c.json(masterfile, 201);
});

// PATCH /api/masterfile/:propertyId (both manager and operator)
router.patch("/:propertyId", auth, async (c) => {
  const propertyId = c.req.param("propertyId");

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return c.json({ error: "Immobile non trovato" }, 404);

  const body = await c.req.json();
  const parsed = masterfileSchema.partial().safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const DATE_FIELDS = ["boiler_last_service", "fire_extinguisher_expiry"];

  // Convert empty strings to null, handle date fields
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (DATE_FIELDS.includes(key)) {
      data[key] = value && value !== "" ? new Date(value as string) : null;
    } else if (typeof value === "string" && value === "") {
      data[key] = null;
    } else {
      data[key] = value;
    }
  }

  const masterfile = await prisma.propertyMasterFile.upsert({
    where: { property_id: propertyId },
    update: data,
    create: { property_id: propertyId, ...data },
  });

  // Auto-complete onboarding step "masterfile_completed" if critical fields are filled
  if (property.owner_id) {
    const CRITICAL_FIELDS = ["wifi_ssid", "wifi_password", "lockbox_code", "access_type", "electricity_panel_location"];
    const mf = masterfile as Record<string, unknown>;
    const hasSupplier = !!(mf.supplier_plumber_name || mf.supplier_electrician_name || mf.supplier_cleaning_name);
    const criticalFilled = CRITICAL_FIELDS.filter((f) => mf[f] != null && mf[f] !== "").length;
    const isComplete = criticalFilled >= 3 && hasSupplier;

    const workflow = await prisma.onboardingWorkflow.findUnique({
      where: { owner_id: property.owner_id },
    });
    if (workflow) {
      const step = await prisma.onboardingStep.findUnique({
        where: { workflow_id_step_key: { workflow_id: workflow.id, step_key: "masterfile_completed" } },
      });
      if (step && step.status !== "COMPLETED" && step.status !== "SKIPPED" && isComplete) {
        await prisma.onboardingStep.update({
          where: { id: step.id },
          data: { status: "COMPLETED", completed_at: new Date() },
        });
      }
    }
  }

  return c.json(masterfile);
});

// ============================================
// Inventory (PropertyInventoryItem model)
// ============================================

// GET /api/masterfile/:propertyId/inventory
router.get("/:propertyId/inventory", auth, async (c) => {
  const propertyId = c.req.param("propertyId");

  const items = await prisma.propertyInventoryItem.findMany({
    where: { property_id: propertyId },
    orderBy: [{ room: "asc" }, { name: "asc" }],
  });

  // Group by room
  const grouped: Record<string, typeof items> = {};
  for (const item of items) {
    if (!grouped[item.room]) grouped[item.room] = [];
    grouped[item.room].push(item);
  }

  const result = Object.entries(grouped).map(([room, roomItems]) => ({
    room,
    items: roomItems,
  }));

  return c.json(result);
});

// POST /api/masterfile/:propertyId/inventory
router.post("/:propertyId/inventory", auth, requireManager, async (c) => {
  const propertyId = c.req.param("propertyId");

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return c.json({ error: "Immobile non trovato" }, 404);

  const body = await c.req.json();
  const parsed = createInventoryItemSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const data: Record<string, unknown> = { property_id: propertyId };
  for (const [key, value] of Object.entries(parsed.data)) {
    if (key === "purchase_date" || key === "warranty_expires") {
      data[key] = value && value !== "" ? new Date(value as string) : null;
    } else if (typeof value === "string" && value === "") {
      data[key] = null;
    } else {
      data[key] = value;
    }
  }

  const item = await prisma.propertyInventoryItem.create({ data: data as never });
  return c.json(item, 201);
});

// PATCH /api/masterfile/:propertyId/inventory/:itemId
router.patch("/:propertyId/inventory/:itemId", auth, requireManager, async (c) => {
  const propertyId = c.req.param("propertyId");
  const itemId = c.req.param("itemId");

  const existing = await prisma.propertyInventoryItem.findFirst({
    where: { id: itemId, property_id: propertyId },
  });
  if (!existing) return c.json({ error: "Oggetto non trovato" }, 404);

  const body = await c.req.json();
  const parsed = updateInventoryItemSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (key === "purchase_date" || key === "warranty_expires") {
      data[key] = value && value !== "" ? new Date(value as string) : null;
    } else if (typeof value === "string" && value === "") {
      data[key] = null;
    } else {
      data[key] = value;
    }
  }

  const item = await prisma.propertyInventoryItem.update({
    where: { id: itemId },
    data,
  });

  return c.json(item);
});

// DELETE /api/masterfile/:propertyId/inventory/:itemId
router.delete("/:propertyId/inventory/:itemId", auth, requireManager, async (c) => {
  const propertyId = c.req.param("propertyId");
  const itemId = c.req.param("itemId");

  const existing = await prisma.propertyInventoryItem.findFirst({
    where: { id: itemId, property_id: propertyId },
  });
  if (!existing) return c.json({ error: "Oggetto non trovato" }, 404);

  await prisma.propertyInventoryItem.delete({ where: { id: itemId } });
  return c.json({ ok: true });
});

export default router;
