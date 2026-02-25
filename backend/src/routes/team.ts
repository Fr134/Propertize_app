import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { auth, requireManager } from "../middleware/auth";
import { requirePermission } from "../middleware/permissions";
import {
  inviteTeamMemberSchema,
  updateTeamMemberSchema,
  updatePermissionsSchema,
  resetPasswordSchema,
} from "../lib/validators";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

const teamMiddleware = [auth, requireManager, requirePermission("can_manage_team")] as const;

const USER_SELECT = {
  id: true,
  email: true,
  first_name: true,
  last_name: true,
  role: true,
  phone: true,
  active: true,
  can_manage_leads: true,
  can_do_analysis: true,
  can_manage_operations: true,
  can_manage_finance: true,
  can_manage_team: true,
  can_manage_onboarding: true,
  is_super_admin: true,
  leads_assignment_count: true,
  analysis_assignment_count: true,
  operations_assignment_count: true,
  onboarding_assignment_count: true,
  created_at: true,
} as const;

// GET /api/team
router.get("/", ...teamMiddleware, async (c) => {
  const users = await prisma.user.findMany({
    where: { active: true },
    select: USER_SELECT,
    orderBy: [{ role: "asc" }, { first_name: "asc" }],
  });

  return c.json(users);
});

// GET /api/team/:id
router.get("/:id", ...teamMiddleware, async (c) => {
  const id = c.req.param("id");

  const user = await prisma.user.findUnique({
    where: { id },
    select: USER_SELECT,
  });

  if (!user) return c.json({ error: "Utente non trovato" }, 404);
  return c.json(user);
});

// POST /api/team/invite
router.post("/invite", ...teamMiddleware, async (c) => {
  const body = await c.req.json();
  const parsed = inviteTeamMemberSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  // Cannot create super_admin
  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return c.json({ error: "Email già in uso" }, 400);
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  // Only set permissions for MANAGER role
  const isManager = parsed.data.role === "MANAGER";

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      password_hash: passwordHash,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      role: parsed.data.role,
      phone: parsed.data.phone || null,
      can_manage_leads: isManager ? parsed.data.can_manage_leads : false,
      can_do_analysis: isManager ? parsed.data.can_do_analysis : false,
      can_manage_operations: isManager ? parsed.data.can_manage_operations : false,
      can_manage_finance: isManager ? parsed.data.can_manage_finance : false,
      can_manage_team: isManager ? parsed.data.can_manage_team : false,
      can_manage_onboarding: isManager ? parsed.data.can_manage_onboarding : false,
      is_super_admin: false,
    },
    select: USER_SELECT,
  });

  return c.json(user, 201);
});

// PATCH /api/team/:id
router.patch("/:id", ...teamMiddleware, async (c) => {
  const id = c.req.param("id");
  const requesterId = c.get("userId");
  const isSuperAdmin = c.get("isSuperAdmin");

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return c.json({ error: "Utente non trovato" }, 404);

  // Cannot modify super_admin unless requester is super_admin
  if (target.is_super_admin && !isSuperAdmin) {
    return c.json({ error: "Non puoi modificare un super admin" }, 403);
  }

  const body = await c.req.json();
  const parsed = updateTeamMemberSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  // Check email uniqueness if changing
  if (parsed.data.email && parsed.data.email !== target.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (emailExists) {
      return c.json({ error: "Email già in uso" }, 400);
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      email: parsed.data.email,
      phone: parsed.data.phone !== undefined ? (parsed.data.phone || null) : undefined,
    },
    select: USER_SELECT,
  });

  return c.json(updated);
});

// PATCH /api/team/:id/permissions
router.patch("/:id/permissions", ...teamMiddleware, async (c) => {
  const id = c.req.param("id");
  const isSuperAdmin = c.get("isSuperAdmin");

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return c.json({ error: "Utente non trovato" }, 404);

  // Only for MANAGER role
  if (target.role !== "MANAGER") {
    return c.json({ error: "I permessi si applicano solo ai manager" }, 400);
  }

  // Cannot set permissions on super_admin unless requester is super_admin
  if (target.is_super_admin && !isSuperAdmin) {
    return c.json({ error: "Non puoi modificare i permessi di un super admin" }, 403);
  }

  const body = await c.req.json();
  const parsed = updatePermissionsSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      can_manage_leads: parsed.data.can_manage_leads,
      can_do_analysis: parsed.data.can_do_analysis,
      can_manage_operations: parsed.data.can_manage_operations,
      can_manage_finance: parsed.data.can_manage_finance,
      can_manage_team: parsed.data.can_manage_team,
      can_manage_onboarding: parsed.data.can_manage_onboarding,
    },
    select: USER_SELECT,
  });

  return c.json(updated);
});

// POST /api/team/:id/reset-password
router.post("/:id/reset-password", ...teamMiddleware, async (c) => {
  const id = c.req.param("id");
  const isSuperAdmin = c.get("isSuperAdmin");

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return c.json({ error: "Utente non trovato" }, 404);

  // Cannot reset super_admin unless requester is super_admin
  if (target.is_super_admin && !isSuperAdmin) {
    return c.json({ error: "Non puoi reimpostare la password di un super admin" }, 403);
  }

  const body = await c.req.json();
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.user.update({
    where: { id },
    data: { password_hash: passwordHash },
  });

  return c.json({ success: true });
});

// DELETE /api/team/:id (soft delete — set active=false)
router.delete("/:id", ...teamMiddleware, async (c) => {
  const id = c.req.param("id");
  const requesterId = c.get("userId");
  const isSuperAdmin = c.get("isSuperAdmin");

  if (id === requesterId) {
    return c.json({ error: "Non puoi disattivare il tuo account" }, 400);
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return c.json({ error: "Utente non trovato" }, 404);

  // Cannot deactivate super_admin
  if (target.is_super_admin && !isSuperAdmin) {
    return c.json({ error: "Non puoi disattivare un super admin" }, 403);
  }

  await prisma.user.update({
    where: { id },
    data: { active: false },
  });

  return c.json({ success: true });
});

export default router;
