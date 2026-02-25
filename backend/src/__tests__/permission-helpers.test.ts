import { describe, it, expect } from "vitest";

// Replicate the frontend hasPermission logic for testing
// (since frontend has no test framework)

type Permission =
  | "can_manage_leads"
  | "can_do_analysis"
  | "can_manage_operations"
  | "can_manage_finance"
  | "can_manage_team"
  | "can_manage_onboarding";

interface UserPermissions {
  is_super_admin: boolean;
  can_manage_leads: boolean;
  can_do_analysis: boolean;
  can_manage_operations: boolean;
  can_manage_finance: boolean;
  can_manage_team: boolean;
  can_manage_onboarding: boolean;
}

interface MockSession {
  user: {
    role: string;
    permissions: UserPermissions;
  } | null;
}

function hasPermission(
  session: MockSession | null,
  permission: Permission
): boolean {
  if (!session?.user) return false;
  if (session.user.role !== "MANAGER") return false;
  if (session.user.permissions?.is_super_admin) return true;
  return session.user.permissions?.[permission] === true;
}

function hasAnyPermission(
  session: MockSession | null,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(session, p));
}

const DEFAULT_PERMISSIONS: UserPermissions = {
  is_super_admin: false,
  can_manage_leads: false,
  can_do_analysis: false,
  can_manage_operations: false,
  can_manage_finance: false,
  can_manage_team: false,
  can_manage_onboarding: false,
};

describe("hasPermission", () => {
  it("should return false for null session", () => {
    expect(hasPermission(null, "can_manage_leads")).toBe(false);
  });

  it("should return false for null user", () => {
    expect(hasPermission({ user: null }, "can_manage_leads")).toBe(false);
  });

  it("should return false for OPERATOR role", () => {
    const session: MockSession = {
      user: {
        role: "OPERATOR",
        permissions: { ...DEFAULT_PERMISSIONS, can_manage_leads: true },
      },
    };
    expect(hasPermission(session, "can_manage_leads")).toBe(false);
  });

  it("should return true for super_admin regardless of specific permission", () => {
    const session: MockSession = {
      user: {
        role: "MANAGER",
        permissions: { ...DEFAULT_PERMISSIONS, is_super_admin: true },
      },
    };
    expect(hasPermission(session, "can_manage_leads")).toBe(true);
    expect(hasPermission(session, "can_manage_team")).toBe(true);
  });

  it("should return true when specific permission is true", () => {
    const session: MockSession = {
      user: {
        role: "MANAGER",
        permissions: { ...DEFAULT_PERMISSIONS, can_manage_leads: true },
      },
    };
    expect(hasPermission(session, "can_manage_leads")).toBe(true);
  });

  it("should return false when specific permission is false", () => {
    const session: MockSession = {
      user: {
        role: "MANAGER",
        permissions: { ...DEFAULT_PERMISSIONS, can_manage_leads: false },
      },
    };
    expect(hasPermission(session, "can_manage_leads")).toBe(false);
  });
});

describe("hasAnyPermission", () => {
  it("should return true if any permission matches", () => {
    const session: MockSession = {
      user: {
        role: "MANAGER",
        permissions: { ...DEFAULT_PERMISSIONS, can_manage_finance: true },
      },
    };
    expect(
      hasAnyPermission(session, ["can_manage_leads", "can_manage_finance"])
    ).toBe(true);
  });

  it("should return false if no permissions match", () => {
    const session: MockSession = {
      user: {
        role: "MANAGER",
        permissions: DEFAULT_PERMISSIONS,
      },
    };
    expect(
      hasAnyPermission(session, ["can_manage_leads", "can_manage_finance"])
    ).toBe(false);
  });
});
