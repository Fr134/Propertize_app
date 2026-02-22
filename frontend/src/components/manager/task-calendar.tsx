"use client";

import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTasks, useRescheduleTask } from "@/hooks/use-tasks";
import { useProperties } from "@/hooks/use-properties";
import type { TaskListItem } from "@/hooks/use-tasks";
import type { PropertyListItem } from "@/hooks/use-properties";
import {
  getMonday,
  getMonthDateRange,
  getWeekDateRange,
  formatMonthLabel,
  toDateKey,
  getWeekDays,
} from "@/lib/calendar-utils";
import { MonthView } from "./calendar/month-view";
import { WeekView } from "./calendar/week-view";
import { PropertyView } from "./calendar/property-view";
import { DayDetailSheet } from "./calendar/day-detail-sheet";
import { UnscheduledPanel } from "./calendar/unscheduled-panel";
import { CalendarFilters, type CalendarView } from "./calendar/calendar-filters";
import { TaskChip } from "./calendar/task-chip";
import { STATUS_LABELS, STATUS_COLORS } from "./calendar/constants";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

interface TaskCalendarProps {
  calView: CalendarView;
}

export function TaskCalendar({ calView }: TaskCalendarProps) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Navigation state
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [weekStart, setWeekStart] = useState(() => getMonday(now));

  // Day detail sheet
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // DnD
  const [activeDragTask, setActiveDragTask] = useState<TaskListItem | null>(null);
  const reschedule = useRescheduleTask();

  // Compute date range for fetch
  const dateRange = useMemo(() => {
    if (calView === "week") return getWeekDateRange(weekStart);
    return getMonthDateRange(year, month);
  }, [calView, year, month, weekStart]);

  // Fetch tasks for the visible range
  const { data: tasks = [] } = useTasks({
    date_from: dateRange.from,
    date_to: dateRange.to,
  });

  // Properties for property view
  const { data: propertiesData } = useProperties();
  const properties: PropertyListItem[] = useMemo(
    () => propertiesData ?? [],
    [propertiesData]
  );

  // Read filter params
  const selectedTypes = searchParams.get("types")?.split(",").filter(Boolean) ?? [];

  // Client-side filter
  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (selectedTypes.length > 0) {
      result = result.filter((t) => selectedTypes.includes(t.task_type));
    }
    return result;
  }, [tasks, selectedTypes]);

  // Navigation handlers
  const prevMonth = useCallback(() => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }, [month]);

  const nextMonth = useCallback(() => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }, [month]);

  const goToday = useCallback(() => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setWeekStart(getMonday(today));
  }, []);

  const prevWeek = useCallback(() => {
    setWeekStart((ws) => {
      const d = new Date(ws);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }, []);

  const nextWeek = useCallback(() => {
    setWeekStart((ws) => {
      const d = new Date(ws);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }, []);

  // Navigation label
  const navLabel = useMemo(() => {
    if (calView === "week") {
      const days = getWeekDays(weekStart);
      return `${days[0].toLocaleDateString("it-IT", { day: "2-digit", month: "long" })} – ${days[6].toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}`;
    }
    return formatMonthLabel(year, month);
  }, [calView, year, month, weekStart]);

  // DnD handlers
  function handleDragStart(event: DragStartEvent) {
    const task = event.active.data.current?.task as TaskListItem | undefined;
    if (task) setActiveDragTask(task);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragTask(null);
    const { active, over } = event;
    if (!over) return;

    const task = active.data.current?.task as TaskListItem | undefined;
    const dateKey = over.data.current?.dateKey as string | undefined;
    if (!task || !dateKey) return;

    const oldDateKey = task.scheduled_date.slice(0, 10);
    if (oldDateKey === dateKey) return;

    // Optimistic update
    queryClient.setQueriesData<TaskListItem[]>(
      { queryKey: ["tasks"] },
      (old) => {
        if (!old) return old;
        return old.map((t) =>
          t.id === task.id ? { ...t, scheduled_date: dateKey, is_scheduled: true } : t
        );
      }
    );

    // API call
    reschedule.mutate(
      { id: task.id, data: { scheduled_date: dateKey } },
      {
        onError: () => {
          // Revert on error
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
        },
      }
    );
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <CalendarFilters currentView={calView} />

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={calView === "week" ? prevWeek : prevMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={goToday}>
          Oggi
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={calView === "week" ? nextWeek : nextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground ml-1">{navLabel}</span>
      </div>

      {/* Main content with unscheduled panel */}
      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {calView === "month" && (
              <MonthView
                year={year}
                month={month}
                tasks={filteredTasks}
                onDayClick={setSelectedDay}
              />
            )}
            {calView === "week" && (
              <WeekView
                weekStart={weekStart}
                tasks={filteredTasks}
                onDayClick={setSelectedDay}
              />
            )}
            {calView === "property" && (
              <PropertyView
                year={year}
                month={month}
                tasks={filteredTasks}
                properties={properties}
                onCellClick={(_, dateKey) => setSelectedDay(dateKey)}
              />
            )}

            {/* Drag overlay ghost */}
            <DragOverlay>
              {activeDragTask && (
                <TaskChip
                  task={activeDragTask}
                  variant={calView === "week" ? "detailed" : "compact"}
                  isDragging
                  className="shadow-lg"
                />
              )}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Unscheduled tasks panel */}
        <UnscheduledPanel />
      </div>

      {/* Day detail sheet */}
      <DayDetailSheet
        dateKey={selectedDay}
        tasks={filteredTasks}
        onClose={() => setSelectedDay(null)}
      />

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
