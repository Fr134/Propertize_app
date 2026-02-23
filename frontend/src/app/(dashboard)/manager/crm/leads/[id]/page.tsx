"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Pencil,
  Save,
  X,
  UserPlus,
  XCircle,
  PhoneCall,
  ExternalLink,
} from "lucide-react";
import {
  useLead,
  useUpdateLead,
  useCreateCall,
  useConvertLead,
} from "@/hooks/use-leads";
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  LEAD_SOURCE_LABELS,
  PROPERTY_TYPE_LABELS,
} from "@/components/manager/crm/constants";

export default function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: lead, isLoading } = useLead(id);
  const updateLead = useUpdateLead(id);
  const createCall = useCreateCall(id);
  const convertLead = useConvertLead(id);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [callNotes, setCallNotes] = useState("");

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Caricamento...</p>;
  }

  if (!lead) {
    return <p className="text-sm text-destructive">Lead non trovato.</p>;
  }

  function startEdit() {
    if (!lead) return;
    setForm({
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email ?? "",
      phone: lead.phone ?? "",
      notes: lead.notes ?? "",
      property_address: lead.property_address ?? "",
      property_type: lead.property_type ?? "",
      estimated_rooms: lead.estimated_rooms?.toString() ?? "",
      source: lead.source,
    });
    setEditing(true);
  }

  async function saveEdit() {
    try {
      await updateLead.mutateAsync({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        notes: form.notes || undefined,
        property_address: form.property_address || undefined,
        property_type: (form.property_type || undefined) as
          | "APPARTAMENTO"
          | "VILLA"
          | "ALTRO"
          | undefined,
        estimated_rooms: form.estimated_rooms
          ? parseInt(form.estimated_rooms)
          : undefined,
        source: form.source as
          | "MANUAL"
          | "REFERRAL"
          | "SOCIAL"
          | "WEBSITE"
          | "OTHER",
      });
      setEditing(false);
    } catch {
      // error via mutation state
    }
  }

  async function handleAddCall() {
    if (!callNotes.trim()) return;
    try {
      await createCall.mutateAsync({ notes: callNotes });
      setCallNotes("");
    } catch {
      // error via mutation state
    }
  }

  async function handleConvert() {
    try {
      const result = await convertLead.mutateAsync();
      router.push(`/manager/owners`);
      void result;
    } catch {
      // error via mutation state
    }
  }

  async function handleMarkLost() {
    try {
      await updateLead.mutateAsync({ status: "LOST" });
    } catch {
      // error via mutation state
    }
  }

  const statusColor = LEAD_STATUS_COLORS[lead.status] ?? "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/manager/crm">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {lead.first_name} {lead.last_name}
            </h1>
            <Badge className={statusColor}>
              {LEAD_STATUS_LABELS[lead.status] ?? lead.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Fonte: {LEAD_SOURCE_LABELS[lead.source] ?? lead.source} &middot;
            Creato il{" "}
            {new Date(lead.created_at).toLocaleDateString("it-IT")}
          </p>
        </div>
        {!editing && (
          <Button variant="outline" size="sm" onClick={startEdit}>
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Modifica
          </Button>
        )}
      </div>

      {/* Two columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Lead info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informazioni lead</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {editing ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Nome</Label>
                      <Input
                        value={form.first_name}
                        onChange={(e) =>
                          setForm({ ...form, first_name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Cognome</Label>
                      <Input
                        value={form.last_name}
                        onChange={(e) =>
                          setForm({ ...form, last_name: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Email</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Telefono</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Indirizzo immobile</Label>
                    <Input
                      value={form.property_address}
                      onChange={(e) =>
                        setForm({ ...form, property_address: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Tipo immobile</Label>
                      <Select
                        value={form.property_type || "none"}
                        onValueChange={(v) =>
                          setForm({
                            ...form,
                            property_type: v === "none" ? "" : v,
                          })
                        }
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">--</SelectItem>
                          {Object.entries(PROPERTY_TYPE_LABELS).map(
                            ([k, v]) => (
                              <SelectItem key={k} value={k}>
                                {v}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Camere stimate</Label>
                      <Input
                        type="number"
                        min={0}
                        value={form.estimated_rooms}
                        onChange={(e) =>
                          setForm({ ...form, estimated_rooms: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fonte</Label>
                    <Select
                      value={form.source}
                      onValueChange={(v) => setForm({ ...form, source: v })}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LEAD_SOURCE_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Note</Label>
                    <Textarea
                      value={form.notes}
                      onChange={(e) =>
                        setForm({ ...form, notes: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
                  {updateLead.isError && (
                    <p className="text-sm text-destructive">
                      {updateLead.error.message}
                    </p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={saveEdit}
                      disabled={updateLead.isPending}
                    >
                      <Save className="mr-2 h-3.5 w-3.5" />
                      {updateLead.isPending ? "Salvataggio..." : "Salva"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing(false)}
                    >
                      <X className="mr-2 h-3.5 w-3.5" />
                      Annulla
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <InfoRow label="Email" value={lead.email} />
                  <InfoRow label="Telefono" value={lead.phone} />
                  <InfoRow
                    label="Indirizzo immobile"
                    value={lead.property_address}
                  />
                  <InfoRow
                    label="Tipo immobile"
                    value={
                      lead.property_type
                        ? PROPERTY_TYPE_LABELS[lead.property_type]
                        : null
                    }
                  />
                  <InfoRow
                    label="Camere stimate"
                    value={lead.estimated_rooms?.toString()}
                  />
                  <InfoRow
                    label="Fonte"
                    value={LEAD_SOURCE_LABELS[lead.source]}
                  />
                  {lead.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground">Note</p>
                      <p className="text-sm whitespace-pre-wrap">
                        {lead.notes}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {lead.status !== "WON" && !lead.owner_id && (
              <Button size="sm" onClick={handleConvert} disabled={convertLead.isPending}>
                <UserPlus className="mr-2 h-3.5 w-3.5" />
                {convertLead.isPending
                  ? "Conversione..."
                  : "Converti in proprietario"}
              </Button>
            )}
            {lead.owner_id && lead.owner && (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/manager/owners`}>
                  <ExternalLink className="mr-2 h-3.5 w-3.5" />
                  Proprietario: {lead.owner.name}
                </Link>
              </Button>
            )}
            {lead.status !== "LOST" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <XCircle className="mr-2 h-3.5 w-3.5" />
                    Segna come perso
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Conferma</AlertDialogTitle>
                    <AlertDialogDescription>
                      Vuoi segnare questo lead come perso?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                    <AlertDialogAction onClick={handleMarkLost}>
                      Conferma
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {convertLead.isError && (
            <p className="text-sm text-destructive">
              {convertLead.error.message}
            </p>
          )}
        </div>

        {/* Right: Call log */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <PhoneCall className="h-4 w-4" />
                Registro chiamate ({lead.calls.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add call form */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Note della chiamata..."
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  rows={2}
                />
                {createCall.isError && (
                  <p className="text-xs text-destructive">
                    {createCall.error.message}
                  </p>
                )}
                <Button
                  size="sm"
                  onClick={handleAddCall}
                  disabled={!callNotes.trim() || createCall.isPending}
                >
                  <PhoneCall className="mr-2 h-3.5 w-3.5" />
                  {createCall.isPending
                    ? "Salvataggio..."
                    : "Aggiungi chiamata"}
                </Button>
              </div>

              {/* Call list */}
              {lead.calls.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nessuna chiamata registrata
                </p>
              ) : (
                <div className="space-y-3 pt-2 border-t">
                  {lead.calls.map((call) => (
                    <div key={call.id} className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {new Date(call.called_at).toLocaleString("it-IT", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-sm">{call.notes}</p>
                    </div>
                  ))}
                </div>
              )}
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
      <p className="text-sm">{value}</p>
    </div>
  );
}
