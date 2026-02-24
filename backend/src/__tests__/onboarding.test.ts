import { describe, it, expect } from "vitest";
import { DEFAULT_ONBOARDING_STEPS } from "../lib/onboarding-defaults";

describe("DEFAULT_ONBOARDING_STEPS", () => {
  it("should have 8 steps", () => {
    expect(DEFAULT_ONBOARDING_STEPS).toHaveLength(8);
  });

  it("should have unique step_keys", () => {
    const keys = DEFAULT_ONBOARDING_STEPS.map((s) => s.step_key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("should have sequential order values starting from 1", () => {
    const orders = DEFAULT_ONBOARDING_STEPS.map((s) => s.order);
    expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("should include expected step_keys", () => {
    const keys = DEFAULT_ONBOARDING_STEPS.map((s) => s.step_key);
    expect(keys).toContain("contract_signed");
    expect(keys).toContain("onboarding_file_completed");
    expect(keys).toContain("property_created");
    expect(keys).toContain("masterfile_completed");
    expect(keys).toContain("checklist_created");
    expect(keys).toContain("photos_done");
    expect(keys).toContain("listings_published");
    expect(keys).toContain("first_booking");
  });

  it("should have label and description for every step", () => {
    for (const step of DEFAULT_ONBOARDING_STEPS) {
      expect(step.label).toBeTruthy();
      expect(step.description).toBeTruthy();
    }
  });
});
