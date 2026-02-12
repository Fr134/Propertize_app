import { prisma } from "@/lib/prisma";
import { json, requireAuth } from "@/lib/api-utils";

// GET /api/properties/[id]/linen - Linen inventory for a property
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const linen = await prisma.linenInventory.findMany({
    where: { property_id: id },
    orderBy: [{ type: "asc" }, { status: "asc" }],
  });

  return json(linen);
}
