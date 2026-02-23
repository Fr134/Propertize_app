"use client";

import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LEAD_STATUS_LABELS } from "./constants";
import { LeadCard } from "./lead-card";
import type { LeadListItem } from "@/hooks/use-leads";

interface KanbanColumnProps {
  status: string;
  leads: LeadListItem[];
}

export function KanbanColumn({ status, leads }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: { status },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-lg border bg-muted/30 min-w-[260px] w-[260px] shrink-0",
        isOver && "ring-2 ring-primary/50"
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-xs font-semibold uppercase tracking-wide">
          {LEAD_STATUS_LABELS[status] ?? status}
        </span>
        <Badge variant="secondary" className="h-5 text-xs px-1.5">
          {leads.length}
        </Badge>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-220px)]">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}
