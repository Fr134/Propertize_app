"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Check,
  Clock,
  SkipForward,
  RotateCcw,
  ExternalLink,
  User,
  Mail,
  Phone,
} from "lucide-react";
import { useOnboarding, useUpdateOnboardingStep } from "@/hooks/use-onboarding";
import { useOwner } from "@/hooks/use-owners";

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: string; className: string }
> = {
  PENDING: {
    label: "In attesa",
    variant: "secondary",
    className: "bg-gray-100 text-gray-700",
  },
  IN_PROGRESS: {
    label: "In corso",
    variant: "default",
    className: "bg-blue-100 text-blue-800",
  },
  COMPLETED: {
    label: "Completato",
    variant: "default",
    className: "bg-green-100 text-green-800",
  },
  SKIPPED: {
    label: "Saltato",
    variant: "outline",
    className: "bg-yellow-100 text-yellow-800",
  },
};

export default function OnboardingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: ownerId } = use(params);
  const { data: workflow, isLoading } = useOnboarding(ownerId);
  const { data: owner } = useOwner(ownerId);
  const updateStep = useUpdateOnboardingStep(ownerId);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/manager/crm/onboarding">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground text-center py-8">
          Workflow non trovato
        </p>
      </div>
    );
  }

  const completedCount = workflow.steps.filter(
    (s) => s.status === "COMPLETED" || s.status === "SKIPPED"
  ).length;
  const totalSteps = workflow.steps.length;
  const pct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  // Owner's first property (if any) — used for step links
  const firstProperty = owner?.properties?.[0] ?? null;

  function getStepLink(stepKey: string): { href: string; label: string } | null {
    switch (stepKey) {
      case "property_created":
        return {
          href: `/manager/properties/new?owner_id=${ownerId}`,
          label: "Crea immobile",
        };
      case "masterfile_completed":
        return firstProperty
          ? {
              href: `/manager/properties/${firstProperty.id}`,
              label: "Vai al masterfile",
            }
          : null;
      case "checklist_created":
        return firstProperty
          ? {
              href: `/manager/properties/${firstProperty.id}`,
              label: "Vai alla checklist",
            }
          : null;
      default:
        return null;
    }
  }

  async function handleStatusChange(stepKey: string, status: string) {
    try {
      await updateStep.mutateAsync({ stepKey, status });
    } catch {
      // error handled by mutation state
    }
  }

  async function handleSaveNotes(stepKey: string) {
    const notes = editingNotes[stepKey];
    if (notes === undefined) return;
    try {
      await updateStep.mutateAsync({ stepKey, notes });
      setEditingNotes((prev) => {
        const next = { ...prev };
        delete next[stepKey];
        return next;
      });
    } catch {
      // error handled by mutation state
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/manager/crm/onboarding">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Onboarding — {workflow.owner.name}
          </h1>
          <div className="flex items-center gap-4 mt-1">
            {workflow.owner.email && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {workflow.owner.email}
              </span>
            )}
            {workflow.owner.phone && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                {workflow.owner.phone}
              </span>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/manager/owners/${ownerId}`}>
            <User className="mr-2 h-3.5 w-3.5" />
            Scheda proprietario
          </Link>
        </Button>
      </div>

      {/* Progress summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">
              Progresso: {completedCount}/{totalSteps} step completati
            </p>
            <span className="text-sm text-muted-foreground">{pct}%</span>
          </div>
          <Progress value={pct} className="h-3" />
          {workflow.completed_at && (
            <p className="text-sm text-green-600 mt-2 font-medium">
              Onboarding completato il{" "}
              {new Date(workflow.completed_at).toLocaleDateString("it-IT")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Vertical stepper */}
      <div className="relative">
        {workflow.steps.map((step, index) => {
          const config = STATUS_CONFIG[step.status] ?? STATUS_CONFIG.PENDING;
          const isLast = index === workflow.steps.length - 1;
          const isDone = step.status === "COMPLETED" || step.status === "SKIPPED";
          const stepLink = getStepLink(step.step_key);
          const isEditingNotes = editingNotes[step.step_key] !== undefined;
          const currentNotes = isEditingNotes
            ? editingNotes[step.step_key]
            : step.notes ?? "";

          return (
            <div key={step.id} className="flex gap-4">
              {/* Vertical line + circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold shrink-0 ${
                    isDone
                      ? "border-green-500 bg-green-50 text-green-700"
                      : step.status === "IN_PROGRESS"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-muted-foreground/30 bg-background text-muted-foreground"
                  }`}
                >
                  {isDone ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.order
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 min-h-[24px] ${
                      isDone ? "bg-green-300" : "bg-muted-foreground/20"
                    }`}
                  />
                )}
              </div>

              {/* Step content */}
              <Card className={`flex-1 mb-4 ${isDone ? "opacity-75" : ""}`}>
                <CardContent className="pt-4 pb-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{step.label}</p>
                      {step.description && (
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                      )}
                    </div>
                    <Badge className={config.className}>{config.label}</Badge>
                  </div>

                  {step.completed_at && (
                    <p className="text-xs text-muted-foreground">
                      Completato il{" "}
                      {new Date(step.completed_at).toLocaleDateString("it-IT")}
                    </p>
                  )}

                  {/* Notes */}
                  <div className="space-y-1">
                    <Textarea
                      placeholder="Note (opzionale)..."
                      value={currentNotes}
                      onChange={(e) =>
                        setEditingNotes((prev) => ({
                          ...prev,
                          [step.step_key]: e.target.value,
                        }))
                      }
                      className="min-h-[60px] text-sm"
                      rows={2}
                    />
                    {isEditingNotes && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSaveNotes(step.step_key)}
                          disabled={updateStep.isPending}
                        >
                          Salva note
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setEditingNotes((prev) => {
                              const next = { ...prev };
                              delete next[step.step_key];
                              return next;
                            })
                          }
                        >
                          Annulla
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {step.status !== "COMPLETED" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          handleStatusChange(step.step_key, "COMPLETED")
                        }
                        disabled={updateStep.isPending}
                      >
                        <Check className="mr-1.5 h-3.5 w-3.5" />
                        Segna completato
                      </Button>
                    )}
                    {step.status !== "IN_PROGRESS" && step.status !== "COMPLETED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleStatusChange(step.step_key, "IN_PROGRESS")
                        }
                        disabled={updateStep.isPending}
                      >
                        <Clock className="mr-1.5 h-3.5 w-3.5" />
                        In corso
                      </Button>
                    )}
                    {step.status !== "SKIPPED" && step.status !== "COMPLETED" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={updateStep.isPending}
                          >
                            <SkipForward className="mr-1.5 h-3.5 w-3.5" />
                            Salta
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Salta step?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Lo step &quot;{step.label}&quot; verrà segnato come
                              saltato. Potrai riattivarlo in seguito.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleStatusChange(step.step_key, "SKIPPED")
                              }
                            >
                              Salta
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {(step.status === "COMPLETED" || step.status === "SKIPPED") && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleStatusChange(step.step_key, "PENDING")
                        }
                        disabled={updateStep.isPending}
                      >
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                        Riapri
                      </Button>
                    )}

                    {/* Special step links */}
                    {stepLink && (
                      <Button size="sm" variant="link" asChild>
                        <Link href={stepLink.href}>
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                          {stepLink.label}
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
