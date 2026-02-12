import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireAuth } from "@/lib/api-utils";

// GET /api/properties/[id]/supplies - Supply levels for a property
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const supplies = await prisma.supplyLevel.findMany({
    where: { property_id: id },
    orderBy: { category: "asc" },
  });

  return json(supplies);
}
