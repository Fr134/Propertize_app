import { Hono } from "hono";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { loginSchema } from "../lib/validators";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

// POST /api/auth/login
router.post("/login", async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  // Uniform response to prevent user enumeration
  if (!user) {
    await bcrypt.compare(
      parsed.data.password,
      "$2a$10$dummyhashtopreventtimingattack"
    );
    return c.json({ error: "Credenziali non valide" }, 401);
  }

  const isValid = await bcrypt.compare(parsed.data.password, user.password_hash);
  if (!isValid) {
    return c.json({ error: "Credenziali non valide" }, 401);
  }

  if (!user.active) {
    return c.json({ error: "Account disattivato" }, 403);
  }

  const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);
  const accessToken = await new SignJWT({
    role: user.role,
    active: user.active,
    is_super_admin: user.is_super_admin,
    can_manage_leads: user.can_manage_leads,
    can_do_analysis: user.can_do_analysis,
    can_manage_operations: user.can_manage_operations,
    can_manage_finance: user.can_manage_finance,
    can_manage_team: user.can_manage_team,
    can_manage_onboarding: user.can_manage_onboarding,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const permissions = {
    is_super_admin: user.is_super_admin,
    can_manage_leads: user.can_manage_leads,
    can_do_analysis: user.can_do_analysis,
    can_manage_operations: user.can_manage_operations,
    can_manage_finance: user.can_manage_finance,
    can_manage_team: user.can_manage_team,
    can_manage_onboarding: user.can_manage_onboarding,
  };

  return c.json({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      role: user.role,
      permissions,
    },
  });
});

export default router;
