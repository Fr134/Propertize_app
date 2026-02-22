"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { getMonthGrid, toDateKey, groupTasksByDate } from "@/lib/calendar-utils";
import { DraggableTaskChip } from "./draggable-task-chip";
import { DroppableDay } from "./droppable-day";
import { DAY_NAMES, MAX_CHIPS_MONTH } from "./constants";
import type { TaskListItem } from "@/hooks/use-tasks";

interface MonthViewProps {
  year: number;
  month: number;
  tasks: TaskListItem[];
  onDayClick: (dateKey: string) => void;
}

export function MonthView({ year, month, tasks, onDayClick }: MonthViewProps) {
  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);
  const taskMap = useMemo(() => groupTasksByDate(tasks), [tasks]);
  const todayKey = toDateKey(new Date());

  return (
    <div className="rounded-md border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 bg-muted/50 border-b">
        {DAY_NAMES.map((name) => (
          <div key={name} className="px-2 py-2 text-center text-xs font-semibold border-r last:border-r-0">
            {name}
          </div>
        ))}
      </div>

      {/* Body */}
      {grid.map((row, rowIdx) => (
        <div key={rowIdx} className="grid grid-cols-7 border-b last:border-b-0">
          {row.map((cell) => {
            const isToday = cell.dateKey === todayKey;
            const dayTasks = taskMap.get(cell.dateKey) ?? [];
            const overflow = dayTasks.length > MAX_CHIPS_MONTH ? dayTasks.length - MAX_CHIPS_MONTH : 0;
            const visibleTasks = overflow > 0 ? dayTasks.slice(0, MAX_CHIPS_MONTH) : dayTasks;

            return (
              <div
                key={cell.dateKey}
                className={cn(
                  "border-r last:border-r-0 min-h-[90px] p-1 cursor-pointer hover:bg-muted/20 transition-colors",
                  !cell.isCurrentMonth && "bg-muted/10 opacity-50",
                  isToday && "bg-blue-50/50"
                )}
                onClick={() => onDayClick(cell.dateKey)}
              >
                <div
                  className={cn(
                    "text-xs font-medium mb-1",
                    isToday ? "text-blue-600 font-bold" : "text-muted-foreground"
                  )}
                >
                  {cell.date.getDate()}
                </div>
                <DroppableDay dateKey={cell.dateKey} className="flex flex-col gap-0.5">
                  {visibleTasks.map((task) => (
                    <DraggableTaskChip key={task.id} task={task} variant="compact" />
                  ))}
                  {overflow > 0 && (
                    <div className="text-[10px] text-muted-foreground px-1 font-medium">
                      +{overflow} altri
                    </div>
                  )}
                </DroppableDay>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
