"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TaskListItem } from "@/hooks/use-tasks";
import type { PropertyListItem } from "@/hooks/use-properties";

const DAY_NAMES = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

const STATUS_COLORS: Record<string, string> = {
  TODO: "bg-slate-100 text-slate-700 border-slate-200",
  IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-200",
  COMPLETED: "bg-yellow-100 text-yellow-800 border-yellow-200",
  APPROVED: "bg-green-100 text-green-700 border-green-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
  DONE: "bg-green-100 text-green-700 border-green-200",
};

const STATUS_LABELS: Record<string, string> = {
  TODO: "Da fare",
  IN_PROGRESS: "In corso",
  COMPLETED: "Completato",
  APPROVED: "Approvato",
  REJECTED: "Respinto",
  DONE: "Completato",
};

const TASK_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  CLEANING: { label: "Pulizia", emoji: "🧹" },
  PREPARATION: { label: "Preparazione", emoji: "🏠" },
  MAINTENANCE: { label: "Manutenzione", emoji: "🔧" },
  INSPECTION: { label: "Ispezione", emoji: "🔍" },
  KEY_HANDOVER: { label: "Consegna chiavi", emoji: "🗝️" },
  OTHER: { label: "Altro", emoji: "📋" },
};

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
}

interface TaskCalendarProps {
  tasks: TaskListItem[];
  properties: PropertyListItem[];
}

export function TaskCalendar({ tasks, properties }: TaskCalendarProps) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const days = getWeekDays(weekStart);
  const todayKey = toDateKey(new Date());

  // Build map: propertyId → dayKey → tasks[]
  const taskMap = useMemo(() => {
    const map = new Map<string, Map<string, TaskListItem[]>>();
    for (const task of tasks) {
      // scheduled_date may come as "2025-02-18T00:00:00.000Z" or "2025-02-18"
      const dayKey = task.scheduled_date.slice(0, 10);
      if (!map.has(task.property_id)) map.set(task.property_id, new Map());
      const propMap = map.get(task.property_id)!;
      if (!propMap.has(dayKey)) propMap.set(dayKey, []);
      propMap.get(dayKey)!.push(task);
    }
    return map;
  }, [tasks]);

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const rangeLabel = `${days[0].toLocaleDateString("it-IT", { day: "2-digit", month: "long" })} – ${days[6].toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}`;

  return (
    <div className="space-y-3">
      {/* Week navigation */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={prevWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setWeekStart(getMonday(new Date()))}>
          Oggi
        </Button>
        <Button variant="outline" size="sm" onClick={nextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground ml-1">{rangeLabel}</span>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm border-collapse min-w-[720px]">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="px-3 py-2.5 text-left font-medium border-r w-44 min-w-[160px] sticky left-0 bg-muted/50 z-10">
                Immobile
              </th>
              {days.map((day, i) => {
                const key = toDateKey(day);
                const isToday = key === todayKey;
                return (
                  <th
                    key={key}
                    className={cn(
                      "px-2 py-2 text-center font-medium border-r last:border-r-0 min-w-[110px]",
                      isToday && "bg-blue-50 text-blue-700"
                    )}
                  >
                    <div className="text-xs font-semibold">{DAY_NAMES[i]}</div>
                    <div
                      className={cn(
                        "text-xs font-normal mt-0.5",
                        isToday ? "text-blue-600" : "text-muted-foreground"
                      )}
                    >
                      {day.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })}
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
                  colSpan={8}
                  className="px-3 py-8 text-center text-sm text-muted-foreground"
                >
                  Nessun immobile trovato
                </td>
              </tr>
            ) : (
              properties.map((property) => (
                <tr key={property.id} className="border-t hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2 border-r sticky left-0 bg-background z-10">
                    <div
                      className="font-medium truncate max-w-[160px]"
                      title={property.name}
                    >
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
                          "px-1 py-1.5 border-r last:border-r-0 align-top",
                          isToday && "bg-blue-50/30"
                        )}
                      >
                        <div className="flex flex-col gap-0.5 min-h-[36px]">
                          {cellTasks.map((task) => {
                            const typeInfo = TASK_TYPE_LABELS[task.task_type] ?? TASK_TYPE_LABELS.OTHER;
                            const assigneeLabel = task.operator
                              ? `${task.operator.first_name} ${task.operator.last_name.charAt(0)}.`
                              : task.external_assignee
                              ? task.external_assignee.name
                              : (task.title ?? "—");
                            return (
                            <Link key={task.id} href={`/manager/tasks/${task.id}`}>
                              <div
                                className={cn(
                                  "rounded px-1.5 py-0.5 text-xs border truncate cursor-pointer hover:opacity-75 transition-opacity",
                                  STATUS_COLORS[task.status] ??
                                    "bg-gray-100 text-gray-700 border-gray-200"
                                )}
                                title={`${typeInfo.label}: ${assigneeLabel} – ${STATUS_LABELS[task.status] ?? task.status}`}
                              >
                                {typeInfo.emoji} {assigneeLabel}
                              </div>
                            </Link>
                            );
                          })}
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

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-1">
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div
              className={cn(
                "h-3 w-3 rounded border",
                STATUS_COLORS[status] ?? "bg-gray-100 border-gray-200"
              )}
            />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
