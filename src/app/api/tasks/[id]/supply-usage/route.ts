import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireAuth } from "@/lib/api-utils";
import { updateTaskSupplyUsageSchema } from "@/lib/validators";
import { type NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

// GET /api/tasks/[id]/supply-usage - Get task supply usages
export async function GET(_req: NextRequest, { params }: Params) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const usages = await prisma.cleaningTaskSupplyUsage.findMany({
    where: { task_id: id },
    include: { supply_item: { select: { name: true, unit: true } } },
    orderBy: { created_at: "asc" },
  });

  return json(usages);
}

// PATCH /api/tasks/[id]/supply-usage - Update a supply usage row
export async function PATCH(req: NextRequest, { params }: Params) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateTaskSupplyUsageSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  const { supply_item_id, qty_used } = parsed.data;

  const usage = await prisma.cleaningTaskSupplyUsage.upsert({
    where: {
      task_id_supply_item_id: {
        task_id: id,
        supply_item_id,
      },
    },
    update: { qty_used },
    create: {
      task_id: id,
      supply_item_id,
      qty_used,
    },
    include: { supply_item: { select: { name: true, unit: true } } },
  });

  return json(usage);
}
