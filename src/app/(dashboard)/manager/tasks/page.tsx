"use client";

import Link from "next/link";
import { useTasks } from "@/hooks/use-tasks";
import { CreateTaskDialog } from "@/components/manager/create-task-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClipboardList } from "lucide-react";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ManagerTasksPage() {
  const { data: tasks, isLoading } = useTasks();

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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
