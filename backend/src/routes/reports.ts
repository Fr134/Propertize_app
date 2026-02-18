import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { auth, requireManager } from "../middleware/auth";
import { getPaginationParams, createPaginatedResponse } from "../lib/pagination";
import { createReportSchema, updateReportStatusSchema } from "../lib/validators";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

// GET /api/reports
router.get("/", auth, async (c) => {
  const userId = c.get("userId");
  const role = c.get("role");
  const { page, limit, skip } = getPaginationParams(c);

  const propertyId = c.req.query("property_id");
  const status = c.req.query("status");
  const priority = c.req.query("priority");

  const where: Record<string, unknown> = {};
  if (role === "OPERATOR") where.created_by = userId;
  if (propertyId) where.property_id = propertyId;
  if (status) where.status = status;
  if (priority) where.priority = priority;

  const [reports, total] = await Promise.all([
    prisma.maintenanceReport.findMany({
      where,
      include: {
        property: { select: { id: true, name: true, code: true } },
        author: { select: { id: true, first_name: true, last_name: true } },
        _count: { select: { photos: true } },
      },
      orderBy: [{ created_at: "desc" }],
      take: limit,
      skip,
    }),
    prisma.maintenanceReport.count({ where }),
  ]);

  return c.json(createPaginatedResponse(reports, total, page, limit));
});

// POST /api/reports
router.post("/", auth, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const parsed = createReportSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const report = await prisma.maintenanceReport.create({
    data: { ...parsed.data, created_by: userId },
    include: {
      property: { select: { id: true, name: true, code: true } },
      author: { select: { id: true, first_name: true, last_name: true } },
    },
  });

  return c.json(report, 201);
});

// GET /api/reports/:id
router.get("/:id", auth, async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");
  const role = c.get("role");

  const report = await prisma.maintenanceReport.findUnique({
    where: { id },
    include: {
      property: { select: { id: true, name: true, code: true, address: true } },
      author: { select: { id: true, first_name: true, last_name: true } },
      task: { select: { id: true, scheduled_date: true } },
      photos: { orderBy: { uploaded_at: "asc" } },
    },
  });

  if (!report) return c.json({ error: "Segnalazione non trovata" }, 404);

  if (role === "OPERATOR" && report.created_by !== userId) {
    return c.json({ error: "Segnalazione non trovata" }, 404);
  }

  return c.json(report);
});

// PATCH /api/reports/:id/status
router.patch("/:id/status", auth, requireManager, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateReportStatusSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const report = await prisma.maintenanceReport.findUnique({ where: { id } });
  if (!report) return c.json({ error: "Segnalazione non trovata" }, 404);

  const updated = await prisma.maintenanceReport.update({
    where: { id },
    data: {
      status: parsed.data.status,
      resolved_at: parsed.data.status === "RESOLVED" ? new Date() : null,
    },
  });

  return c.json(updated);
});

// POST /api/reports/:id/photos
router.post("/:id/photos", auth, async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");
  const role = c.get("role");
  const body = await c.req.json();
  const { photoUrl } = body as { photoUrl: string };

  if (!photoUrl) return c.json({ error: "photoUrl richiesto" }, 400);

  const report = await prisma.maintenanceReport.findUnique({ where: { id } });
  if (!report) return c.json({ error: "Segnalazione non trovata" }, 404);

  if (role === "OPERATOR" && report.created_by !== userId) {
    return c.json({ error: "Segnalazione non trovata" }, 404);
  }

  const count = await prisma.reportPhoto.count({ where: { report_id: id } });
  if (count >= 5) return c.json({ error: "Massimo 5 foto per segnalazione" }, 400);

  const photo = await prisma.reportPhoto.create({
    data: { report_id: id, photo_url: photoUrl },
  });

  return c.json(photo, 201);
});

export default router;
