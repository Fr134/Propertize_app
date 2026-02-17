import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { auth, requireManager } from "../middleware/auth";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

// GET /api/dashboard/manager
router.get("/manager", auth, requireManager, async (c) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    pendingApprovalCount,
    openReportsCount,
    lowSupplyPropertiesCount,
    todayTasksCompleted,
    todayTasksTotal,
  ] = await Promise.all([
    prisma.cleaningTask.count({ where: { status: "COMPLETED" } }),
    prisma.maintenanceReport.count({ where: { status: "OPEN" } }),
    prisma.supplyLevel
      .groupBy({
        by: ["property_id"],
        where: { level: { in: ["IN_ESAURIMENTO", "ESAURITO"] } },
      })
      .then((groups) => groups.length),
    prisma.cleaningTask.count({
      where: {
        scheduled_date: { gte: today, lt: tomorrow },
        status: { in: ["COMPLETED", "APPROVED"] },
      },
    }),
    prisma.cleaningTask.count({
      where: { scheduled_date: { gte: today, lt: tomorrow } },
    }),
  ]);

  return c.json({
    pendingApprovalCount,
    openReportsCount,
    lowSupplyPropertiesCount,
    todayTasksCompleted,
    todayTasksTotal,
  });
});

export default router;
