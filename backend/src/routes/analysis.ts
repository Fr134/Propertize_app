import { Hono } from "hono";
import ExcelJS from "exceljs";
import { prisma } from "../lib/prisma";
import { auth, requireManager } from "../middleware/auth";
import { requirePermission } from "../middleware/permissions";
import { submitAnalysisSchema, updateAnalysisSchema, reassignSchema } from "../lib/validators";
import { getNextAssignee, incrementAssignmentCount, decrementAssignmentCount } from "../lib/assignment";
import { sendEmail, MANAGER_EMAIL, translatePropertyType } from "../lib/email";
import { newAnalysisSubmitted, analysisCompleted } from "../lib/email-templates";
import type { AppEnv } from "../types";
import type { AnalysisStatus } from "@prisma/client";

const router = new Hono<AppEnv>();

// POST /api/analysis/submit (PUBLIC — no auth)
router.post("/submit", async (c) => {
  const body = await c.req.json();
  const parsed = submitAnalysisSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const leadId = c.req.query("lead_id") || null;

  // Validate lead_id if provided
  if (leadId) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return c.json({ error: "Lead non trovato" }, 400);
    }
  }

  // Auto-assign via round-robin
  const assigneeId = await getNextAssignee("analysis");

  const analysis = await prisma.propertyAnalysis.create({
    data: {
      lead_id: leadId,
      assigned_to_id: assigneeId,
      client_name: parsed.data.client_name,
      client_email: parsed.data.client_email,
      client_phone: parsed.data.client_phone || null,
      property_address: parsed.data.property_address,
      property_type: parsed.data.property_type,
      bedroom_count: parsed.data.bedroom_count,
      bathroom_count: parsed.data.bathroom_count,
      floor_area_sqm: parsed.data.floor_area_sqm ?? null,
      has_pool: parsed.data.has_pool,
      has_parking: parsed.data.has_parking,
      has_terrace: parsed.data.has_terrace,
      current_use: parsed.data.current_use || null,
      availability_notes: parsed.data.availability_notes || null,
      additional_notes: parsed.data.additional_notes || null,
    },
  });

  if (assigneeId) {
    await incrementAssignmentCount(assigneeId, "analysis");
  }

  // Send email notification to manager + assignee
  if (MANAGER_EMAIL) {
    let assigneeName: string | null = null;
    let assigneeEmail: string | null = null;
    if (assigneeId) {
      const a = await prisma.user.findUnique({
        where: { id: assigneeId },
        select: { first_name: true, last_name: true, email: true },
      });
      if (a) {
        assigneeName = `${a.first_name} ${a.last_name}`;
        assigneeEmail = a.email;
      }
    }
    const tpl = newAnalysisSubmitted({
      clientName: parsed.data.client_name,
      clientEmail: parsed.data.client_email,
      clientPhone: parsed.data.client_phone || null,
      propertyAddress: parsed.data.property_address,
      propertyType: parsed.data.property_type,
      bedroomCount: parsed.data.bedroom_count,
      bathroomCount: parsed.data.bathroom_count,
      floorAreaSqm: parsed.data.floor_area_sqm ?? null,
      currentUse: parsed.data.current_use || null,
      analysisId: analysis.id,
      assigneeName,
    });
    sendEmail({ to: MANAGER_EMAIL, ...tpl });
    if (assigneeEmail && assigneeEmail !== MANAGER_EMAIL) {
      sendEmail({ to: assigneeEmail, ...tpl });
    }
  }

  return c.json({ success: true, token: analysis.token }, 201);
});

// GET /api/analysis (MANAGER only)
router.get("/", auth, requireManager, async (c) => {
  const statusFilter = c.req.query("status") as AnalysisStatus | undefined;
  const where = statusFilter ? { status: statusFilter } : {};

  const analyses = await prisma.propertyAnalysis.findMany({
    where,
    orderBy: { submitted_at: "desc" },
    include: {
      lead: { select: { id: true, first_name: true, last_name: true } },
      assigned_to: { select: { id: true, first_name: true, last_name: true } },
    },
  });

  return c.json(analyses);
});

