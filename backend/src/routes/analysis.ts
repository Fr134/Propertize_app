import { Hono } from "hono";
import { Resend } from "resend";
import ExcelJS from "exceljs";
import { prisma } from "../lib/prisma";
import { auth, requireManager } from "../middleware/auth";
import { requirePermission } from "../middleware/permissions";
import { submitAnalysisSchema, updateAnalysisSchema } from "../lib/validators";
import type { AppEnv } from "../types";
import type { AnalysisStatus } from "@prisma/client";

const router = new Hono<AppEnv>();

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}
const MANAGER_EMAIL = process.env.MANAGER_EMAIL || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "Propertize <onboarding@resend.dev>";

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APPARTAMENTO: "Appartamento",
  VILLA: "Villa",
  ALTRO: "Altro",
};

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

  const analysis = await prisma.propertyAnalysis.create({
    data: {
      lead_id: leadId,
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

  // Send email notification to manager
  const resendClient = getResend();
  if (MANAGER_EMAIL && resendClient) {
    try {
      await resendClient.emails.send({
        from: FROM_EMAIL,
        to: MANAGER_EMAIL,
        subject: `Nuova richiesta analisi — ${parsed.data.client_name} — ${parsed.data.property_address}`,
        html: `
          <h2>Nuova richiesta di analisi immobile</h2>
          <p><strong>Cliente:</strong> ${parsed.data.client_name}</p>
          <p><strong>Email:</strong> ${parsed.data.client_email}</p>
          ${parsed.data.client_phone ? `<p><strong>Telefono:</strong> ${parsed.data.client_phone}</p>` : ""}
          <hr/>
          <p><strong>Indirizzo:</strong> ${parsed.data.property_address}</p>
          <p><strong>Tipo:</strong> ${PROPERTY_TYPE_LABELS[parsed.data.property_type] ?? parsed.data.property_type}</p>
          <p><strong>Camere:</strong> ${parsed.data.bedroom_count} | <strong>Bagni:</strong> ${parsed.data.bathroom_count}</p>
          ${parsed.data.floor_area_sqm ? `<p><strong>Superficie:</strong> ${parsed.data.floor_area_sqm} mq</p>` : ""}
          ${parsed.data.current_use ? `<p><strong>Utilizzo attuale:</strong> ${parsed.data.current_use}</p>` : ""}
          <hr/>
          <p><a href="${process.env.FRONTEND_URL}/manager/crm/analisi/${analysis.id}">Visualizza nell'app</a></p>
        `,
      });
    } catch (err) {
      console.error("Failed to send manager notification email:", err);
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
      property_type: PROPERTY_TYPE_LABELS[a.property_type] ?? a.property_type,
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
    },
  });

  // Send email to client when completing
  if (isCompleting) {
    const resendForClient = getResend();
    if (resendForClient) try {
      const revenueText =
        updated.estimated_revenue_low && updated.estimated_revenue_high
          ? `€${Number(updated.estimated_revenue_low).toLocaleString("it-IT")} - €${Number(updated.estimated_revenue_high).toLocaleString("it-IT")}`
          : "Da definire";
      const occupancyText = updated.estimated_occupancy
        ? `${updated.estimated_occupancy}%`
        : "Da definire";

      await resendForClient.emails.send({
        from: FROM_EMAIL,
        to: updated.client_email,
        subject: "La tua analisi immobile è pronta — Propertize",
        html: `
          <h2>La tua analisi immobile è pronta!</h2>
          <p>Gentile ${updated.client_name},</p>
          <p>Abbiamo completato l'analisi del tuo immobile in <strong>${updated.property_address}</strong>.</p>
          <hr/>
          <h3>Riepilogo</h3>
          <p><strong>Revenue stimata annuale:</strong> ${revenueText}</p>
          <p><strong>Occupancy stimata:</strong> ${occupancyText}</p>
          ${updated.analysis_notes ? `<p><strong>Note:</strong> ${updated.analysis_notes}</p>` : ""}
          ${updated.analysis_file_url ? `<p><a href="${updated.analysis_file_url}">Scarica il documento di analisi</a></p>` : ""}
          <hr/>
          <p>Per qualsiasi domanda, non esitare a contattarci.</p>
          <p>Il team Propertize</p>
        `,
      });
    } catch (err) {
      console.error("Failed to send client completion email:", err);
    }
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
    },
  });

  return c.json(updated);
});

export default router;
