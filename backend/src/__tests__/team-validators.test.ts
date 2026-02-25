import { describe, it, expect } from "vitest";
import {
  inviteTeamMemberSchema,
  updatePermissionsSchema,
  resetPasswordSchema,
} from "../lib/validators";

describe("inviteTeamMemberSchema", () => {
  const validInput = {
    email: "test@example.com",
    password: "secret123",
    first_name: "Mario",
    last_name: "Rossi",
    role: "MANAGER" as const,
    can_manage_leads: true,
    can_do_analysis: false,
    can_manage_operations: false,
    can_manage_finance: false,
    can_manage_team: false,
    can_manage_onboarding: false,
  };

  it("should pass with valid MANAGER input", () => {
    const result = inviteTeamMemberSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("should pass with OPERATOR role", () => {
    const result = inviteTeamMemberSchema.safeParse({
      ...validInput,
      role: "OPERATOR",
    });
    expect(result.success).toBe(true);
  });

  it("should fail with invalid email", () => {
    const result = inviteTeamMemberSchema.safeParse({
      ...validInput,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("should fail with short password", () => {
    const result = inviteTeamMemberSchema.safeParse({
      ...validInput,
      password: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("should fail with empty first_name", () => {
    const result = inviteTeamMemberSchema.safeParse({
      ...validInput,
      first_name: "",
    });
    expect(result.success).toBe(false);
  });

  it("should fail with invalid role", () => {
    const result = inviteTeamMemberSchema.safeParse({
      ...validInput,
      role: "ADMIN",
    });
    expect(result.success).toBe(false);
  });
});

describe("updatePermissionsSchema", () => {
  it("should pass with all permission booleans", () => {
    const result = updatePermissionsSchema.safeParse({
      can_manage_leads: true,
      can_do_analysis: false,
      can_manage_operations: true,
      can_manage_finance: false,
      can_manage_team: false,
      can_manage_onboarding: true,
    });
    expect(result.success).toBe(true);
  });

  it("should pass with partial permissions", () => {
    const result = updatePermissionsSchema.safeParse({
      can_manage_leads: true,
    });
    expect(result.success).toBe(true);
  });

  it("should pass with empty object", () => {
    const result = updatePermissionsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should fail with non-boolean value", () => {
    const result = updatePermissionsSchema.safeParse({
      can_manage_leads: "yes",
    });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("should pass with valid password", () => {
    const result = resetPasswordSchema.safeParse({ password: "newpass123" });
    expect(result.success).toBe(true);
  });

  it("should fail with short password", () => {
    const result = resetPasswordSchema.safeParse({ password: "abc" });
    expect(result.success).toBe(false);
  });

  it("should fail without password", () => {
    const result = resetPasswordSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
