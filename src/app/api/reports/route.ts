import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireAuth } from "@/lib/api-utils";
import { createReportSchema } from "@/lib/validators";
import { getPaginationParams, createPaginatedResponse } from "@/lib/pagination";
import { type NextRequest } from "next/server";

// GET /api/reports - List reports with filters and pagination
export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const searchParams = req.nextUrl.searchParams;
  const propertyId = searchParams.get("property_id");
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const { page, limit, skip } = getPaginationParams(req);

  const where: Record<string, unknown> = {};

  if (session!.user.role === "OPERATOR") {
    where.created_by = session!.user.id;
  }

  if (propertyId) where.property_id = propertyId;
  if (status) where.status = status;
  if (priority) where.priority = priority;

  // Query parallele per ottimizzare performance
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

  return json(createPaginatedResponse(reports, total, page, limit));
}

// POST /api/reports - Create a maintenance report
export async function POST(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const parsed = createReportSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.errors[0].message);
  }

  const report = await prisma.maintenanceReport.create({
    data: {
      ...parsed.data,
      created_by: session!.user.id,
    },
    include: {
      property: { select: { id: true, name: true, code: true } },
      author: { select: { id: true, first_name: true, last_name: true } },
    },
  });

  return json(report, 201);
}
