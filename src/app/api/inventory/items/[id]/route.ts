import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireManager } from "@/lib/api-utils";
import { updateSupplyItemSchema } from "@/lib/validators";

// PATCH /api/inventory/items/[id] - Update supply item (MANAGER only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireManager();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSupplyItemSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

  const existing = await prisma.supplyItem.findUnique({ where: { id } });
  if (!existing) return errorResponse("Articolo non trovato", 404);

  const item = await prisma.supplyItem.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.sku !== undefined && { sku: parsed.data.sku || null }),
      ...(parsed.data.unit !== undefined && { unit: parsed.data.unit }),
      ...(parsed.data.is_active !== undefined && { is_active: parsed.data.is_active }),
    },
  });

  return json(item);
}
