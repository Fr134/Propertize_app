import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireManager } from "@/lib/api-utils";
import { updateReportStatusSchema } from "@/lib/validators";

// PATCH /api/reports/[id]/status - Update report status (MANAGER only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireManager();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateReportStatusSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  const report = await prisma.maintenanceReport.findUnique({ where: { id } });
  if (!report) return errorResponse("Segnalazione non trovata", 404);

  const updated = await prisma.maintenanceReport.update({
    where: { id },
    data: {
      status: parsed.data.status,
      resolved_at: parsed.data.status === "RESOLVED" ? new Date() : null,
    },
  });

  return json(updated);
}
