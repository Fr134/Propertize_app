import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireAuth } from "@/lib/api-utils";

// GET /api/properties/[id] - Property detail with checklist template
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      checklist_template: true,
      supply_levels: {
        orderBy: { category: "asc" },
      },
      linen_inventory: {
        orderBy: [{ type: "asc" }, { status: "asc" }],
      },
    },
  });

  if (!property) {
    return errorResponse("Immobile non trovato", 404);
  }

  return json(property);
}
