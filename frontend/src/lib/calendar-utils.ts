/**
 * Pure utility functions for calendar views.
 * All date manipulation is timezone-agnostic (local dates only).
 */

// ---- Date helpers ----

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Return the Monday of the week containing `date`. */
export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Return 7 dates starting from `weekStart` (should be a Monday). */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
}

// ---- Month grid ----

export interface DayCell {
  date: Date;
  dateKey: string;
  isCurrentMonth: boolean;
}

/**
 * Build a grid of 5–6 rows × 7 columns for a month view.
 * Weeks start on Monday (ISO).
 */
export function getMonthGrid(year: number, month: number): DayCell[][] {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const start = getMonday(firstOfMonth);

  const rows: DayCell[][] = [];
  const cursor = new Date(start);

  // Generate rows until we pass end of month AND cursor is past Sunday of that week
  while (true) {
    const row: DayCell[] = [];
    for (let i = 0; i < 7; i++) {
      row.push({
        date: new Date(cursor),
        dateKey: toDateKey(cursor),
        isCurrentMonth: cursor.getMonth() === month,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    rows.push(row);
    // Stop after we've passed the last day of the month
    if (cursor > lastOfMonth && rows.length >= 5) break;
    if (rows.length >= 6) break; // safety cap
  }

  return rows;
}

/** Inclusive date range for API: first cell → last cell of month grid. */
export function getMonthDateRange(
  year: number,
  month: number
): { from: string; to: string } {
  const grid = getMonthGrid(year, month);
  return {
    from: grid[0][0].dateKey,
    to: grid[grid.length - 1][6].dateKey,
  };
}

/** Inclusive date range for API: Mon → Sun. */
export function getWeekDateRange(weekStart: Date): { from: string; to: string } {
  const days = getWeekDays(weekStart);
  return {
    from: toDateKey(days[0]),
    to: toDateKey(days[6]),
  };
}

// ---- Hour slots ----

/** Generate hour labels: ["08:00", "09:00", ...] */
export function getHourSlots(startHour: number, endHour: number): string[] {
  const slots: string[] = [];
  for (let h = startHour; h <= endHour; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
  }
  return slots;
}

/**
 * Parse a task's start_time into an hour number.
 * Handles both ISO strings and "HH:MM" strings.
 */
export function getTaskTimeSlot(startTime: string | null | undefined): number | null {
  if (!startTime) return null;
  // ISO: "1970-01-01T08:00:00.000Z"
  if (startTime.includes("T")) {
    const d = new Date(startTime);
    return d.getUTCHours();
  }
  // "HH:MM"
  const parts = startTime.split(":");
  if (parts.length >= 2) {
    const hour = parseInt(parts[0], 10);
    return isNaN(hour) ? null : hour;
  }
  return null;
}

// ---- Task grouping ----

export interface TaskLike {
  id: string;
  scheduled_date: string;
  property_id: string;
}

/** Group tasks by dateKey. */
export function groupTasksByDate<T extends TaskLike>(
  tasks: T[]
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const task of tasks) {
    const key = task.scheduled_date.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(task);
  }
  return map;
}

/** Group tasks by property_id → dateKey → tasks[]. */
export function groupTasksByPropertyAndDate<T extends TaskLike>(
  tasks: T[]
): Map<string, Map<string, T[]>> {
  const map = new Map<string, Map<string, T[]>>();
  for (const task of tasks) {
    const dayKey = task.scheduled_date.slice(0, 10);
    if (!map.has(task.property_id)) map.set(task.property_id, new Map());
    const propMap = map.get(task.property_id)!;
    if (!propMap.has(dayKey)) propMap.set(dayKey, []);
    propMap.get(dayKey)!.push(task);
  }
  return map;
}

// ---- Overflow ----

/** Count how many items exceed `max`. Returns 0 when within limit. */
export function getOverflowCount(items: unknown[], max: number): number {
  return items.length > max ? items.length - max : 0;
}

// ---- Formatting ----

const MONTH_NAMES = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

export function formatMonthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`;
}
