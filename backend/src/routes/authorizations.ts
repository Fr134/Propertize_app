import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { auth, requireManager } from "../middleware/auth";
import { requirePermission } from "../middleware/permissions";
import { compilePdf } from "../lib/pdf-compiler";
import { detectLocation } from "../lib/location-detector";
import { sendEmail, MANAGER_EMAIL, FRONTEND_URL, FROM_EMAIL } from "../lib/email";
import { UTApi } from "uploadthing/server";
import { Resend } from "resend";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const REQUIRED_SUBMIT_FIELDS = [
  "cognome",
  "nome",
  "nato_a",
  "nato_prov",
  "nato_il",
  "codice_fiscale",
  "residente_a",
  "residente_cap",
  "indirizzo_res",
  "telefono",
  "email",
  "ruolo",
  "immobile_via",
  "immobile_n",
  "immobile_indirizzo",
  "immobile_comune",
  "immobile_cap",
  "immobile_prov",
  "foglio",
  "particella",
  "n_camere",
  "n_bagni",
  "n_posti_letto",
  "periodo_disponibilita",
] as const;

function getUtApi(): UTApi {
  return new UTApi();
}

// ---------------------------------------------------------------------------
// PUBLIC — token-based (no auth)
// ---------------------------------------------------------------------------

// GET /api/authorizations/token/:token
router.get("/token/:token", async (c) => {
  const token = c.req.param("token");

  const form = await prisma.authorizationForm.findUnique({
    where: { token },
    include: { owner: { select: { name: true } } },
  });

  if (!form) return c.json({ error: "Modulo non trovato" }, 404);

  const { owner, ...formData } = form;
  return c.json({ ...formData, owner_name: owner.name });
});

// PATCH /api/authorizations/token/:token — partial save
router.patch("/token/:token", async (c) => {
  const token = c.req.param("token");
  const body = await c.req.json();

  const form = await prisma.authorizationForm.findUnique({ where: { token } });
  if (!form) return c.json({ error: "Modulo non trovato" }, 404);
  if (form.submitted_at) return c.json({ error: "Modulo già inviato" }, 400);

  // Build update data from known fields only
  const allowed = [
    "cognome", "nome", "nato_a", "nato_prov", "nato_il",
    "codice_fiscale", "residente_a", "residente_cap", "indirizzo_res",
    "telefono", "email", "pec", "ruolo",
    "immobile_via", "immobile_n", "immobile_indirizzo", "immobile_n2",
    "immobile_piano", "immobile_comune", "immobile_cap", "immobile_prov",
    "sezione", "foglio", "particella", "sub", "categoria",
    "denominazione", "n_camere", "n_bagni", "n_posti_letto",
    "periodo_disponibilita", "luogo_data",
  ];

  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  // Coerce types for Prisma
  if (data.nato_il && typeof data.nato_il === "string") {
    data.nato_il = new Date(data.nato_il as string);
  }
  for (const intField of ["n_camere", "n_bagni", "n_posti_letto"]) {
    if (intField in data && data[intField] !== null && data[intField] !== undefined) {
      data[intField] = parseInt(String(data[intField]), 10) || null;
    }
  }

  await prisma.authorizationForm.update({ where: { token }, data });

  return c.json({ saved: true });
});

