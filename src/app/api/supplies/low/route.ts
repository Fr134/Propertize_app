import { prisma } from "@/lib/prisma";
import { json, requireManager } from "@/lib/api-utils";

// GET /api/supplies/low - Low supplies across all properties (MANAGER)
export async function GET() {
  const { error } = await requireManager();
  if (error) return error;

  const lowSupplies = await prisma.supplyLevel.findMany({
    where: {
      level: { in: ["IN_ESAURIMENTO", "ESAURITO"] },
    },
    include: {
      property: { select: { id: true, name: true, code: true } },
    },
    orderBy: [{ level: "asc" }, { category: "asc" }],
  });

  return json(lowSupplies);
}
