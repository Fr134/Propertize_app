import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { auth, requireManager } from "../middleware/auth";
import { requirePermission } from "../middleware/permissions";
import { onboardingFileSchema } from "../lib/validators";
import { sendEmail, MANAGER_EMAIL } from "../lib/email";
import { onboardingFileSubmitted } from "../lib/email-templates";
import type { AppEnv } from "../types";
import type { Prisma } from "@prisma/client";

const router = new Hono<AppEnv>();

// ============================================
// Public endpoints (token-based, no auth)
// ============================================

// GET /api/onboarding-file/token/:token — fetch onboarding file by token
router.get("/token/:token", async (c) => {
  const token = c.req.param("token");

  const file = await prisma.onboardingFile.findUnique({
    where: { token },
    include: { owner: { select: { id: true, name: true } } },
  });

  if (!file) return c.json({ error: "Onboarding file non trovato" }, 404);
  if (file.status === "SUBMITTED") {
    return c.json({ error: "Questo onboarding file è già stato inviato", status: "SUBMITTED" }, 400);
  }

  return c.json(file);
});

// PATCH /api/onboarding-file/token/:token — auto-save partial fields
router.patch("/token/:token", async (c) => {
  const token = c.req.param("token");

  const file = await prisma.onboardingFile.findUnique({ where: { token } });
  if (!file) return c.json({ error: "Onboarding file non trovato" }, 404);
  if (file.status === "SUBMITTED") {
    return c.json({ error: "Questo onboarding file è già stato inviato" }, 400);
  }

  const body = await c.req.json();
  const parsed = onboardingFileSchema.partial().safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  // Separate JSON fields from scalar fields
  const JSON_FIELDS = [
    "rooms", "bathrooms", "kitchen_amenities", "general_amenities",
    "services", "safety_equipment",
  ];

  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value === undefined) continue;
    if (JSON_FIELDS.includes(key)) {
      data[key] = value as Prisma.InputJsonValue;
    } else {
      data[key] = value === "" ? null : value;
    }
  }

  const updated = await prisma.onboardingFile.update({
    where: { id: file.id },
    data,
  });

  return c.json(updated);
});

