"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { toDateKey, groupTasksByPropertyAndDate } from "@/lib/calendar-utils";
import { TaskChip } from "./task-chip";
import { DAY_NAMES } from "./constants";
import type { TaskListItem } from "@/hooks/use-tasks";
import type { PropertyListItem } from "@/hooks/use-properties";

interface PropertyViewProps {
  year: number;
  month: number;
  tasks: TaskListItem[];
  properties: PropertyListItem[];
  onCellClick?: (propertyId: string, dateKey: string) => void;
}

function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

export function PropertyView({ year, month, tasks, properties, onCellClick }: PropertyViewProps) {
  const days = useMemo(() => getMonthDays(year, month), [year, month]);
  const taskMap = useMemo(() => groupTasksByPropertyAndDate(tasks), [tasks]);
  const todayKey = toDateKey(new Date());

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm border-collapse" style={{ minWidth: `${160 + days.length * 90}px` }}>
        <thead>
          <tr className="bg-muted/50 border-b">
            <th className="px-3 py-2.5 text-left font-medium border-r w-44 min-w-[160px] sticky left-0 bg-muted/50 z-10">
              Immobile
            </th>
            {days.map((day) => {
              const key = toDateKey(day);
              const isToday = key === todayKey;
              const dayOfWeek = day.getDay() === 0 ? 6 : day.getDay() - 1; // Mon=0
              return (
                <th
                  key={key}
                  className={cn(
                    "px-1 py-2 text-center font-medium border-r last:border-r-0 min-w-[80px]",
                    isToday && "bg-blue-50 text-blue-700"
                  )}
                >
                  <div className="text-[10px] font-semibold">{DAY_NAMES[dayOfWeek]}</div>
                  <div
                    className={cn(
                      "text-[10px] font-normal",
                      isToday ? "text-blue-600" : "text-muted-foreground"
                    )}
                  >
                    {day.getDate()}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {properties.length === 0 ? (
            <tr>
              <td
                colSpan={1 + days.length}
                className="px-3 py-8 text-center text-sm text-muted-foreground"
              >
                Nessun immobile trovato
              </td>
            </tr>
          ) : (
            properties.map((property) => (
              <tr key={property.id} className="border-t hover:bg-muted/20 transition-colors">
                <td className="px-3 py-2 border-r sticky left-0 bg-background z-10">
                  <div className="font-medium truncate max-w-[160px]" title={property.name}>
                    {property.name}
                  </div>
                  <div className="text-xs text-muted-foreground">{property.code}</div>
                </td>
                {days.map((day) => {
                  const key = toDateKey(day);
                  const isToday = key === todayKey;
                  const cellTasks = taskMap.get(property.id)?.get(key) ?? [];
                  return (
                    <td
                      key={key}
                      className={cn(
                        "px-1 py-1 border-r last:border-r-0 align-top cursor-pointer hover:bg-muted/30",
                        isToday && "bg-blue-50/30"
                      )}
                      onClick={() => onCellClick?.(property.id, key)}
                    >
                      <div className="flex flex-col gap-0.5 min-h-[36px]">
                        {cellTasks.map((task) => (
                          <TaskChip key={task.id} task={task} variant="compact" />
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
