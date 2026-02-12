"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useTask, useStartTask, useCompleteTask } from "@/hooks/use-tasks";
import { ChecklistItemRow } from "@/components/operator/checklist-item-row";
import { SupplyLevelSelector } from "@/components/operator/supply-level-selector";
import { LinenStatusUpdater } from "@/components/operator/linen-status-updater";
import { CreateReportDialog } from "@/components/operator/create-report-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MapPin, Play, Send } from "lucide-react";

export default function OperatorTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: task, isLoading } = useTask(id);
  const startTask = useStartTask();
  const completeTask = useCompleteTask();
  const [completeError, setCompleteError] = useState("");

  if (isLoading) return <p className="text-sm text-muted-foreground">Caricamento...</p>;
  if (!task) return <p className="text-sm text-destructive">Task non trovato.</p>;

  const checklist = task.checklist_data ?? [];
  const isEditable = task.status === "IN_PROGRESS";
  const canStart = task.status === "TODO";
  const canComplete = task.status === "IN_PROGRESS";

  async function handleStart() {
    await startTask.mutateAsync(id);
  }

  async function handleComplete() {
    setCompleteError("");
    try {
      await completeTask.mutateAsync(id);
    } catch (err) {
      setCompleteError(err instanceof Error ? err.message : "Errore");
    }
  }

  const completedCount = checklist.filter((i) => i.completed).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/operator"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">{task.property.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />{task.property.address}
            <Badge variant="outline" className="text-xs">{task.property.code}</Badge>
          </div>
        </div>
        <StatusBadge status={task.status} />
      </div>

      {task.notes && (
        <Card>
          <CardContent className="py-3">
            <p className="text-sm text-muted-foreground">{task.notes}</p>
          </CardContent>
        </Card>
      )}

      {task.rejection_notes && (
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Motivo rifiuto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{task.rejection_notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Start button */}
      {canStart && (
        <Button onClick={handleStart} disabled={startTask.isPending} className="w-full">
          <Play className="mr-2 h-4 w-4" />
          {startTask.isPending ? "Avvio..." : "Inizia pulizia"}
        </Button>
      )}

      {/* Checklist */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Checklist</h2>
          {checklist.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {completedCount}/{checklist.length} completati
            </span>
          )}
        </div>

        {checklist.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessuna checklist.</p>
        ) : (
          <div className="space-y-3">
            {checklist.map((item, index) => (
              <ChecklistItemRow
                key={index}
                taskId={id}
                index={index}
                item={item}
                disabled={!isEditable}
              />
            ))}
          </div>
        )}
      </div>

      {/* Supplies & Linen */}
      {(isEditable || task.status === "COMPLETED" || task.status === "APPROVED") && (
        <>
          <Separator />
          <SupplyLevelSelector
            propertyId={task.property_id}
            taskId={id}
            disabled={!isEditable}
          />
          <LinenStatusUpdater
            propertyId={task.property_id}
            disabled={!isEditable}
          />
        </>
      )}

      {/* Report button */}
      {isEditable && (
        <>
          <Separator />
          <CreateReportDialog propertyId={task.property_id} taskId={id} />
        </>
      )}

      {/* Complete button */}
      {canComplete && (
        <div className="space-y-2">
          {completeError && (
            <p className="text-sm text-destructive">{completeError}</p>
          )}
          <Button
            onClick={handleComplete}
            disabled={completeTask.isPending}
            className="w-full"
            variant="default"
          >
            <Send className="mr-2 h-4 w-4" />
            {completeTask.isPending ? "Invio..." : "Invia task completato"}
          </Button>
        </div>
      )}

      {task.status === "COMPLETED" && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="py-3 text-center">
            <p className="text-sm font-medium text-yellow-800">In attesa di approvazione dal manager</p>
          </CardContent>
        </Card>
      )}

      {task.status === "APPROVED" && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="py-3 text-center">
            <p className="text-sm font-medium text-green-800">Task approvato</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
