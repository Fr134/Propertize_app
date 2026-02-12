import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireAuth } from "@/lib/api-utils";

// GET /api/reports/[id] - Report detail
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const report = await prisma.maintenanceReport.findUnique({
    where: { id },
    include: {
      property: { select: { id: true, name: true, code: true, address: true } },
      author: { select: { id: true, first_name: true, last_name: true } },
      task: { select: { id: true, scheduled_date: true } },
      photos: { orderBy: { uploaded_at: "asc" } },
    },
  });

  if (!report) {
    return errorResponse("Segnalazione non trovata", 404);
  }

  return json(report);
}
