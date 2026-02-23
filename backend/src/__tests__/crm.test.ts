import { describe, it, expect } from "vitest";
import { createLeadSchema, createCallSchema } from "../lib/validators";

describe("createLeadSchema", () => {
  it("should fail when first_name is missing", () => {
    const result = createLeadSchema.safeParse({
      last_name: "Rossi",
      source: "MANUAL",
    });
    expect(result.success).toBe(false);
  });

  it("should fail when last_name is missing", () => {
    const result = createLeadSchema.safeParse({
      first_name: "Mario",
      source: "MANUAL",
    });
    expect(result.success).toBe(false);
  });

  it("should pass with valid minimal input", () => {
    const result = createLeadSchema.safeParse({
      first_name: "Mario",
      last_name: "Rossi",
    });
    expect(result.success).toBe(true);
  });

  it("should fail with invalid status", () => {
    const result = createLeadSchema.safeParse({
      first_name: "Mario",
      last_name: "Rossi",
      status: "INVALID_STATUS",
    });
    expect(result.success).toBe(false);
  });
});

describe("createCallSchema", () => {
  it("should fail when notes is missing", () => {
    const result = createCallSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("should pass with valid notes", () => {
    const result = createCallSchema.safeParse({
      notes: "Chiamata di follow-up",
    });
    expect(result.success).toBe(true);
  });
});
