import { describe, it, expect } from "vitest";
import { submitAnalysisSchema, updateAnalysisSchema } from "../lib/validators";

describe("submitAnalysisSchema", () => {
  const validBase = {
    client_name: "Mario Rossi",
    client_email: "mario@test.com",
    property_address: "Via Roma 1, Milano",
    property_type: "APPARTAMENTO",
    bedroom_count: 2,
    bathroom_count: 1,
  };

  it("should fail when client_name is missing", () => {
    const { client_name: _, ...data } = validBase;
    void _;
    const result = submitAnalysisSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should fail when client_email is missing", () => {
    const { client_email: _, ...data } = validBase;
    void _;
    const result = submitAnalysisSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should fail when property_address is missing", () => {
    const { property_address: _, ...data } = validBase;
    void _;
    const result = submitAnalysisSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should pass with valid minimal data", () => {
    const result = submitAnalysisSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });
});

describe("updateAnalysisSchema", () => {
  it("should fail with occupancy > 100", () => {
    const result = updateAnalysisSchema.safeParse({
      estimated_occupancy: 150,
    });
    expect(result.success).toBe(false);
  });

  it("should pass with valid occupancy", () => {
    const result = updateAnalysisSchema.safeParse({
      estimated_occupancy: 75,
      status: "IN_PROGRESS",
    });
    expect(result.success).toBe(true);
  });
});
