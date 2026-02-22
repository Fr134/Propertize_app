"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin } from "lucide-react";
import { STATUS_COLORS, STATUS_LABELS, TASK_TYPE_LABELS } from "./constants";
import { cn } from "@/lib/utils";
import type { TaskListItem } from "@/hooks/use-tasks";

interface DayDetailSheetProps {
  dateKey: string | null;
  tasks: TaskListItem[];
  onClose: () => void;
}

function formatDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("it-IT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getAssigneeLabel(task: TaskListItem): string {
  if (task.operator) {
    return `${task.operator.first_name} ${task.operator.last_name}`;
  }
  if (task.external_assignee) {
    return task.external_assignee.name;
  }
  return "Non assegnato";
}

export function DayDetailSheet({ dateKey, tasks, onClose }: DayDetailSheetProps) {
  const dayTasks = dateKey
    ? tasks.filter((t) => t.scheduled_date.slice(0, 10) === dateKey)
    : [];

  return (
    <Sheet open={!!dateKey} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-[380px] sm:w-[420px]">
        <SheetHeader>
          <SheetTitle>
            {dateKey ? formatDateLabel(dateKey) : ""}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {dayTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nessun task per questo giorno.
            </p>
          ) : (
            dayTasks.map((task) => {
              const typeInfo = TASK_TYPE_LABELS[task.task_type] ?? TASK_TYPE_LABELS.OTHER;
              return (
                <div
                  key={task.id}
                  className="rounded-md border p-3 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{typeInfo.emoji}</span>
                        <span className="text-sm font-medium">
                          {task.title ?? typeInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {task.property.name}
                        <Badge variant="outline" className="text-[10px] ml-1">
                          {task.property.code}
                        </Badge>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] shrink-0",
                        STATUS_COLORS[task.status]
                      )}
                    >
                      {STATUS_LABELS[task.status] ?? task.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {getAssigneeLabel(task)}
                    </span>
                    <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                      <Link href={`/manager/tasks/${task.id}`}>
                        Dettaglio <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
