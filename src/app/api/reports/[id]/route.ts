import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireAuth } from "@/lib/api-utils";

// GET /api/reports/[id] - Report detail
// MANAGER: can view any report
// OPERATOR: can only view own reports
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
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

  // Operators can only view their own reports
  if (session!.user.role === "OPERATOR" && report.created_by !== session!.user.id) {
    return errorResponse("Segnalazione non trovata", 404);
  }

  return json(report);
}
