import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { auth, requireManager } from "../middleware/auth";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

// GET /api/users?role=OPERATOR
router.get("/", auth, requireManager, async (c) => {
  const role = c.req.query("role");

  const users = await prisma.user.findMany({
    where: role ? { role: role as "MANAGER" | "OPERATOR" } : undefined,
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      role: true,
    },
    orderBy: { first_name: "asc" },
  });

  return c.json(users);
});

export default router;
