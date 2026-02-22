"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { TaskListItem } from "@/hooks/use-tasks";
import { STATUS_COLORS, TASK_TYPE_LABELS } from "./constants";

interface TaskChipProps {
  task: TaskListItem;
  variant?: "compact" | "detailed";
  isDragging?: boolean;
  className?: string;
  // DnD props forwarded from draggable wrapper
  dragRef?: React.Ref<HTMLDivElement>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragAttributes?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragListeners?: any;
}

function getAssigneeLabel(task: TaskListItem): string {
  if (task.operator) {
    return `${task.operator.first_name} ${task.operator.last_name.charAt(0)}.`;
  }
  if (task.external_assignee) {
    return task.external_assignee.name;
  }
  return task.title ?? "\u2014";
}

export const TaskChip = forwardRef<HTMLDivElement, TaskChipProps>(
  function TaskChip(
    { task, variant = "compact", isDragging, className, dragAttributes, dragListeners },
    ref
  ) {
    const typeInfo = TASK_TYPE_LABELS[task.task_type] ?? TASK_TYPE_LABELS.OTHER;
    const assigneeLabel = getAssigneeLabel(task);

    const content =
      variant === "detailed" ? (
        <>
          {typeInfo.emoji} {task.property.code} &middot; {assigneeLabel}
        </>
      ) : (
        <>
          {typeInfo.emoji} {assigneeLabel}
        </>
      );

    const statusTitle = `${typeInfo.label}: ${assigneeLabel}`;

    return (
      <div
        ref={ref}
        {...dragAttributes}
        {...dragListeners}
        className={cn(
          "rounded px-1.5 py-0.5 text-xs border truncate cursor-pointer hover:opacity-75 transition-opacity",
          STATUS_COLORS[task.status] ?? "bg-gray-100 text-gray-700 border-gray-200",
          isDragging && "opacity-50 shadow-lg ring-2 ring-primary",
          className
        )}
        title={statusTitle}
      >
        <Link href={`/manager/tasks/${task.id}`} className="block truncate">
          {content}
        </Link>
      </div>
    );
  }
);