// POST /api/authorizations/token/:token/submit
router.post("/token/:token/submit", async (c) => {
  const token = c.req.param("token");
  const body = await c.req.json();

  const form = await prisma.authorizationForm.findUnique({
    where: { token },
    include: { owner: { select: { id: true, name: true } } },
  });
  if (!form) return c.json({ error: "Modulo non trovato" }, 404);
  if (form.submitted_at) return c.json({ error: "Modulo già inviato" }, 400);

  // Merge body into existing form data for validation
  const merged: Record<string, unknown> = {};
  const formFields = [
    "cognome", "nome", "nato_a", "nato_prov", "nato_il",
    "codice_fiscale", "residente_a", "residente_cap", "indirizzo_res",
    "telefono", "email", "pec", "ruolo",
    "immobile_via", "immobile_n", "immobile_indirizzo", "immobile_n2",
    "immobile_piano", "immobile_comune", "immobile_cap", "immobile_prov",
    "sezione", "foglio", "particella", "sub", "categoria",
    "denominazione", "n_camere", "n_bagni", "n_posti_letto",
    "periodo_disponibilita", "luogo_data",
  ];
  for (const key of formFields) {
    merged[key] = body[key] ?? (form as Record<string, unknown>)[key] ?? null;
  }

  // Coerce types for Prisma
  if (merged.nato_il && typeof merged.nato_il === "string") {
    merged.nato_il = new Date(merged.nato_il as string);
  }
  for (const intField of ["n_camere", "n_bagni", "n_posti_letto"]) {
    if (merged[intField] !== null && merged[intField] !== undefined) {
      merged[intField] = parseInt(String(merged[intField]), 10) || null;
    }
  }

  // Validate required fields
  const missing = REQUIRED_SUBMIT_FIELDS.filter(
    (f) => merged[f] === null || merged[f] === undefined || merged[f] === ""
  );
  if (missing.length > 0) {
    return c.json({ error: "Campi obbligatori mancanti", fields: missing }, 400);
  }

  // Find active PDF template for this location
  const template = await prisma.pdfTemplate.findFirst({
    where: {
      location: form.location,
      document_type: "comunicazione_locazione",
      is_active: true,
    },
  });

  if (!template || !template.template_url) {
    // Save form data even if no template available, mark as submitted
    await prisma.authorizationForm.update({
      where: { token },
      data: { ...merged, submitted_at: new Date() },
    });
    return c.json({ success: true, pdf_generated: false });
  }

  // Load template PDF (supports both data URIs and HTTP URLs)
  let templateBytes: ArrayBuffer;
  if (template.template_url.startsWith("data:")) {
    const base64 = template.template_url.split(",")[1];
    templateBytes = Buffer.from(base64, "base64").buffer;
  } else {
    const templateResponse = await fetch(template.template_url);
    if (!templateResponse.ok) {
      return c.json({ error: "Impossibile scaricare il template PDF" }, 500);
    }
    templateBytes = await templateResponse.arrayBuffer();
  }

  // Compile PDF
  const pdfBytes = await compilePdf(templateBytes, merged, form.location);

  // Upload compiled PDF via UTApi
  const utapi = getUtApi();
  const fileName = `autorizzazione-${form.owner.name.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.pdf`;
  const blob = new Blob([Buffer.from(pdfBytes)], { type: "application/pdf" });
  const file = new File([blob], fileName, { type: "application/pdf" });
  const uploadResult = await utapi.uploadFiles(file);

  if (uploadResult.error) {
    return c.json({ error: "Errore durante il caricamento del PDF" }, 500);
  }

  const generatedUrl = uploadResult.data.ufsUrl ?? uploadResult.data.url;

  // Transaction: update form + create document record
  await prisma.$transaction([
    prisma.authorizationForm.update({
      where: { token },
      data: { ...merged, submitted_at: new Date() },
    }),
    prisma.generatedDocument.create({
      data: {
        authorization_form_id: form.id,
        template_id: template.id,
        generated_url: generatedUrl,
      },
    }),
  ]);

  // Fire-and-forget email to manager
  if (MANAGER_EMAIL) {
    sendEmail({
      to: MANAGER_EMAIL,
      subject: `Modulo autorizzazioni compilato — ${form.owner.name}`,
      html: `
        <p>Il proprietario <strong>${form.owner.name}</strong> ha compilato il modulo di autorizzazione.</p>
        <p><a href="${FRONTEND_URL}/manager/crm/onboarding/${form.owner.id}/autorizzazioni">
          Visualizza i documenti
        </a></p>
      `,
    }).catch(() => {});
  }

  return c.json({ success: true, pdf_generated: true });
});

// ---------------------------------------------------------------------------
// MANAGER — authenticated
// ---------------------------------------------------------------------------

