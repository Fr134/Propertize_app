"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ChevronRight, ChevronLeft, CalendarDays, MapPin } from "lucide-react";
import { useUnscheduledTasks, useRescheduleTask } from "@/hooks/use-tasks";
import { TASK_TYPE_LABELS } from "./constants";
import { cn } from "@/lib/utils";
import { it } from "date-fns/locale";

interface UnscheduledPanelProps {
  className?: string;
}

export function UnscheduledPanel({ className }: UnscheduledPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const { data: tasks } = useUnscheduledTasks();
  const reschedule = useRescheduleTask();
  const count = tasks?.length ?? 0;

  async function handleSchedule(taskId: string, date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    await reschedule.mutateAsync({
      id: taskId,
      data: { scheduled_date: `${y}-${m}-${d}` },
    });
  }

  if (count === 0) return null;

  return (
    <div className={cn("relative flex", className)}>
      {/* Collapsed tab */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1 px-2 py-3 bg-orange-50 border border-orange-200 rounded-l-md text-xs font-medium text-orange-700 hover:bg-orange-100 transition-colors"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        >
          <CalendarDays className="h-3 w-3 mb-1" style={{ transform: "rotate(90deg)" }} />
          Da schedulare ({count})
        </button>
      )}

      {/* Expanded panel */}
      {expanded && (
        <div className="w-[280px] border rounded-md bg-background shadow-sm">
          <div className="flex items-center justify-between px-3 py-2 border-b bg-orange-50">
            <span className="text-sm font-medium text-orange-700">
              Da schedulare ({count})
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setExpanded(false)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="max-h-[500px] overflow-y-auto p-2 space-y-2">
            {tasks?.map((task) => {
              const typeInfo = TASK_TYPE_LABELS[task.task_type] ?? TASK_TYPE_LABELS.OTHER;
              return (
                <div key={task.id} className="rounded border p-2 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{typeInfo.emoji}</span>
                    <span className="text-xs font-medium truncate">
                      {task.title ?? typeInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MapPin className="h-2.5 w-2.5" />
                    {task.property.name}
                    <Badge variant="outline" className="text-[9px] ml-1 px-1">
                      {task.property.code}
                    </Badge>
                  </div>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] w-full">
                        <CalendarDays className="h-3 w-3 mr-1" />
                        Schedula
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        locale={it}
                        onSelect={(date) => {
                          if (date) handleSchedule(task.id, date);
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
