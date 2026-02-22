"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTasks, useDeleteTask } from "@/hooks/use-tasks";
import { CreateTaskDialog } from "@/components/manager/create-task-dialog";
import { TaskCalendar } from "@/components/manager/task-calendar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardList, Trash2, List, CalendarDays, Building2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarView } from "@/components/manager/calendar/calendar-filters";

type PageView = "list" | "month" | "week" | "property";

const TASK_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  CLEANING: { label: "Pulizia", emoji: "\u{1F9F9}" },
  PREPARATION: { label: "Preparazione", emoji: "\u{1F3E0}" },
  MAINTENANCE: { label: "Manutenzione", emoji: "\u{1F527}" },
  INSPECTION: { label: "Ispezione", emoji: "\u{1F50D}" },
  KEY_HANDOVER: { label: "Consegna chiavi", emoji: "\u{1F5DD}\u{FE0F}" },
  OTHER: { label: "Altro", emoji: "\u{1F4CB}" },
};

const VIEW_OPTIONS: { value: PageView; label: string; icon: React.ElementType }[] = [
  { value: "list", label: "Lista", icon: List },
  { value: "month", label: "Mese", icon: Calendar },
  { value: "week", label: "Settimana", icon: CalendarDays },
  { value: "property", label: "Immobile", icon: Building2 },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ManagerTasksPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const viewParam = (searchParams.get("view") ?? "list") as PageView;
  const view = VIEW_OPTIONS.some((o) => o.value === viewParam) ? viewParam : "list";

  const [typeFilter, setTypeFilter] = useState<string>("");
  const { data: tasks, isLoading } = useTasks(
    view === "list" && typeFilter ? { task_type: typeFilter } : {}
  );
  const deleteTask = useDeleteTask();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function setView(v: PageView) {
    const params = new URLSearchParams(searchParams.toString());
    if (v === "list") {
      params.delete("view");
    } else {
      params.set("view", v);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const isCalendarView = view !== "list";
  const calView: CalendarView = view === "list" ? "month" : (view as CalendarView);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Task</h1>
        <div className="flex items-center gap-2">
          {/* Type filter — only in list view */}
          {view === "list" && (
            <Select value={typeFilter || "ALL"} onValueChange={(v) => setTypeFilter(v === "ALL" ? "" : v)}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Tutti i tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tutti i tipi</SelectItem>
                {Object.entries(TASK_TYPE_LABELS).map(([value, { label, emoji }]) => (
                  <SelectItem key={value} value={value}>
                    {emoji} {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* View toggle */}
          <div className="flex rounded-md border overflow-hidden">
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setView(opt.value)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors border-l first:border-l-0",
                  view === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                )}
              >
                <opt.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{opt.label}</span>
              </button>
            ))}
          </div>

          <CreateTaskDialog />
        </div>
      </div>

      {isCalendarView ? (
        <TaskCalendar calView={calView} />
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Caricamento...</p>
      ) : !tasks?.length ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
          <ClipboardList className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nessun task presente. Crea il primo task per iniziare.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Immobile</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Assegnato a</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => {
                const typeInfo = TASK_TYPE_LABELS[task.task_type] ?? TASK_TYPE_LABELS.OTHER;
                return (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Link
                        href={`/manager/tasks/${task.id}`}
                        className="font-medium hover:underline"
                      >
                        {task.task_type !== "CLEANING" && task.title ? task.title : task.property.name}
                      </Link>
                      <div className="mt-0.5">
                        <Badge variant="outline" className="text-xs">
                          {task.property.code}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">{typeInfo.emoji} {typeInfo.label}</span>
                    </TableCell>
                    <TableCell>
                      {task.operator
                        ? `${task.operator.first_name} ${task.operator.last_name}`
                        : task.external_assignee
                        ? <span>{task.external_assignee.name}</span>
                        : <span className="text-muted-foreground italic">Non assegnato</span>}
                    </TableCell>
                    <TableCell>{formatDate(task.scheduled_date)}</TableCell>
                    <TableCell>
                      <StatusBadge status={task.status} />
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDeleteId(task.id); }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Elimina task</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare questo task? L&apos;azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              disabled={deleteTask.isPending}
              onClick={async () => {
                if (deleteId) {
                  await deleteTask.mutateAsync(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              {deleteTask.isPending ? "Eliminazione..." : "Elimina"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
