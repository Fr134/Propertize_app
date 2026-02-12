"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTasks } from "@/hooks/use-tasks";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, MapPin, ArrowRight } from "lucide-react";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function OperatorDashboardPage() {
  const { data: session } = useSession();
  const { data: tasks, isLoading } = useTasks();
  const firstName = session?.user?.name?.split(" ")[0] ?? "";

  // Split tasks
  const activeTasks = tasks?.filter((t) => t.status === "TODO" || t.status === "IN_PROGRESS") ?? [];
  const completedTasks = tasks?.filter((t) => t.status === "COMPLETED" || t.status === "APPROVED" || t.status === "REJECTED") ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        Ciao{firstName ? `, ${firstName}` : ""}
      </h1>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Task attivi</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Caricamento...</p>
        ) : activeTasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-8">
              <ClipboardList className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nessun task attivo.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {activeTasks.map((task) => (
              <Card key={task.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{task.property.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{formatDate(task.scheduled_date)}</span>
                        <Badge variant="outline" className="text-xs">{task.property.code}</Badge>
                      </div>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  {task.notes && (
                    <p className="mb-3 text-sm text-muted-foreground">{task.notes}</p>
                  )}
                  <Button asChild size="sm">
                    <Link href={`/operator/tasks/${task.id}`}>
                      {task.status === "TODO" ? "Inizia" : "Continua"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {completedTasks.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Completati</h2>
          <div className="grid gap-3">
            {completedTasks.map((task) => (
              <Card key={task.id} className="opacity-75">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{task.property.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{formatDate(task.scheduled_date)}</p>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
