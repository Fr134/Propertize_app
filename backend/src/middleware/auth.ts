import { createMiddleware } from "hono/factory";
import { jwtVerify } from "jose";
import type { AppEnv } from "../types";

export const auth = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Non autorizzato" }, 401);
  }
  const token = authHeader.slice(7);
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    c.set("userId", payload.sub as string);
    c.set("role", payload.role as string);
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
