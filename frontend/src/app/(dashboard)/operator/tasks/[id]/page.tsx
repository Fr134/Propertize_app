"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useTask, useStartTask, useCompleteTask, useDoneTask, useUpdateChecklistItem, parseChecklist } from "@/hooks/use-tasks";
import { ChecklistItemRow } from "@/components/operator/checklist-item-row";
import { PropertySupplySelector } from "@/components/operator/property-supply-selector";
import { LinenStatusUpdater } from "@/components/operator/linen-status-updater";
import { CreateReportDialog } from "@/components/operator/create-report-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SupplyUsageRow } from "@/components/operator/supply-usage-row";
import { ArrowLeft, MapPin, Play, Send, RotateCcw, PackageCheck, Square, CheckSquare2, CheckCheck, Clock } from "lucide-react";

const TASK_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  CLEANING: { label: "Pulizia", emoji: "🧹" },
  PREPARATION: { label: "Preparazione", emoji: "🏠" },
  MAINTENANCE: { label: "Manutenzione", emoji: "🔧" },
  INSPECTION: { label: "Ispezione", emoji: "🔍" },
  KEY_HANDOVER: { label: "Consegna chiavi", emoji: "🗝️" },
  OTHER: { label: "Altro", emoji: "📋" },
};

export default function OperatorTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: task, isLoading } = useTask(id);
  const startTask = useStartTask();
  const completeTask = useCompleteTask();
  const doneTask = useDoneTask();
  const updateChecklist = useUpdateChecklistItem(id);
  const [completeError, setCompleteError] = useState("");

  if (isLoading) return <p className="text-sm text-muted-foreground">Caricamento...</p>;
  if (!task) return <p className="text-sm text-destructive">Task non trovato.</p>;

  const { areas: checklist, staySupplies } = parseChecklist(task.checklist_data);
  const isCleaning = task.task_type === "CLEANING";
  const typeInfo = TASK_TYPE_LABELS[task.task_type] ?? TASK_TYPE_LABELS.OTHER;
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

  async function toggleSupply(supplyId: string, currentChecked: boolean) {
    if (!isEditable) return;
    await updateChecklist.mutateAsync({
      type: "SUPPLY_TOGGLE",
      supplyId,
      checked: !currentChecked,
    });
  }

  async function handleSupplyUsageUpdate(supplyId: string, checked: boolean, qtyUsed: number) {
    if (!isEditable) return;
    await updateChecklist.mutateAsync({
      type: "SUPPLY_QTY_UPDATE",
      supplyId,
      checked,
      qtyUsed,
    });
  }

  // Count total items: areas + all sub-tasks
  const totalItems = checklist.reduce(
    (sum, i) => sum + 1 + (i.subTasks?.length ?? 0),
    0
  );
  const completedItems = checklist.reduce(
    (sum, i) =>
      sum +
      (i.completed ? 1 : 0) +
      (i.subTasks?.filter((st) => st.completed).length ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/operator"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">
            {!isCleaning && task.title ? task.title : task.property.name}
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />{task.property.address}
            <Badge variant="outline" className="text-xs">{task.property.code}</Badge>
          </div>
          {(task.start_time || task.end_time) && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {task.start_time ?? "—"} – {task.end_time ?? "—"}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {typeInfo.emoji} {typeInfo.label}
          </Badge>
          <StatusBadge status={task.status} />
        </div>
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

      {task.reopen_note && (
        <Card className="border-orange-300 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-800">
              <RotateCcw className="h-4 w-4" />
              Nota dal manager — da correggere
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-900">{task.reopen_note}</p>
          </CardContent>
        </Card>
      )}

      {/* Start button */}
      {canStart && (
        <Button onClick={handleStart} disabled={startTask.isPending} className="w-full">
          <Play className="mr-2 h-4 w-4" />
          {startTask.isPending ? "Avvio..." : isCleaning ? "Inizia pulizia" : "Inizia task"}
        </Button>
      )}

      {/* CLEANING-specific sections */}
      {isCleaning && (
        <>
          {/* Checklist */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Checklist</h2>
              {checklist.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {completedItems}/{totalItems} completati
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

          {/* Stay Supplies */}
          {staySupplies.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Scorte soggiorno</h2>
                <span className="text-sm text-muted-foreground">
                  {staySupplies.filter((s) => s.checked).length}/{staySupplies.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {staySupplies.map((supply) =>
                  supply.supplyItemId ? (
                    <SupplyUsageRow
                      key={supply.id}
                      supply={supply}
                      onUpdate={handleSupplyUsageUpdate}
                      disabled={!isEditable || updateChecklist.isPending}
                    />
                  ) : (
                    <button
                      key={supply.id}
                      type="button"
                      onClick={() => toggleSupply(supply.id, supply.checked)}
                      disabled={!isEditable || updateChecklist.isPending}
                      className="flex items-center gap-2 w-full text-left rounded-md border p-2.5 disabled:opacity-50"
                    >
                      {supply.checked ? (
                        <CheckSquare2 className="h-4 w-4 text-green-600 shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          supply.checked ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {supply.text}
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Supplies & Linen */}
          {(isEditable || task.status === "COMPLETED" || task.status === "APPROVED") && (
            <>
              <Separator />
              <PropertySupplySelector
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

          {/* Complete button (CLEANING → sends to manager for review) */}
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
        </>
      )}

      {/* Non-CLEANING: simple done button */}
      {!isCleaning && canComplete && (
        <Button
          onClick={() => doneTask.mutateAsync(id)}
          disabled={doneTask.isPending}
          className="w-full"
          variant="default"
        >
          <CheckCheck className="mr-2 h-4 w-4" />
          {doneTask.isPending ? "Completamento..." : "Segna come completato"}
        </Button>
      )}

      {!isCleaning && task.status === "DONE" && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="py-3 text-center">
            <p className="text-sm font-medium text-green-800">Task completato</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
