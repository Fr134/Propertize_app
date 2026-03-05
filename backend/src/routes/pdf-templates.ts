import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { auth, requireManager } from "../middleware/auth";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

// GET /api/pdf-templates
router.get("/", auth, requireManager, async (c) => {
  const templates = await prisma.pdfTemplate.findMany({
    orderBy: [{ location: "asc" }, { document_type: "asc" }],
  });

  // Group by location, omit large base64 template_url from response
  const grouped: Record<string, Array<{
    id: string;
    location: string;
    document_type: string;
    label: string;
    template_url: string;
    is_active: boolean;
  }>> = {};
  for (const t of templates) {
    if (!grouped[t.location]) grouped[t.location] = [];
    grouped[t.location].push({
      id: t.id,
      location: t.location,
      document_type: t.document_type,
      label: t.label,
      template_url: t.template_url.startsWith("data:") ? "stored" : t.template_url,
      is_active: t.is_active,
    });
  }

  return c.json(grouped);
});

// POST /api/pdf-templates/upload — store PDF as base64 data URI (no external service)
router.post("/upload", auth, requireManager, async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return c.json({ error: "File PDF richiesto" }, 400);
  }

  if (!file.name.endsWith(".pdf")) {
    return c.json({ error: "Solo file PDF ammessi" }, 400);
  }

  if (file.size > 8 * 1024 * 1024) {
    return c.json({ error: "File troppo grande (max 8MB)" }, 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const dataUri = `data:application/pdf;base64,${base64}`;

  return c.json({ url: dataUri });
});

// POST /api/pdf-templates (manager)
router.post("/", auth, requireManager, async (c) => {
  const body = await c.req.json();
  const { location, document_type, label, template_url } = body;

  if (!location || !document_type || !label || !template_url) {
    return c.json({ error: "Campi obbligatori: location, document_type, label, template_url" }, 400);
  }

  const template = await prisma.pdfTemplate.upsert({
    where: { location_document_type: { location, document_type } },
    update: { label, template_url },
    create: { location, document_type, label, template_url },
  });

  return c.json(template);
});

export default router;
