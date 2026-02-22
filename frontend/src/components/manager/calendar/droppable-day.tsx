"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface DroppableDayProps {
  dateKey: string;
  children: React.ReactNode;
  className?: string;
}

export function DroppableDay({ dateKey, children, className }: DroppableDayProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dateKey}`,
    data: { dateKey },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[36px] transition-colors",
        isOver && "ring-2 ring-primary/50 bg-primary/5 rounded",
        className
      )}
    >
      {children}
    </div>
  );
}
