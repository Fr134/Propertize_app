"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_TYPE_LABELS } from "./constants";

export type CalendarView = "month" | "week" | "property";

const TASK_TYPES = Object.entries(TASK_TYPE_LABELS);

interface CalendarFiltersProps {
  currentView: CalendarView;
}

export function CalendarFilters({ currentView }: CalendarFiltersProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const selectedTypes = searchParams.get("types")?.split(",").filter(Boolean) ?? [];
  const selectedAssignee = searchParams.get("assignee") ?? "";

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  function toggleType(type: string) {
    const current = new Set(selectedTypes);
    if (current.has(type)) {
      current.delete(type);
    } else {
      current.add(type);
    }
    setParam("types", Array.from(current).join(","));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Task type chips */}
      <div className="flex flex-wrap gap-1">
        {TASK_TYPES.map(([key, { label, emoji }]) => {
          const active = selectedTypes.length === 0 || selectedTypes.includes(key);
          return (
            <Badge
              key={key}
              variant={active ? "default" : "outline"}
              className="cursor-pointer select-none text-xs"
              onClick={() => toggleType(key)}
            >
              {emoji} {label}
            </Badge>
          );
        })}
      </div>

      {/* Assignee filter — placeholder for future, just clears */}
      {selectedAssignee && (
        <Badge
          variant="secondary"
          className="cursor-pointer text-xs"
          onClick={() => setParam("assignee", "")}
        >
          Assegnatario: filtrato &times;
        </Badge>
      )}
    </div>
  );
}
