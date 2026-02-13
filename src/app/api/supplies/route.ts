import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireManager } from "@/lib/api-utils";
import { updateSupplySchema } from "@/lib/validators";

// PATCH /api/supplies - Update supply levels (manager only)
export async function PATCH(req: Request) {
  const { error } = await requireManager();
  if (error) return error;

  const body = await req.json();
  const parsed = updateSupplySchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  const results = [];
  for (const supply of parsed.data.supplies) {
    const result = await prisma.supplyLevel.upsert({
      where: {
        property_id_category: {
          property_id: parsed.data.property_id,
          category: supply.category,
        },
      },
      update: {
        level: supply.level,
        task_id: parsed.data.task_id,
      },
      create: {
        property_id: parsed.data.property_id,
        category: supply.category,
        level: supply.level,
        task_id: parsed.data.task_id,
      },
    });
    results.push(result);
  }

  return json(results);
}