// POST /api/onboarding-file/token/:token/submit — submit the form
router.post("/token/:token/submit", async (c) => {
  const token = c.req.param("token");

  const file = await prisma.onboardingFile.findUnique({
    where: { token },
    include: { owner: true },
  });

  if (!file) return c.json({ error: "Onboarding file non trovato" }, 404);
  if (file.status === "SUBMITTED") {
    return c.json({ error: "Questo onboarding file è già stato inviato" }, 400);
  }

  // Validate required fields
  const required: { field: string; label: string }[] = [
    { field: "owner_first_name", label: "Nome" },
    { field: "owner_last_name", label: "Cognome" },
    { field: "owner_fiscal_code", label: "Codice fiscale" },
    { field: "billing_type", label: "Tipo fatturazione" },
    { field: "owner_language", label: "Lingua" },
    { field: "owner_birth_date", label: "Data di nascita" },
    { field: "owner_phone", label: "Telefono" },
    { field: "owner_email", label: "Email" },
    { field: "residence_address", label: "Indirizzo residenza" },
    { field: "residence_zip", label: "CAP residenza" },
    { field: "residence_country", label: "Nazione" },
    { field: "document_type", label: "Tipo documento" },
    { field: "document_number", label: "Numero documento" },
    { field: "document_issue_place", label: "Luogo emissione" },
    { field: "document_issue_date", label: "Data emissione" },
    { field: "bank_account_holder", label: "Titolare conto" },
    { field: "bank_iban", label: "IBAN" },
    { field: "bank_name", label: "Nome banca" },
    { field: "bank_bic_swift", label: "BIC/SWIFT" },
    { field: "property_address", label: "Indirizzo immobile" },
    { field: "property_zip", label: "CAP immobile" },
    { field: "property_floor", label: "Piano" },
    { field: "property_intercom_name", label: "Nome citofono" },
    { field: "internet_provider", label: "Provider internet" },
    { field: "wifi_name", label: "Nome WiFi" },
    { field: "wifi_password", label: "Password WiFi" },
    { field: "modem_serial_number", label: "Numero seriale modem" },
    { field: "keys_availability_date", label: "Data disponibilità chiavi" },
  ];

  const fileData = file as Record<string, unknown>;
  const missing = required.filter((r) => {
    const val = fileData[r.field];
    return !val || (typeof val === "string" && val.trim() === "");
  });

  if (missing.length > 0) {
    return c.json({
      error: `Campi obbligatori mancanti: ${missing.map((m) => m.label).join(", ")}`,
      missing_fields: missing.map((m) => m.field),
    }, 400);
  }

  if (!file.privacy_consent) {
    return c.json({ error: "È necessario accettare la privacy policy" }, 400);
  }

  // Require sqm
  if (!file.property_sqm_internal) {
    return c.json({ error: "MQ interni obbligatorio" }, 400);
  }

  // Require num_rooms, num_bathrooms, num_kitchens
  if (!file.num_rooms) {
    return c.json({ error: "Numero camere obbligatorio" }, 400);
  }
  if (!file.num_bathrooms) {
    return c.json({ error: "Numero bagni obbligatorio" }, 400);
  }
  if (!file.num_kitchens) {
    return c.json({ error: "Numero cucine obbligatorio" }, 400);
  }

  // Submit and auto-populate Owner
  await prisma.$transaction(async (tx) => {
    // Mark as submitted
    await tx.onboardingFile.update({
      where: { id: file.id },
      data: { status: "SUBMITTED", submitted_at: new Date() },
    });

    // Update owner with data from onboarding file
    const ownerUpdate: Record<string, unknown> = {};
    if (file.owner_first_name && file.owner_last_name) {
      ownerUpdate.name = `${file.owner_first_name} ${file.owner_last_name}`;
    }
    if (file.owner_email) ownerUpdate.email = file.owner_email;
    if (file.owner_phone) ownerUpdate.phone = file.owner_phone;
    if (file.residence_address) ownerUpdate.address = file.residence_address;
    if (file.owner_fiscal_code) ownerUpdate.fiscal_code = file.owner_fiscal_code;
    if (file.bank_iban) ownerUpdate.iban = file.bank_iban;

    if (Object.keys(ownerUpdate).length > 0) {
      await tx.owner.update({
        where: { id: file.owner_id },
        data: ownerUpdate,
      });
    }

    // Auto-complete onboarding step "contract_signed" if workflow exists
    const workflow = await tx.onboardingWorkflow.findUnique({
      where: { owner_id: file.owner_id },
      include: { steps: true },
    });

    if (workflow) {
      const obFileStep = workflow.steps.find(
        (s) => s.step_key === "onboarding_file_completed"
      );
      if (obFileStep && obFileStep.status !== "COMPLETED") {
        await tx.onboardingStep.update({
          where: { id: obFileStep.id },
          data: { status: "COMPLETED", completed_at: new Date() },
        });
      }
    }
  });

  // Send notification email to manager + assignee
  if (MANAGER_EMAIL) {
    let assigneeName: string | null = null;
    let assigneeEmail: string | null = null;
    const wf = await prisma.onboardingWorkflow.findUnique({
      where: { owner_id: file.owner_id },
      select: { assigned_to: { select: { first_name: true, last_name: true, email: true } } },
    });
    if (wf?.assigned_to) {
      assigneeName = `${wf.assigned_to.first_name} ${wf.assigned_to.last_name}`;
      assigneeEmail = wf.assigned_to.email;
    }
    const tpl = onboardingFileSubmitted({
      ownerFirstName: file.owner_first_name ?? "",
      ownerLastName: file.owner_last_name ?? "",
      ownerEmail: file.owner_email ?? null,
      ownerPhone: file.owner_phone ?? null,
      propertyAddress: file.property_address ?? null,
      ownerId: file.owner_id,
      assigneeName,
    });
    sendEmail({ to: MANAGER_EMAIL, ...tpl });
    if (assigneeEmail && assigneeEmail !== MANAGER_EMAIL) {
      sendEmail({ to: assigneeEmail, ...tpl });
    }
  }

  return c.json({ message: "Onboarding file inviato con successo" });
});

// ============================================
// Manager endpoints (authenticated)
// ============================================

// GET /api/onboarding-file/owner/:ownerId — get by owner (manager)
router.get("/owner/:ownerId", auth, requireManager, async (c) => {
  const ownerId = c.req.param("ownerId");

  const file = await prisma.onboardingFile.findUnique({
    where: { owner_id: ownerId },
    include: { owner: { select: { id: true, name: true, email: true, phone: true } } },
  });

  if (!file) return c.json({ error: "Onboarding file non trovato" }, 404);
  return c.json(file);
});

// POST /api/onboarding-file/create/:ownerId — create for owner (manager)
router.post("/create/:ownerId", auth, requireManager, requirePermission("can_manage_onboarding"), async (c) => {
  const ownerId = c.req.param("ownerId");

  const owner = await prisma.owner.findUnique({ where: { id: ownerId } });
  if (!owner) return c.json({ error: "Proprietario non trovato" }, 404);

  // Idempotent
  const existing = await prisma.onboardingFile.findUnique({
    where: { owner_id: ownerId },
  });
  if (existing) return c.json(existing);

  // Pre-populate from owner data
  const file = await prisma.onboardingFile.create({
    data: {
      owner_id: ownerId,
      owner_email: owner.email || undefined,
      owner_phone: owner.phone || undefined,
      residence_address: owner.address || undefined,
      owner_fiscal_code: owner.fiscal_code || undefined,
      bank_iban: owner.iban || undefined,
      // Split name into first/last
      ...(owner.name ? (() => {
        const parts = owner.name.trim().split(/\s+/);
        return {
          owner_first_name: parts[0],
          owner_last_name: parts.slice(1).join(" ") || undefined,
        };
      })() : {}),
    },
  });

  return c.json(file, 201);
});

export default router;