// GET /api/analysis/export (MANAGER only) — must be before /:id
router.get("/export", auth, requireManager, async (c) => {
  const analyses = await prisma.propertyAnalysis.findMany({
    orderBy: { submitted_at: "desc" },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Analisi Immobili");

  sheet.columns = [
    { header: "Data invio", key: "submitted_at", width: 14 },
    { header: "Nome cliente", key: "client_name", width: 22 },
    { header: "Email", key: "client_email", width: 25 },
    { header: "Telefono", key: "client_phone", width: 16 },
    { header: "Indirizzo", key: "property_address", width: 30 },
    { header: "Tipo", key: "property_type", width: 14 },
    { header: "Camere", key: "bedroom_count", width: 9 },
    { header: "Bagni", key: "bathroom_count", width: 9 },
    { header: "mq", key: "floor_area_sqm", width: 9 },
    { header: "Piscina", key: "has_pool", width: 9 },
    { header: "Parcheggio", key: "has_parking", width: 11 },
    { header: "Revenue min", key: "estimated_revenue_low", width: 13 },
    { header: "Revenue max", key: "estimated_revenue_high", width: 13 },
    { header: "Occupancy%", key: "estimated_occupancy", width: 12 },
    { header: "Fee%", key: "propertize_fee", width: 8 },
    { header: "Stato", key: "status", width: 14 },
  ];

  const STATUS_LABELS: Record<string, string> = {
    PENDING: "In attesa",
    IN_PROGRESS: "In lavorazione",
    COMPLETED: "Completata",
  };

  for (const a of analyses) {
    sheet.addRow({
      submitted_at: new Date(a.submitted_at).toLocaleDateString("it-IT"),
      client_name: a.client_name,
      client_email: a.client_email,
      client_phone: a.client_phone ?? "",
      property_address: a.property_address,
      property_type: translatePropertyType(a.property_type),
      bedroom_count: a.bedroom_count,
      bathroom_count: a.bathroom_count,
      floor_area_sqm: a.floor_area_sqm ?? "",
      has_pool: a.has_pool ? "Sì" : "No",
      has_parking: a.has_parking ? "Sì" : "No",
      estimated_revenue_low: a.estimated_revenue_low ? Number(a.estimated_revenue_low) : "",
      estimated_revenue_high: a.estimated_revenue_high ? Number(a.estimated_revenue_high) : "",
      estimated_occupancy: a.estimated_occupancy ?? "",
      propertize_fee: a.propertize_fee ? Number(a.propertize_fee) : "",
      status: STATUS_LABELS[a.status] ?? a.status,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  c.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  c.header("Content-Disposition", 'attachment; filename="analisi-immobili.xlsx"');
  return c.body(buffer as ArrayBuffer);
});

// GET /api/analysis/:id (MANAGER only)
router.get("/:id", auth, requireManager, async (c) => {
  const id = c.req.param("id");

  const analysis = await prisma.propertyAnalysis.findUnique({
    where: { id },
    include: {
      lead: { select: { id: true, first_name: true, last_name: true } },
      assigned_to: { select: { id: true, first_name: true, last_name: true } },
    },
  });

  if (!analysis) return c.json({ error: "Analisi non trovata" }, 404);
  return c.json(analysis);
});

// PATCH /api/analysis/:id (MANAGER only)
router.patch("/:id", auth, requireManager, requirePermission("can_do_analysis"), async (c) => {
  const id = c.req.param("id");

  const existing = await prisma.propertyAnalysis.findUnique({ where: { id } });
  if (!existing) return c.json({ error: "Analisi non trovata" }, 404);

  const body = await c.req.json();
  const parsed = updateAnalysisSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const isCompleting = parsed.data.status === "COMPLETED" && existing.status !== "COMPLETED";

  const updated = await prisma.propertyAnalysis.update({
    where: { id },
    data: {
      estimated_revenue_low: parsed.data.estimated_revenue_low,
      estimated_revenue_high: parsed.data.estimated_revenue_high,
      estimated_occupancy: parsed.data.estimated_occupancy,
      propertize_fee: parsed.data.propertize_fee,
      analysis_notes: parsed.data.analysis_notes !== undefined ? (parsed.data.analysis_notes || null) : undefined,
      analysis_file_url: parsed.data.analysis_file_url !== undefined ? (parsed.data.analysis_file_url || null) : undefined,
      status: parsed.data.status,
      ...(isCompleting ? { completed_at: new Date(), sent_at: new Date() } : {}),
    },
    include: {
      lead: { select: { id: true, first_name: true, last_name: true } },
      assigned_to: { select: { id: true, first_name: true, last_name: true } },
    },
  });

  // Send email to client when completing
  if (isCompleting) {
    const tpl = analysisCompleted({
      clientName: updated.client_name,
      propertyAddress: updated.property_address,
      estimatedRevenueLow: updated.estimated_revenue_low ? Number(updated.estimated_revenue_low) : null,
      estimatedRevenueHigh: updated.estimated_revenue_high ? Number(updated.estimated_revenue_high) : null,
      estimatedOccupancy: updated.estimated_occupancy,
      analysisNotes: updated.analysis_notes ?? null,
      analysisFileUrl: updated.analysis_file_url ?? null,
    });
    sendEmail({ to: updated.client_email, ...tpl });
  }

  return c.json(updated);
});

// POST /api/analysis/:id/link-lead (MANAGER only)
router.post("/:id/link-lead", auth, requireManager, requirePermission("can_do_analysis"), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const leadId = body.lead_id;

  if (!leadId) return c.json({ error: "lead_id obbligatorio" }, 400);

  const analysis = await prisma.propertyAnalysis.findUnique({ where: { id } });
  if (!analysis) return c.json({ error: "Analisi non trovata" }, 404);

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return c.json({ error: "Lead non trovato" }, 404);

  const updated = await prisma.propertyAnalysis.update({
    where: { id },
    data: { lead_id: leadId },
    include: {
      lead: { select: { id: true, first_name: true, last_name: true } },
      assigned_to: { select: { id: true, first_name: true, last_name: true } },
    },
  });

  return c.json(updated);
});

// PATCH /api/analysis/:id/reassign (MANAGER only)
router.patch("/:id/reassign", auth, requireManager, requirePermission("can_do_analysis"), async (c) => {
  const id = c.req.param("id");

  const analysis = await prisma.propertyAnalysis.findUnique({ where: { id } });
  if (!analysis) return c.json({ error: "Analisi non trovata" }, 404);

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
  if (!targetUser.is_super_admin && !targetUser.can_do_analysis) {
    return c.json({ error: "L'utente non ha il permesso Analisi" }, 400);
  }

  // Decrement old assignee count
  if (analysis.assigned_to_id) {
    await decrementAssignmentCount(analysis.assigned_to_id, "analysis");
  }

  // Assign to new user
  const updated = await prisma.propertyAnalysis.update({
    where: { id },
    data: { assigned_to_id: parsed.data.assigned_to_id },
    include: {
      lead: { select: { id: true, first_name: true, last_name: true } },
      assigned_to: { select: { id: true, first_name: true, last_name: true } },
    },
  });

  await incrementAssignmentCount(parsed.data.assigned_to_id, "analysis");

  return c.json(updated);
});

export default router;
