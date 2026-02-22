import { describe, it, expect } from "vitest";
import {
  createTaskSchema,
  createPropertySchema,
  createOwnerSchema,
} from "../lib/validators";

const VALID_UUID = "00000000-0000-0000-0000-000000000001";

describe("createTaskSchema", () => {
  const base = {
    property_id: VALID_UUID,
    scheduled_date: "2026-03-01",
  };

  it("should fail for CLEANING task without assigned_to", () => {
    const result = createTaskSchema.safeParse({ ...base, task_type: "CLEANING" });
    expect(result.success).toBe(false);
  });

  it("should pass for CLEANING task with assigned_to", () => {
    const result = createTaskSchema.safeParse({
      ...base,
      task_type: "CLEANING",
      assigned_to: VALID_UUID,
    });
    expect(result.success).toBe(true);
  });

  it("should pass for MAINTENANCE task without assigned_to", () => {
    const result = createTaskSchema.safeParse({
      ...base,
      task_type: "MAINTENANCE",
    });
    expect(result.success).toBe(true);
  });

  it("should fail for EXTERNAL assignee_type without external_assignee_id", () => {
    const result = createTaskSchema.safeParse({
      ...base,
      task_type: "MAINTENANCE",
      assignee_type: "EXTERNAL",
    });
    expect(result.success).toBe(false);
  });

  it("should pass for EXTERNAL assignee_type with external_assignee_id", () => {
    const result = createTaskSchema.safeParse({
      ...base,
      task_type: "MAINTENANCE",
      assignee_type: "EXTERNAL",
      external_assignee_id: VALID_UUID,
    });
    expect(result.success).toBe(true);
  });

  it("should fail for invalid task_type value", () => {
    const result = createTaskSchema.safeParse({
      ...base,
      task_type: "INVALID_TYPE",
      assigned_to: VALID_UUID,
    });
    expect(result.success).toBe(false);
  });

  it("should fail when property_id is missing", () => {
    const result = createTaskSchema.safeParse({
      scheduled_date: "2026-03-01",
      task_type: "MAINTENANCE",
    });
    expect(result.success).toBe(false);
  });

  it("should pass for PREPARATION task with title, no assigned_to", () => {
    const result = createTaskSchema.safeParse({
      ...base,
      task_type: "PREPARATION",
      title: "Preparazione appartamento",
    });
    expect(result.success).toBe(true);
  });
});

describe("createPropertySchema", () => {
  const valid = {
    name: "Appartamento Centro",
    code: "APP001",
    address: "Via Roma 15",
    property_type: "APPARTAMENTO" as const,
  };

  it("should fail when name is missing", () => {
    const { name: _, ...rest } = valid;
    const result = createPropertySchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("should fail when code is missing", () => {
    const { code: _, ...rest } = valid;
    const result = createPropertySchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("should pass with valid minimal fields", () => {
    const result = createPropertySchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should fail when bedroom_count is negative", () => {
    const result = createPropertySchema.safeParse({ ...valid, bedroom_count: -1 });
    expect(result.success).toBe(false);
  });

  it("should pass with optional numeric fields", () => {
    const result = createPropertySchema.safeParse({
      ...valid,
      bedroom_count: 2,
      bathroom_count: 1,
      max_guests: 4,
      floor_area_sqm: 65.5,
    });
    expect(result.success).toBe(true);
  });
});

describe("createOwnerSchema", () => {
  it("should pass with only name", () => {
    const result = createOwnerSchema.safeParse({ name: "Mario Rossi" });
    expect(result.success).toBe(true);
  });

  it("should fail with empty name", () => {
    const result = createOwnerSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("should pass with all optional fields", () => {
    const result = createOwnerSchema.safeParse({
      name: "Mario Rossi",
      email: "mario@test.com",
      phone: "+39 333 1234567",
      fiscal_code: "RSSMRA80A01H501Z",
      iban: "IT60X0542811101000000123456",
      notes: "Proprietario storico",
    });
    expect(result.success).toBe(true);
  });

  it("should fail with invalid email format", () => {
    const result = createOwnerSchema.safeParse({
      name: "Mario Rossi",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});
