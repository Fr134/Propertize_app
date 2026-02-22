import { describe, it, expect } from "vitest";
import { deriveLevel } from "../lib/supply-utils";

describe("deriveLevel (frontend)", () => {
  it("should return ESAURITO when qty_current is 0", () => {
    expect(deriveLevel({ qty_current: 0, low_threshold: 2 })).toBe("ESAURITO");
  });

  it("should return IN_ESAURIMENTO when qty_current is within low_threshold", () => {
    expect(deriveLevel({ qty_current: 1, low_threshold: 2 })).toBe("IN_ESAURIMENTO");
  });

  it("should return OK when qty_current exceeds low_threshold", () => {
    expect(deriveLevel({ qty_current: 5, low_threshold: 2 })).toBe("OK");
  });

  it("should return IN_ESAURIMENTO when qty_current equals low_threshold", () => {
    expect(deriveLevel({ qty_current: 2, low_threshold: 2 })).toBe("IN_ESAURIMENTO");
  });

  it("should return ESAURITO when both are 0", () => {
    expect(deriveLevel({ qty_current: 0, low_threshold: 0 })).toBe("ESAURITO");
  });

  it("should return ESAURITO for negative qty_current", () => {
    expect(deriveLevel({ qty_current: -3, low_threshold: 1 })).toBe("ESAURITO");
  });

  it("should return OK when low_threshold is 0 and qty_current is positive", () => {
    expect(deriveLevel({ qty_current: 1, low_threshold: 0 })).toBe("OK");
  });
});
