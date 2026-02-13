import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireManager } from "@/lib/api-utils";
import { updateLinenSchema } from "@/lib/validators";

// PATCH /api/linen - Update linen inventory (manager only)
export async function PATCH(req: Request) {
  const { error } = await requireManager();
  if (error) return error;

  const body = await req.json();
  const parsed = updateLinenSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  const results = [];
  for (const item of parsed.data.linen) {
    const result = await prisma.linenInventory.upsert({
      where: {
        property_id_type_status: {
          property_id: parsed.data.property_id,
          type: item.type,
          status: item.status,
        },
      },
      update: { quantity: item.quantity },
      create: {
        property_id: parsed.data.property_id,
        type: item.type,
        status: item.status,
        quantity: item.quantity,
      },
    });
    results.push(result);
  }

  return json(results);
}
