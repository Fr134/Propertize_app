"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useProperty } from "@/hooks/use-properties";
import {
  useActivityLogs,
  useCreateActivityLog,
  useUpdateActivityLog,
  useDeleteActivityLog,
  type ActivityLog,
  type ActivityLogFilters,
} from "@/hooks/use-activity-logs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  Wrench,
  AlertTriangle,
  StickyNote,
  ClipboardCheck,
  CheckCircle2,
  Circle,
  Trash2,
} from "lucide-react";

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  MANUTENZIONE: { label: "Manutenzione", icon: Wrench, color: "bg-blue-100 text-blue-800" },
  PROBLEMA: { label: "Problema", icon: AlertTriangle, color: "bg-red-100 text-red-800" },
  NOTA: { label: "Nota", icon: StickyNote, color: "bg-gray-100 text-gray-800" },
  ISPEZIONE: { label: "Ispezione", icon: ClipboardCheck, color: "bg-amber-100 text-amber-800" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ActivityLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: propertyId } = use(params);
  const { data: property } = useProperty(propertyId);
  const [filters, setFilters] = useState<ActivityLogFilters>({});
  const { data: logs, isLoading } = useActivityLogs(propertyId, filters);
  const createLog = useCreateActivityLog();
  const deleteLog = useDeleteActivityLog();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: "NOTA",
    title: "",
    description: "",
    is_resolved: false,
  });

  function resetForm() {
    setForm({
      date: new Date().toISOString().slice(0, 10),
      category: "NOTA",
      title: "",
      description: "",
      is_resolved: false,
    });
  }

  async function handleCreate() {
    await createLog.mutateAsync({
      property_id: propertyId,
      ...form,
      description: form.description || undefined,
    });
    resetForm();
    setDialogOpen(false);
  }

  async function handleDelete(logId: string) {
    if (!confirm("Eliminare questa voce?")) return;
    await deleteLog.mutateAsync(logId);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/manager/properties/${propertyId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Registro Attivita</h1>
          {property && (
            <p className="text-sm text-muted-foreground">
              {property.name} ({property.code})
            </p>
          )}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuova attivita</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Data</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Categoria</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm({ ...form, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANUTENZIONE">Manutenzione</SelectItem>
                      <SelectItem value="PROBLEMA">Problema</SelectItem>
                      <SelectItem value="NOTA">Nota</SelectItem>
                      <SelectItem value="ISPEZIONE">Ispezione</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Titolo</Label>
                <Input
                  placeholder="Es. Revisione estintori"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Descrizione (opzionale)</Label>
                <Textarea
                  placeholder="Dettagli..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_resolved}
                  onChange={(e) => setForm({ ...form, is_resolved: e.target.checked })}
                  className="rounded"
                />
                Risolto / Completato
              </label>
              <Button
                onClick={handleCreate}
                disabled={!form.title || createLog.isPending}
                className="w-full"
              >
                {createLog.isPending ? "Salvataggio..." : "Salva"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={filters.category ?? "ALL"}
          onValueChange={(v) =>
            setFilters({ ...filters, category: v === "ALL" ? undefined : v })
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tutte le categorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tutte le categorie</SelectItem>
            <SelectItem value="MANUTENZIONE">Manutenzione</SelectItem>
            <SelectItem value="PROBLEMA">Problema</SelectItem>
            <SelectItem value="NOTA">Nota</SelectItem>
            <SelectItem value="ISPEZIONE">Ispezione</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          placeholder="Da"
          value={filters.from ?? ""}
          onChange={(e) =>
            setFilters({ ...filters, from: e.target.value || undefined })
          }
          className="w-40"
        />
        <Input
          type="date"
          placeholder="A"
          value={filters.to ?? ""}
          onChange={(e) =>
            setFilters({ ...filters, to: e.target.value || undefined })
          }
          className="w-40"
        />
      </div>

      {/* Log list */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Caricamento...</p>
      ) : !logs?.length ? (
        <Card>
          <CardContent className="py-8 text-center">
            <StickyNote className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nessuna attivita registrata.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <ActivityLogCard
              key={log.id}
              log={log}
              propertyId={propertyId}
              onDelete={() => handleDelete(log.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityLogCard({
  log,
  propertyId,
  onDelete,
}: {
  log: ActivityLog;
  propertyId: string;
  onDelete: () => void;
}) {
  const updateLog = useUpdateActivityLog(log.id);
  const cfg = CATEGORY_CONFIG[log.category] ?? CATEGORY_CONFIG.NOTA;
  const Icon = cfg.icon;

  async function toggleResolved() {
    await updateLog.mutateAsync({ is_resolved: !log.is_resolved });
  }

  return (
    <Card>
      <CardContent className="flex items-start gap-3 py-4">
        <button
          type="button"
          onClick={toggleResolved}
          disabled={updateLog.isPending}
          className="mt-0.5 shrink-0"
        >
          {log.is_resolved ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm">{log.title}</p>
            <Badge variant="outline" className={`text-xs ${cfg.color}`}>
              <Icon className="mr-1 h-3 w-3" />
              {cfg.label}
            </Badge>
          </div>
          {log.description && (
            <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
              {log.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {formatDate(log.date)} — {log.author.first_name} {log.author.last_name}
            {log.is_resolved && log.resolved_at && (
              <span className="text-green-600 ml-2">
                Risolto il {formatDate(log.resolved_at)}
              </span>
            )}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
