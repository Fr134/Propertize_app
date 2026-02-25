"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Link2, Upload, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  useAnalysis,
  useUpdateAnalysis,
  useLinkAnalysisLead,
  useReassignAnalysis,
} from "@/hooks/use-analysis";
import { useLeads } from "@/hooks/use-leads";
import { useUploadThing } from "@/lib/uploadthing-client";
import { ReassignSelect } from "@/components/manager/reassign-select";

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APPARTAMENTO: "Appartamento",
  VILLA: "Villa",
  ALTRO: "Altro",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "In attesa",
  IN_PROGRESS: "In lavorazione",
  COMPLETED: "Completata",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
};

export default function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { toast } = useToast();
  const { data: analysis, isLoading } = useAnalysis(id);
  const updateAnalysis = useUpdateAnalysis(id);
  const linkLead = useLinkAnalysisLead(id);
  const reassignAnalysis = useReassignAnalysis(id);
  const { data: leads = [] } = useLeads();

  const [form, setForm] = useState({
    estimated_revenue_low: "",
    estimated_revenue_high: "",
    estimated_occupancy: "",
    propertize_fee: "",
    analysis_notes: "",
    analysis_file_url: "",
    status: "PENDING",
  });

  const { startUpload, isUploading } = useUploadThing("analysisFile", {
    onClientUploadComplete: (res) => {
      if (res?.[0]) {
        setForm((prev) => ({ ...prev, analysis_file_url: res[0].ufsUrl }));
      }
    },
  });

  useEffect(() => {
    if (analysis) {
      setForm({
        estimated_revenue_low: analysis.estimated_revenue_low
          ? String(Number(analysis.estimated_revenue_low))
          : "",
        estimated_revenue_high: analysis.estimated_revenue_high
          ? String(Number(analysis.estimated_revenue_high))
          : "",
        estimated_occupancy: analysis.estimated_occupancy?.toString() ?? "",
        propertize_fee: analysis.propertize_fee
          ? String(Number(analysis.propertize_fee))
          : "",
        analysis_notes: analysis.analysis_notes ?? "",
        analysis_file_url: analysis.analysis_file_url ?? "",
        status: analysis.status,
      });
    }
  }, [analysis]);

  async function handleSave(sendToClient = false) {
    try {
      const data: Record<string, unknown> = {
        analysis_notes: form.analysis_notes || undefined,
        analysis_file_url: form.analysis_file_url || undefined,
        status: sendToClient ? "COMPLETED" : form.status,
      };
      if (form.estimated_revenue_low)
        data.estimated_revenue_low = parseFloat(form.estimated_revenue_low);
      if (form.estimated_revenue_high)
        data.estimated_revenue_high = parseFloat(form.estimated_revenue_high);
      if (form.estimated_occupancy)
        data.estimated_occupancy = parseInt(form.estimated_occupancy);
      if (form.propertize_fee)
        data.propertize_fee = parseFloat(form.propertize_fee);

      await updateAnalysis.mutateAsync(data as Parameters<typeof updateAnalysis.mutateAsync>[0]);

      if (sendToClient) {
        toast({
          title: "Analisi inviata",
          description: `Analisi inviata a ${analysis?.client_email}`,
        });
      } else {
        toast({ title: "Salvato", description: "Analisi aggiornata" });
      }
    } catch {
      // error via mutation state
    }
  }

  async function handleLinkLead(leadId: string) {
    try {
      await linkLead.mutateAsync(leadId);
      toast({ title: "Lead collegato", description: "Lead associato all'analisi" });
    } catch {
      // error via mutation state
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Caricamento...</p>;
  }

  if (!analysis) {
    return <p className="text-sm text-destructive">Analisi non trovata.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/manager/crm/analisi">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Analisi — {analysis.client_name}
            </h1>
            <Badge className={STATUS_COLORS[analysis.status] ?? ""}>
              {STATUS_LABELS[analysis.status] ?? analysis.status}
            </Badge>
            {analysis.sent_at && (
              <Badge variant="outline" className="text-green-700">
                Inviata il{" "}
                {new Date(analysis.sent_at).toLocaleDateString("it-IT")}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Inviata il{" "}
            {new Date(analysis.submitted_at).toLocaleDateString("it-IT")}
            {analysis.lead && (
              <>
                {" "}
                &middot; Lead:{" "}
                <Link
                  href={`/manager/crm/leads/${analysis.lead.id}`}
                  className="underline"
                >
                  {analysis.lead.first_name} {analysis.lead.last_name}
                </Link>
              </>
            )}
          </p>
          <ReassignSelect
            currentAssignee={analysis.assigned_to}
            permissionField="can_do_analysis"
            onReassign={(userId) => {
              reassignAnalysis.mutate(userId, {
                onError: (err) =>
                  toast({ title: "Errore", description: err.message, variant: "destructive" }),
              });
            }}
            isPending={reassignAnalysis.isPending}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left — Client data (read only) */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Dati cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Nome" value={analysis.client_name} />
              <InfoRow label="Email" value={analysis.client_email} />
              <InfoRow label="Telefono" value={analysis.client_phone} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Dati immobile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Indirizzo" value={analysis.property_address} />
              <InfoRow
                label="Tipo"
                value={
                  PROPERTY_TYPE_LABELS[analysis.property_type] ??
                  analysis.property_type
                }
              />
              <div className="grid grid-cols-2 gap-4">
                <InfoRow
                  label="Camere"
                  value={analysis.bedroom_count.toString()}
                />
                <InfoRow
                  label="Bagni"
                  value={analysis.bathroom_count.toString()}
                />
              </div>
              {analysis.floor_area_sqm && (
                <InfoRow
                  label="Superficie"
                  value={`${analysis.floor_area_sqm} mq`}
                />
              )}
              <div className="flex gap-2 flex-wrap">
                {analysis.has_pool && (
                  <Badge variant="secondary">Piscina</Badge>
                )}
                {analysis.has_parking && (
                  <Badge variant="secondary">Parcheggio</Badge>
                )}
                {analysis.has_terrace && (
                  <Badge variant="secondary">Terrazzo</Badge>
                )}
              </div>
              <InfoRow label="Utilizzo attuale" value={analysis.current_use} />
              <InfoRow
                label="Disponibilità"
                value={analysis.availability_notes}
              />
              <InfoRow label="Note aggiuntive" value={analysis.additional_notes} />
            </CardContent>
          </Card>

          {/* Link to lead */}
          {!analysis.lead && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Collega a lead
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select onValueChange={handleLinkLead}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona lead..." />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.first_name} {l.last_name}
                        {l.email ? ` (${l.email})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {linkLead.isError && (
                  <p className="text-xs text-destructive mt-1">
                    {linkLead.error.message}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right — Manager analysis (editable) */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Analisi manager</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Revenue min (€/anno)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.estimated_revenue_low}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        estimated_revenue_low: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Revenue max (€/anno)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.estimated_revenue_high}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        estimated_revenue_high: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Occupancy stimata (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.estimated_occupancy}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        estimated_occupancy: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fee Propertize (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    value={form.propertize_fee}
                    onChange={(e) =>
                      setForm({ ...form, propertize_fee: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Note analisi</Label>
                <Textarea
                  value={form.analysis_notes}
                  onChange={(e) =>
                    setForm({ ...form, analysis_notes: e.target.value })
                  }
                  rows={4}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Documento analisi</Label>
                {form.analysis_file_url ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      File caricato
                    </Badge>
                    <a
                      href={form.analysis_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary underline"
                    >
                      Visualizza
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() =>
                        setForm({ ...form, analysis_file_url: "" })
                      }
                    >
                      Rimuovi
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploading}
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = ".pdf,image/*";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement)
                            .files?.[0];
                          if (file) startUpload([file]);
                        };
                        input.click();
                      }}
                    >
                      <Upload className="mr-2 h-3.5 w-3.5" />
                      {isUploading ? "Caricamento..." : "Carica file"}
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Stato</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">In attesa</SelectItem>
                    <SelectItem value="IN_PROGRESS">In lavorazione</SelectItem>
                    <SelectItem value="COMPLETED">Completata</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {updateAnalysis.isError && (
                <p className="text-sm text-destructive">
                  {updateAnalysis.error.message}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSave(false)}
                  disabled={updateAnalysis.isPending}
                >
                  <Save className="mr-2 h-3.5 w-3.5" />
                  {updateAnalysis.isPending ? "Salvataggio..." : "Salva"}
                </Button>
                {analysis.status !== "COMPLETED" && (
                  <Button
                    size="sm"
                    onClick={() => handleSave(true)}
                    disabled={updateAnalysis.isPending}
                  >
                    {updateAnalysis.isPending
                      ? "Invio..."
                      : "Salva e invia al cliente"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm whitespace-pre-wrap">{value}</p>
    </div>
  );
}
