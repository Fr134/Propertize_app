import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { SignJWT } from "jose";
import { auth } from "../middleware/auth";
import { requirePermission } from "../middleware/permissions";
import type { AppEnv } from "../types";

const SECRET = new TextEncoder().encode("test-secret-key-for-testing");

async function makeToken(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("user-1")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(SECRET);
}

function createApp() {
  const app = new Hono<AppEnv>();

  // Override AUTH_SECRET for testing
  process.env.AUTH_SECRET = "test-secret-key-for-testing";

  app.get(
    "/protected",
    auth,
    requirePermission("can_manage_leads"),
    (c) => c.json({ ok: true })
  );

  return app;
}

describe("requirePermission middleware", () => {
  it("should return 403 for OPERATOR role", async () => {
    const app = createApp();
    const token = await makeToken({ role: "OPERATOR", active: true });

    const res = await app.request("/protected", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Accesso riservato al manager");
  });

  it("should return 403 for MANAGER without required permission", async () => {
    const app = createApp();
    const token = await makeToken({
      role: "MANAGER",
      active: true,
      can_manage_leads: false,
      can_do_analysis: false,
      can_manage_operations: false,
      can_manage_finance: false,
      can_manage_team: false,
      can_manage_onboarding: false,
      is_super_admin: false,
    });

    const res = await app.request("/protected", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Permesso insufficiente");
  });

  it("should return 200 for MANAGER with required permission", async () => {
    const app = createApp();
    const token = await makeToken({
      role: "MANAGER",
      active: true,
      can_manage_leads: true,
      is_super_admin: false,
    });

    const res = await app.request("/protected", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  it("should return 200 for super_admin without explicit permission", async () => {
    const app = createApp();
    const token = await makeToken({
      role: "MANAGER",
      active: true,
      can_manage_leads: false,
      is_super_admin: true,
    });

    const res = await app.request("/protected", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  it("should return 401 for inactive user", async () => {
    const app = createApp();
    const token = await makeToken({
      role: "MANAGER",
      active: false,
      can_manage_leads: true,
      is_super_admin: false,
    });

    const res = await app.request("/protected", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(401);
  });
});
