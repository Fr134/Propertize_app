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
    prisma.task.count({ where: { status: "COMPLETED" } }),
    prisma.maintenanceReport.count({ where: { status: "OPEN" } }),
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT property_id) as count
      FROM property_supply_stocks
      WHERE qty_current <= low_threshold
    `.then((r) => Number(r[0]?.count ?? 0)),
    prisma.task.count({
      where: {
        scheduled_date: { gte: today, lt: tomorrow },
        status: { in: ["COMPLETED", "APPROVED"] },
      },
    }),
    prisma.task.count({
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
