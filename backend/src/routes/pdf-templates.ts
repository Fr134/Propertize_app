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

  // Group by location
  const grouped: Record<string, typeof templates> = {};
  for (const t of templates) {
    if (!grouped[t.location]) grouped[t.location] = [];
    grouped[t.location].push(t);
  }

  return c.json(grouped);
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
