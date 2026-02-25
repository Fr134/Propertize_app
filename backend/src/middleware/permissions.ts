import { createMiddleware } from "hono/factory";
import type { AppEnv, Permission } from "../types";

export function requirePermission(...permissions: Permission[]) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const role = c.get("role");

    if (role !== "MANAGER") {
      return c.json({ error: "Accesso riservato al manager" }, 403);
    }

    // Super admin bypasses all permission checks
    if (c.get("isSuperAdmin")) {
      return next();
    }

    const userPermissions = c.get("permissions");
    const hasAny = permissions.some((p) => userPermissions[p]);

    if (!hasAny) {
      return c.json({ error: "Permesso insufficiente" }, 403);
    }

    return next();
  });
}