// GET /api/authorizations/:ownerId
router.get("/:ownerId", auth, requireManager, async (c) => {
  const ownerId = c.req.param("ownerId");

  const form = await prisma.authorizationForm.findFirst({
    where: { owner_id: ownerId },
    include: {
      documents: {
        include: { template: { select: { label: true, location: true, document_type: true } } },
        orderBy: { generated_at: "desc" },
      },
    },
  });

  if (!form) return c.json({ error: "Nessun modulo trovato" }, 404);

  return c.json(form);
});

// POST /api/authorizations/send-link/:ownerId
router.post(
  "/send-link/:ownerId",
  auth,
  requireManager,
  requirePermission("can_manage_onboarding"),
  async (c) => {
    const ownerId = c.req.param("ownerId");

    const owner = await prisma.owner.findUnique({
      where: { id: ownerId },
      include: { properties: { select: { address: true }, take: 1 } },
    });
    if (!owner) return c.json({ error: "Proprietario non trovato" }, 404);

    const address = owner.properties[0]?.address ?? owner.address ?? "";
    const location = detectLocation(address);

    const form = await prisma.authorizationForm.upsert({
      where: {
        // Find existing form by owner — use findFirst then upsert by id
        id: (
          await prisma.authorizationForm.findFirst({
            where: { owner_id: ownerId },
            select: { id: true },
          })
        )?.id ?? "00000000-0000-0000-0000-000000000000",
      },
      update: { location },
      create: {
        owner_id: ownerId,
        location,
      },
    });

    const url = `${FRONTEND_URL}/autorizzazioni?token=${form.token}`;

    // Auto-send email to owner
    if (owner.email) {
      sendEmail({
        to: owner.email,
        subject: "Compila il modulo di autorizzazione — Propertize",
        html: `
          <p>Ciao ${owner.name},</p>
          <p>Per completare le autorizzazioni relative al tuo immobile, compila il seguente modulo:</p>
          <p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#0A6CFF;color:#fff;text-decoration:none;border-radius:6px;">Compila il modulo</a></p>
          <p>Oppure copia questo link: ${url}</p>
          <p>Cordiali saluti,<br/>Il team Propertize</p>
        `,
      }).catch(() => {});
    }

    return c.json({ token: form.token, url });
  }
);

// POST /api/authorizations/:ownerId/send-to-client
router.post(
  "/:ownerId/send-to-client",
  auth,
  requireManager,
  requirePermission("can_manage_onboarding"),
  async (c) => {
    const ownerId = c.req.param("ownerId");
    const userId = c.get("userId");

    const form = await prisma.authorizationForm.findFirst({
      where: { owner_id: ownerId },
      include: {
        owner: { select: { name: true, email: true } },
        documents: { orderBy: { generated_at: "desc" }, take: 1 },
      },
    });

    if (!form) return c.json({ error: "Nessun modulo trovato" }, 404);
    if (form.documents.length === 0) {
      return c.json({ error: "Nessun documento generato" }, 400);
    }

    const doc = form.documents[0];
    const ownerEmail = form.owner.email;
    if (!ownerEmail) {
      return c.json({ error: "Il proprietario non ha un indirizzo email" }, 400);
    }

    // Download the generated PDF to attach
    const pdfResponse = await fetch(doc.generated_url);
    if (!pdfResponse.ok) {
      return c.json({ error: "Impossibile scaricare il PDF generato" }, 500);
    }
    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

    // Send email with attachment via Resend directly
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return c.json({ error: "Servizio email non configurato" }, 500);
    }
    const resend = new Resend(resendKey);

    await resend.emails.send({
      from: FROM_EMAIL,
      to: ownerEmail,
      subject: "Il tuo documento di autorizzazione — Propertize",
      html: `
        <p>Gentile ${form.owner.name},</p>
        <p>In allegato trovi il documento di autorizzazione compilato.</p>
        <p>Cordiali saluti,<br/>Il team Propertize</p>
      `,
      attachments: [
        {
          filename: `autorizzazione-${form.owner.name.replace(/\s+/g, "-").toLowerCase()}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    // Update document record
    await prisma.generatedDocument.update({
      where: { id: doc.id },
      data: { sent_to_client_at: new Date(), sent_by_id: userId },
    });

    return c.json({ success: true });
  }
);

export default router;
