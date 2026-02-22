"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  getWeekDays,
  toDateKey,
  groupTasksByDate,
  getHourSlots,
  getTaskTimeSlot,
} from "@/lib/calendar-utils";
import { DraggableTaskChip } from "./draggable-task-chip";
import { DroppableDay } from "./droppable-day";
import { DAY_NAMES } from "./constants";
import type { TaskListItem } from "@/hooks/use-tasks";

interface WeekViewProps {
  weekStart: Date;
  tasks: TaskListItem[];
  onDayClick: (dateKey: string) => void;
}

const HOUR_START = 8;
const HOUR_END = 19;

export function WeekView({ weekStart, tasks, onDayClick }: WeekViewProps) {
  const days = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const taskMap = useMemo(() => groupTasksByDate(tasks), [tasks]);
  const hourSlots = useMemo(() => getHourSlots(HOUR_START, HOUR_END), []);
  const todayKey = toDateKey(new Date());

  // Separate all-day tasks from timed tasks per day
  const dayData = useMemo(() => {
    return days.map((day) => {
      const key = toDateKey(day);
      const dayTasks = taskMap.get(key) ?? [];
      const allDay: TaskListItem[] = [];
      const timed = new Map<number, TaskListItem[]>();

      for (const task of dayTasks) {
        const hour = getTaskTimeSlot(task.start_time);
        if (hour !== null && hour >= HOUR_START && hour <= HOUR_END) {
          if (!timed.has(hour)) timed.set(hour, []);
          timed.get(hour)!.push(task);
        } else {
          allDay.push(task);
        }
      }

      return { key, day, allDay, timed };
    });
  }, [days, taskMap]);

  return (
    <div className="rounded-md border overflow-x-auto">
      <table className="w-full text-sm border-collapse min-w-[720px]">
        <thead>
          <tr className="bg-muted/50 border-b">
            <th className="px-2 py-2 text-left font-medium border-r w-16 min-w-[64px]" />
            {dayData.map((d, i) => {
              const isToday = d.key === todayKey;
              return (
                <th
                  key={d.key}
                  className={cn(
                    "px-2 py-2 text-center font-medium border-r last:border-r-0 min-w-[100px] cursor-pointer hover:bg-muted/30",
                    isToday && "bg-blue-50 text-blue-700"
                  )}
                  onClick={() => onDayClick(d.key)}
                >
                  <div className="text-xs font-semibold">{DAY_NAMES[i]}</div>
                  <div
                    className={cn(
                      "text-xs font-normal mt-0.5",
                      isToday ? "text-blue-600" : "text-muted-foreground"
                    )}
                  >
                    {d.day.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })}
                  </div>
                </th>
              );
            })}
          </tr>

          {/* All-day row */}
          <tr className="border-b bg-muted/20">
            <td className="px-2 py-1 text-xs text-muted-foreground border-r align-top">
              Tutto<br />il giorno
            </td>
            {dayData.map((d) => (
              <td key={d.key} className="px-1 py-1 border-r last:border-r-0 align-top">
                <DroppableDay dateKey={d.key} className="flex flex-col gap-0.5 min-h-[28px]">
                  {d.allDay.map((task) => (
                    <DraggableTaskChip key={task.id} task={task} variant="detailed" />
                  ))}
                </DroppableDay>
              </td>
            ))}
          </tr>
        </thead>

        <tbody>
          {hourSlots.map((slot) => {
            const hour = parseInt(slot.split(":")[0], 10);
            return (
              <tr key={slot} className="border-b last:border-b-0 hover:bg-muted/10">
                <td className="px-2 py-1 text-xs text-muted-foreground border-r align-top">
                  {slot}
                </td>
                {dayData.map((d) => {
                  const slotTasks = d.timed.get(hour) ?? [];
                  return (
                    <td key={d.key} className="px-1 py-1 border-r last:border-r-0 align-top min-h-[32px]">
                      <DroppableDay dateKey={d.key} className="flex flex-col gap-0.5">
                        {slotTasks.map((task) => (
                          <DraggableTaskChip key={task.id} task={task} variant="detailed" />
                        ))}
                      </DroppableDay>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
