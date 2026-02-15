"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useTask, parseChecklist } from "@/hooks/use-tasks";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, User, Calendar, Camera, CheckCircle2, Circle, ThumbsUp, ThumbsDown, RotateCcw, CheckSquare2, Square, PackageCheck } from "lucide-react";
import { TaskReviewModal } from "@/components/manager/task-review-modal";
import { TaskReopenModal } from "@/components/manager/task-reopen-modal";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ManagerTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: task, isLoading } = useTask(id);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState<"approve" | "reject">("approve");
  const [reopenModalOpen, setReopenModalOpen] = useState(false);

  if (isLoading) return <p className="text-sm text-muted-foreground">Caricamento...</p>;
  if (!task) return <p className="text-sm text-destructive">Task non trovato.</p>;

  const { areas: checklist, staySupplies } = parseChecklist(task.checklist_data);
  const canReview = task.status === "COMPLETED";

  const handleApprove = () => {
    setReviewMode("approve");
    setReviewModalOpen(true);
  };

  const handleReject = () => {
    setReviewMode("reject");
    setReviewModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/manager/tasks"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{task.property.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />{task.property.address}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={task.status} />
          {canReview && (
            <>
              <Button variant="outline" size="sm" onClick={handleReject}>
                <ThumbsDown className="mr-2 h-4 w-4" />
                Rigetta
              </Button>
              <Button variant="default" size="sm" onClick={handleApprove}>
                <ThumbsUp className="mr-2 h-4 w-4" />
                Approva
              </Button>
            </>
          )}
          {task.status === "REJECTED" && (
            <Button variant="outline" size="sm" onClick={() => setReopenModalOpen(true)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Riapri
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" /> Operatrice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{task.operator.first_name} {task.operator.last_name}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" /> Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{formatDate(task.scheduled_date)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Immobile</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{task.property.code}</Badge>
          </CardContent>
        </Card>
      </div>

      {task.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Note</CardTitle>
          </CardHeader>
          <CardContent>
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
        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Nota riapertura</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{task.reopen_note}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {checklist.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessuna checklist associata.</p>
          ) : (
            checklist.map((item, index) => (
              <div key={index} className="flex items-start gap-3 rounded-md border p-3">
                {item.completed ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600 shrink-0" />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{item.area}</p>
                    {item.photo_required && (
                      <Camera className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{item.description}</p>

                  {/* Sub-tasks */}
                  {item.subTasks && item.subTasks.length > 0 && (
                    <div className="mt-2 space-y-1 pl-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Punti checklist ({item.subTasks.filter((st) => st.completed).length}/{item.subTasks.length})
                      </p>
                      {item.subTasks.map((st) => (
                        <div key={st.id} className="flex items-center gap-2">
                          {st.completed ? (
                            <CheckSquare2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                          ) : (
                            <Square className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span
                            className={`text-xs ${
                              st.completed ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {st.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {item.photo_urls?.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {item.photo_urls.map((url, pi) => (
                        <a key={pi} href={url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={url}
                            alt={`Foto ${item.area}`}
                            className="h-16 w-16 rounded object-cover border"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                  {item.notes && (
                    <p className="mt-1 text-xs italic text-muted-foreground">{item.notes}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Stay Supplies */}
      {staySupplies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageCheck className="h-4 w-4" />
              Scorte soggiorno
              <span className="text-sm font-normal text-muted-foreground">
                {staySupplies.filter((s) => s.checked).length}/{staySupplies.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {staySupplies.map((supply) => (
              <div key={supply.id} className="flex items-center gap-2 rounded-md border p-2.5">
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
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <TaskReviewModal
        taskId={id}
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        mode={reviewMode}
      />

      <TaskReopenModal
        taskId={id}
        isOpen={reopenModalOpen}
        onClose={() => setReopenModalOpen(false)}
      />
    </div>
  );
}
