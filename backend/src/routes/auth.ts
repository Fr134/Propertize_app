import { Hono } from "hono";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { loginSchema } from "@propertize/shared";
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

  const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);
  const accessToken = await new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  return c.json({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      role: user.role,
    },
  });
});

export default router;
