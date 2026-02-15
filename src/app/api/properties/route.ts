import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireAuth, requireManager } from "@/lib/api-utils";
import { createPropertySchema } from "@/lib/validators";
import { getPaginationParams, createPaginatedResponse } from "@/lib/pagination";
import { type NextRequest } from "next/server";

// GET /api/properties - List all properties with pagination
export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const { page, limit, skip } = getPaginationParams(req);

  // Query parallele per ottimizzare performance
  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { cleaning_tasks: true },
        },
        owner: { select: { id: true, name: true } },
      },
      take: limit,
      skip,
    }),
    prisma.property.count(),
  ]);

  return json(createPaginatedResponse(properties, total, page, limit));
}

// POST /api/properties - Create a property (MANAGER only)
export async function POST(req: Request) {
  const { error } = await requireManager();
  if (error) return error;

  const body = await req.json();
  const parsed = createPropertySchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  const existing = await prisma.property.findUnique({
    where: { code: parsed.data.code },
  });

  if (existing) {
    return errorResponse("Esiste gia' un immobile con questo codice");
  }

  const property = await prisma.property.create({
    data: {
      name: parsed.data.name,
      code: parsed.data.code,
      address: parsed.data.address,
      property_type: parsed.data.property_type,
      owner_id: parsed.data.owner_id || null,
    },
  });

  return json(property, 201);
}
