"use client";

import { useState } from "react";
import Link from "next/link";
import { useTasks, useDeleteTask } from "@/hooks/use-tasks";
import { CreateTaskDialog } from "@/components/manager/create-task-dialog";
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
import { ClipboardList, Trash2 } from "lucide-react";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ManagerTasksPage() {
  const { data: tasks, isLoading } = useTasks();
  const deleteTask = useDeleteTask();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Task</h1>
        <CreateTaskDialog />
      </div>

      {isLoading ? (
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
                <TableHead>Operatrice</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <Link
                      href={`/manager/tasks/${task.id}`}
                      className="font-medium hover:underline"
                    >
                      {task.property.name}
                    </Link>
                    <div className="mt-0.5">
                      <Badge variant="outline" className="text-xs">
                        {task.property.code}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {task.operator.first_name} {task.operator.last_name}
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
              ))}
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
