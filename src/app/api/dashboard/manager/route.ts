import { prisma } from "@/lib/prisma";
import { json, requireManager } from "@/lib/api-utils";

/**
 * GET /api/dashboard/manager
 * Restituisce KPI per dashboard manager
 */
export async function GET() {
  const { error } = await requireManager();
  if (error) return error;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Query parallele per ottimizzare performance
  const [
    pendingApprovalCount,
    openReportsCount,
    lowSupplyPropertiesCount,
    todayTasksCompleted,
    todayTasksTotal,
  ] = await Promise.all([
    // Task completate in attesa di approvazione
    prisma.cleaningTask.count({
      where: { status: "COMPLETED" },
    }),
    // Segnalazioni aperte
    prisma.maintenanceReport.count({
      where: { status: "OPEN" },
    }),
    // Immobili con scorte in esaurimento o esaurite
    prisma.supplyLevel
      .groupBy({
        by: ["property_id"],
        where: {
          level: {
            in: ["IN_ESAURIMENTO", "ESAURITO"],
          },
        },
      })
      .then((groups) => groups.length),
    // Task di oggi completate
    prisma.cleaningTask.count({
      where: {
        scheduled_date: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          in: ["COMPLETED", "APPROVED"],
        },
      },
    }),
    // Task di oggi totali
    prisma.cleaningTask.count({
      where: {
        scheduled_date: {
          gte: today,
          lt: tomorrow,
        },
      },
    }),
  ]);

  return json({
    pendingApprovalCount,
    openReportsCount,
    lowSupplyPropertiesCount,
    todayTasksCompleted,
    todayTasksTotal,
  });
}
