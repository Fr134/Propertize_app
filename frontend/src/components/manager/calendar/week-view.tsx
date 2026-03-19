"use client";

import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import {
  getWeekDays,
  toDateKey,
  groupTasksByDate,
  getTaskTimeSlot,
} from "@/lib/calendar-utils";
import { DraggableTaskChip } from "./draggable-task-chip";
import { DAY_NAMES } from "./constants";
import type { TaskListItem } from "@/hooks/use-tasks";

interface WeekViewProps {
  weekStart: Date;
  tasks: TaskListItem[];
  onDayClick: (dateKey: string) => void;
}

const HOUR_START = 8;
const HOUR_END = 20;
const SLOT_HEIGHT = 60; // px per hour

function getTaskMinutes(startTime: string | null | undefined): number {
  if (!startTime) return 0;
  if (startTime.includes("T")) {
    const d = new Date(startTime);
    return d.getUTCMinutes();
  }
  const parts = startTime.split(":");
  return parts.length >= 2 ? parseInt(parts[1], 10) || 0 : 0;
}

function DroppableHourSlot({
  dateKey,
  hour,
  children,
}: {
  dateKey: string;
  hour: number;
  children?: React.ReactNode;
}) {
  const id = `slot-${dateKey}-${hour}`;
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { dateKey, hour },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border-b border-r last:border-r-0 relative",
        isOver && "bg-primary/10"
      )}
      style={{ height: SLOT_HEIGHT }}
    >
      {children}
    </div>
  );
}

export function WeekView({ weekStart, tasks, onDayClick }: WeekViewProps) {
  const days = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const taskMap = useMemo(() => groupTasksByDate(tasks), [tasks]);
  const todayKey = toDateKey(new Date());
  const hours = useMemo(() => {
    const h: number[] = [];
    for (let i = HOUR_START; i < HOUR_END; i++) h.push(i);
    return h;
  }, []);

  const dayData = useMemo(() => {
    return days.map((day) => {
      const key = toDateKey(day);
      const dayTasks = taskMap.get(key) ?? [];
      const allDay: TaskListItem[] = [];
      const timed: TaskListItem[] = [];

      for (const task of dayTasks) {
        const hour = getTaskTimeSlot(task.start_time);
        if (hour !== null && hour >= HOUR_START && hour < HOUR_END) {
          timed.push(task);
        } else {
          allDay.push(task);
        }
      }

      return { key, day, allDay, timed };
    });
  }, [days, taskMap]);

  return (
    <div className="rounded-md border overflow-x-auto">
      {/* Header */}
      <div className="grid grid-cols-[64px_repeat(7,1fr)] bg-muted/50 border-b">
        <div className="px-2 py-2 border-r" />
        {dayData.map((d, i) => {
          const isToday = d.key === todayKey;
          return (
            <div
              key={d.key}
              className={cn(
                "px-2 py-2 text-center border-r last:border-r-0 cursor-pointer hover:bg-muted/30",
                isToday && "bg-blue-50 text-blue-700"
              )}
              onClick={() => onDayClick(d.key)}
            >
              <div className="text-xs font-semibold">{DAY_NAMES[i]}</div>
              <div className={cn("text-xs mt-0.5", isToday ? "text-blue-600" : "text-muted-foreground")}>
                {d.day.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day row */}
      <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b bg-muted/20">
        <div className="px-2 py-1 text-xs text-muted-foreground border-r flex items-center">
          Tutto<br />il giorno
        </div>
        {dayData.map((d) => (
          <div key={d.key} className="px-1 py-1 border-r last:border-r-0 min-h-[32px]">
            <div className="flex flex-col gap-0.5">
              {d.allDay.map((task) => (
                <DraggableTaskChip key={task.id} task={task} variant="detailed" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="grid grid-cols-[64px_repeat(7,1fr)]">
        {/* Hour labels column */}
        <div>
          {hours.map((hour) => (
            <div
              key={hour}
              className="px-2 text-xs text-muted-foreground border-r border-b flex items-start pt-1"
              style={{ height: SLOT_HEIGHT }}
            >
              {String(hour).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* Day columns */}
        {dayData.map((d) => (
          <div key={d.key} className="relative">
            {/* Droppable hour slots */}
            {hours.map((hour) => (
              <DroppableHourSlot key={hour} dateKey={d.key} hour={hour} />
            ))}

            {/* Positioned tasks overlay */}
            {d.timed.map((task) => {
              const hour = getTaskTimeSlot(task.start_time) ?? HOUR_START;
              const mins = getTaskMinutes(task.start_time);
              const duration = task.duration_minutes ?? 60;
              const top = (hour - HOUR_START) * SLOT_HEIGHT + (mins / 60) * SLOT_HEIGHT;
              const height = Math.max((duration / 60) * SLOT_HEIGHT, 24);

              return (
                <div
                  key={task.id}
                  className="absolute left-0.5 right-0.5 z-10"
                  style={{ top, height }}
                >
                  <DraggableTaskChip task={task} variant="detailed" />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
