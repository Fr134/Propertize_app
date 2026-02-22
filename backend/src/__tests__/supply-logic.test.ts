import { describe, it, expect } from "vitest";
import { levelToQty, deriveLevel } from "../lib/supply-utils";

describe("levelToQty", () => {
  it("should return qtyStandard for OK level", () => {
    expect(levelToQty("OK", 10, 2)).toBe(10);
  });

  it("should return lowThreshold for IN_ESAURIMENTO level", () => {
    expect(levelToQty("IN_ESAURIMENTO", 10, 2)).toBe(2);
  });

  it("should return 0 for ESAURITO level", () => {
    expect(levelToQty("ESAURITO", 10, 2)).toBe(0);
  });

  it("should return 0 for unknown level string", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(levelToQty("UNKNOWN" as any, 10, 2)).toBe(0);
  });

  it("should handle zero qtyStandard for OK", () => {
    expect(levelToQty("OK", 0, 0)).toBe(0);
  });

  it("should handle large values", () => {
    expect(levelToQty("OK", 9999, 100)).toBe(9999);
    expect(levelToQty("IN_ESAURIMENTO", 9999, 100)).toBe(100);
  });
});

describe("deriveLevel (backend)", () => {
  it("should return ESAURITO when qty_current is 0", () => {
    expect(deriveLevel(0, 2)).toBe("ESAURITO");
  });

  it("should return IN_ESAURIMENTO when qty_current is within low_threshold", () => {
    expect(deriveLevel(1, 2)).toBe("IN_ESAURIMENTO");
  });

  it("should return OK when qty_current exceeds low_threshold", () => {
    expect(deriveLevel(5, 2)).toBe("OK");
  });

  it("should return IN_ESAURIMENTO when qty_current equals low_threshold", () => {
    expect(deriveLevel(2, 2)).toBe("IN_ESAURIMENTO");
  });

  it("should return ESAURITO when both are 0", () => {
    expect(deriveLevel(0, 0)).toBe("ESAURITO");
  });

  it("should return ESAURITO for negative qty_current", () => {
    expect(deriveLevel(-1, 2)).toBe("ESAURITO");
  });
});
