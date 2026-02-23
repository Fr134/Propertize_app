"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MasterfileSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  storageKey?: string;
}

export function MasterfileSection({
  title,
  icon,
  children,
  defaultOpen = true,
  storageKey,
}: MasterfileSectionProps) {
  const [open, setOpen] = useState(() => {
    if (storageKey && typeof window !== "undefined") {
      const stored = localStorage.getItem(`mf-section-${storageKey}`);
      if (stored !== null) return stored === "true";
    }
    return defaultOpen;
  });

  function handleToggle(next: boolean) {
    setOpen(next);
    if (storageKey) {
      localStorage.setItem(`mf-section-${storageKey}`, String(next));
    }
  }

  return (
    <Collapsible open={open} onOpenChange={handleToggle}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center gap-2 text-base">
              {icon}
              <span className="flex-1">{title}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  open && "rotate-180"
                )}
              />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
