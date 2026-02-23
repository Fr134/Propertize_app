"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin, PhoneCall } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeadListItem } from "@/hooks/use-leads";

interface LeadCardProps {
  lead: LeadListItem;
}

function getDaysInStatus(updatedAt: string): number {
  const diff = Date.now() - new Date(updatedAt).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function LeadCard({ lead }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: lead.id, data: { lead } });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  const days = getDaysInStatus(lead.updated_at);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "rounded-md border bg-background p-3 shadow-sm cursor-grab active:cursor-grabbing space-y-1.5",
        isDragging && "opacity-50 shadow-lg z-50"
      )}
    >
      <Link
        href={`/manager/crm/leads/${lead.id}`}
        className="block font-medium text-sm hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {lead.first_name} {lead.last_name}
      </Link>

      {lead.phone && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Phone className="h-3 w-3" />
          {lead.phone}
        </div>
      )}

      {lead.property_address && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{lead.property_address}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-muted-foreground">
          {days === 0 ? "Oggi" : `${days}g`}
        </span>
        {lead._count.calls > 0 && (
          <Badge variant="secondary" className="h-5 text-xs px-1.5 gap-1">
            <PhoneCall className="h-3 w-3" />
            {lead._count.calls}
          </Badge>
        )}
      </div>
    </div>
  );
}
