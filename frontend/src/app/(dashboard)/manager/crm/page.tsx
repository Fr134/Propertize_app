"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, FileText } from "lucide-react";
import Link from "next/link";
import { fetchJson } from "@/lib/fetch";
import { useLeads, type LeadListItem } from "@/hooks/use-leads";
import { KanbanColumn } from "@/components/manager/crm/kanban-column";
import { LeadCard } from "@/components/manager/crm/lead-card";
import { CreateLeadSheet } from "@/components/manager/crm/create-lead-sheet";
import { LEAD_STATUS_COLUMNS } from "@/components/manager/crm/constants";

export default function CrmPage() {
  const { data: leads = [], isLoading } = useLeads();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeLead, setActiveLead] = useState<LeadListItem | null>(null);
  const [wonDialogLead, setWonDialogLead] = useState<LeadListItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const lead = event.active.data.current?.lead as LeadListItem | undefined;
    setActiveLead(lead ?? null);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveLead(null);
      const { active, over } = event;
      if (!over) return;

      const lead = active.data.current?.lead as LeadListItem | undefined;
      if (!lead) return;

      const targetStatus = over.data.current?.status as string | undefined;
      if (!targetStatus || targetStatus === lead.status) return;

      // Block direct drag to WON
      if (targetStatus === "WON") {
        setWonDialogLead(lead);
        return;
      }

      // Optimistic update
      queryClient.setQueryData<LeadListItem[]>(["leads", undefined], (old) =>
        old?.map((l) => (l.id === lead.id ? { ...l, status: targetStatus, updated_at: new Date().toISOString() } : l))
      );

      try {
        await fetchJson(`/api/crm/leads/${lead.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: targetStatus }),
        });
        queryClient.invalidateQueries({ queryKey: ["leads"] });
      } catch {
        // Revert on error
        queryClient.invalidateQueries({ queryKey: ["leads"] });
      }
    },
    [queryClient]
  );

  // Group leads by status
  const leadsByStatus: Record<string, LeadListItem[]> = {};
  for (const status of LEAD_STATUS_COLUMNS) {
    leadsByStatus[status] = [];
  }
  for (const lead of leads) {
    if (leadsByStatus[lead.status]) {
      leadsByStatus[lead.status].push(lead);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Caricamento...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM</h1>
          <p className="text-sm text-muted-foreground">
            Gestisci i lead e il processo di acquisizione proprietari
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/manager/crm/analisi">
              <FileText className="mr-2 h-4 w-4" />
              Analisi
            </Link>
          </Button>
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuovo lead
          </Button>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {LEAD_STATUS_COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              leads={leadsByStatus[status]}
            />
          ))}
          <DragOverlay>
            {activeLead && <LeadCard lead={activeLead} />}
          </DragOverlay>
        </DndContext>
      </div>

      <CreateLeadSheet open={sheetOpen} onOpenChange={setSheetOpen} />

      <AlertDialog
        open={!!wonDialogLead}
        onOpenChange={(open) => !open && setWonDialogLead(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conversione necessaria</AlertDialogTitle>
            <AlertDialogDescription>
              Per segnare come vinto devi prima convertire il lead in proprietario.
              Vai alla scheda lead?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (wonDialogLead) {
                  router.push(`/manager/crm/leads/${wonDialogLead.id}`);
                }
                setWonDialogLead(null);
              }}
            >
              Vai al lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
