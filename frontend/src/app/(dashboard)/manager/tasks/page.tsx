"use client";

import { useState } from "react";
import Link from "next/link";
import { useTasks, useDeleteTask } from "@/hooks/use-tasks";
import { useProperties } from "@/hooks/use-properties";
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
import { ClipboardList, Trash2, List, CalendarDays } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const TASK_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  CLEANING: { label: "Pulizia", emoji: "🧹" },
  PREPARATION: { label: "Preparazione", emoji: "🏠" },
  MAINTENANCE: { label: "Manutenzione", emoji: "🔧" },
  INSPECTION: { label: "Ispezione", emoji: "🔍" },
  KEY_HANDOVER: { label: "Consegna chiavi", emoji: "🗝️" },
  OTHER: { label: "Altro", emoji: "📋" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ManagerTasksPage() {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const { data: tasks, isLoading } = useTasks(typeFilter ? { task_type: typeFilter } : {});
  const { data: properties } = useProperties();
  const deleteTask = useDeleteTask();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "calendar">("list");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Task</h1>
        <div className="flex items-center gap-2">
          {/* Type filter */}
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v === "ALL" ? "" : v)}>
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
          {/* View toggle */}
          <div className="flex rounded-md border overflow-hidden">
            <button
              onClick={() => setView("list")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors",
                view === "list"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted"
              )}
            >
              <List className="h-3.5 w-3.5" />
              Lista
            </button>
            <button
              onClick={() => setView("calendar")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors border-l",
                view === "calendar"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted"
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Calendario
            </button>
          </div>
          <CreateTaskDialog />
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Caricamento...</p>
      ) : view === "calendar" ? (
        <TaskCalendar tasks={tasks ?? []} properties={properties ?? []} />
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
