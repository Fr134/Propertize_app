"use client";

import { useDraggable } from "@dnd-kit/core";
import { TaskChip } from "./task-chip";
import type { TaskListItem } from "@/hooks/use-tasks";

interface DraggableTaskChipProps {
  task: TaskListItem;
  variant?: "compact" | "detailed";
}

export function DraggableTaskChip({ task, variant = "compact" }: DraggableTaskChipProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  return (
    <TaskChip
      ref={setNodeRef}
      task={task}
      variant={variant}
      isDragging={isDragging}
      dragAttributes={attributes}
      dragListeners={listeners}
    />
  );
}
