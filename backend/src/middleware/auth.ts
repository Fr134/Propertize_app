import { createMiddleware } from "hono/factory";
import { jwtVerify } from "jose";
import type { AppEnv, Permission } from "../types";

const PERMISSION_KEYS: Permission[] = [
  "can_manage_leads",
  "can_do_analysis",
  "can_manage_operations",
  "can_manage_finance",
  "can_manage_team",
  "can_manage_onboarding",
];

export const auth = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Non autorizzato" }, 401);
  }
  const token = authHeader.slice(7);
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);
    const { payload } = await jwtVerify(token, secret);

    if (payload.active === false) {
      return c.json({ error: "Account disattivato" }, 401);
    }

    c.set("userId", payload.sub as string);
    c.set("role", payload.role as string);
    c.set("isSuperAdmin", payload.is_super_admin === true);

    const permissions = {} as Record<Permission, boolean>;
    for (const key of PERMISSION_KEYS) {
      permissions[key] = payload[key] === true;
    }
    c.set("permissions", permissions);

    await next();
  } catch {
    return c.json({ error: "Token non valido" }, 401);
  }
});

export const requireManager = createMiddleware<AppEnv>(async (c, next) => {
  if (c.get("role") !== "MANAGER") {
    return c.json({ error: "Accesso riservato al manager" }, 403);
  }
  await next();
});
