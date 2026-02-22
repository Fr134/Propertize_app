import { describe, it, expect } from "vitest";
import {
  toDateKey,
  getMonday,
  getWeekDays,
  getMonthGrid,
  getMonthDateRange,
  getWeekDateRange,
  getHourSlots,
  getTaskTimeSlot,
  groupTasksByDate,
  groupTasksByPropertyAndDate,
  getOverflowCount,
  formatMonthLabel,
} from "../lib/calendar-utils";

describe("toDateKey", () => {
  it("should format a date as YYYY-MM-DD", () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("should pad single-digit month and day", () => {
    expect(toDateKey(new Date(2026, 1, 3))).toBe("2026-02-03");
  });

  it("should handle December 31 correctly", () => {
    expect(toDateKey(new Date(2025, 11, 31))).toBe("2025-12-31");
  });
});

describe("getMonday", () => {
  it("should return Monday for a Wednesday", () => {
    // 2026-02-18 is a Wednesday
    const result = getMonday(new Date(2026, 1, 18));
    expect(toDateKey(result)).toBe("2026-02-16");
  });

  it("should return same day for a Monday", () => {
    // 2026-02-16 is a Monday
    const result = getMonday(new Date(2026, 1, 16));
    expect(toDateKey(result)).toBe("2026-02-16");
  });

  it("should return previous Monday for a Sunday", () => {
    // 2026-02-22 is a Sunday
    const result = getMonday(new Date(2026, 1, 22));
    expect(toDateKey(result)).toBe("2026-02-16");
  });

  it("should handle month boundary (Sunday March 1)", () => {
    // 2026-03-01 is a Sunday
    const result = getMonday(new Date(2026, 2, 1));
    expect(toDateKey(result)).toBe("2026-02-23");
  });
});

describe("getWeekDays", () => {
  it("should return 7 days starting from Monday", () => {
    const monday = new Date(2026, 1, 16);
    const days = getWeekDays(monday);
    expect(days).toHaveLength(7);
    expect(toDateKey(days[0])).toBe("2026-02-16"); // Mon
    expect(toDateKey(days[6])).toBe("2026-02-22"); // Sun
  });
});

describe("getMonthGrid", () => {
  it("should produce rows of 7 DayCells each", () => {
    const grid = getMonthGrid(2026, 1); // February 2026
    for (const row of grid) {
      expect(row).toHaveLength(7);
    }
  });

  it("should have 5 or 6 rows", () => {
    const grid = getMonthGrid(2026, 1);
    expect(grid.length).toBeGreaterThanOrEqual(5);
    expect(grid.length).toBeLessThanOrEqual(6);
  });

  it("should start on a Monday", () => {
    const grid = getMonthGrid(2026, 1);
    // First cell should be a Monday
    expect(grid[0][0].date.getDay()).toBe(1); // 1 = Monday
  });

  it("should mark current month cells correctly", () => {
    const grid = getMonthGrid(2026, 1); // February 2026
    // February 1 (Sunday) — first row should include Jan days marked as not current month
    const firstRow = grid[0];
    const febCells = firstRow.filter((c) => c.isCurrentMonth);
    const nonFebCells = firstRow.filter((c) => !c.isCurrentMonth);
    expect(febCells.length + nonFebCells.length).toBe(7);
  });

  it("should handle a month starting on Monday (June 2026)", () => {
    // June 2026 starts on Monday
    const grid = getMonthGrid(2026, 5);
    expect(grid[0][0].dateKey).toBe("2026-06-01");
    expect(grid[0][0].isCurrentMonth).toBe(true);
  });
});

describe("getMonthDateRange", () => {
  it("should return range covering the grid padding", () => {
    const range = getMonthDateRange(2026, 1); // February 2026
    // Feb 1 is Sunday, so Monday before is Jan 26
    expect(range.from <= "2026-02-01").toBe(true);
    expect(range.to >= "2026-02-28").toBe(true);
  });
});

describe("getWeekDateRange", () => {
  it("should return Mon-Sun range", () => {
    const range = getWeekDateRange(new Date(2026, 1, 16));
    expect(range.from).toBe("2026-02-16");
    expect(range.to).toBe("2026-02-22");
  });
});

describe("getHourSlots", () => {
  it("should generate labels from start to end", () => {
    const slots = getHourSlots(8, 11);
    expect(slots).toEqual(["08:00", "09:00", "10:00", "11:00"]);
  });

  it("should return single slot when start equals end", () => {
    expect(getHourSlots(14, 14)).toEqual(["14:00"]);
  });
});

describe("getTaskTimeSlot", () => {
  it("should return hour from ISO string", () => {
    expect(getTaskTimeSlot("1970-01-01T08:00:00.000Z")).toBe(8);
  });

  it("should return hour from HH:MM string", () => {
    expect(getTaskTimeSlot("14:30")).toBe(14);
  });

  it("should return null for null/undefined", () => {
    expect(getTaskTimeSlot(null)).toBeNull();
    expect(getTaskTimeSlot(undefined)).toBeNull();
  });

  it("should return null for invalid string", () => {
    expect(getTaskTimeSlot("invalid")).toBeNull();
  });
});

describe("groupTasksByDate", () => {
  const makeTask = (id: string, date: string, propId = "p1") => ({
    id,
    scheduled_date: date,
    property_id: propId,
  });

  it("should return empty map for empty array", () => {
    const result = groupTasksByDate([]);
    expect(result.size).toBe(0);
  });

  it("should group tasks with same date", () => {
    const t1 = makeTask("1", "2026-02-18");
    const t2 = makeTask("2", "2026-02-18");
    const result = groupTasksByDate([t1, t2]);
    expect(result.size).toBe(1);
    expect(result.get("2026-02-18")).toHaveLength(2);
  });

  it("should separate tasks with different dates", () => {
    const t1 = makeTask("1", "2026-02-18");
    const t2 = makeTask("2", "2026-02-19");
    const result = groupTasksByDate([t1, t2]);
    expect(result.size).toBe(2);
    expect(result.get("2026-02-18")).toHaveLength(1);
    expect(result.get("2026-02-19")).toHaveLength(1);
  });

  it("should handle ISO date strings with time", () => {
    const t1 = makeTask("1", "2026-02-18T00:00:00.000Z");
    const result = groupTasksByDate([t1]);
    expect(result.get("2026-02-18")).toHaveLength(1);
  });
});

describe("groupTasksByPropertyAndDate", () => {
  const makeTask = (id: string, date: string, propId: string) => ({
    id,
    scheduled_date: date,
    property_id: propId,
  });

  it("should group by property then date", () => {
    const tasks = [
      makeTask("1", "2026-02-18", "pA"),
      makeTask("2", "2026-02-18", "pA"),
      makeTask("3", "2026-02-18", "pB"),
      makeTask("4", "2026-02-19", "pA"),
    ];
    const result = groupTasksByPropertyAndDate(tasks);
    expect(result.size).toBe(2);
    expect(result.get("pA")!.get("2026-02-18")).toHaveLength(2);
    expect(result.get("pA")!.get("2026-02-19")).toHaveLength(1);
    expect(result.get("pB")!.get("2026-02-18")).toHaveLength(1);
  });
});

describe("getOverflowCount", () => {
  it("should return 0 when within limit", () => {
    expect(getOverflowCount([1, 2, 3], 3)).toBe(0);
  });

  it("should return excess count", () => {
    expect(getOverflowCount([1, 2, 3, 4], 3)).toBe(1);
  });

  it("should return 0 for empty array", () => {
    expect(getOverflowCount([], 3)).toBe(0);
  });
});

describe("formatMonthLabel", () => {
  it("should format month in Italian", () => {
    expect(formatMonthLabel(2026, 0)).toBe("Gennaio 2026");
    expect(formatMonthLabel(2026, 1)).toBe("Febbraio 2026");
    expect(formatMonthLabel(2026, 11)).toBe("Dicembre 2026");
  });
});
