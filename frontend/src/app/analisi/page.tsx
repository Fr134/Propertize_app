"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useSubmitAnalysis } from "@/hooks/use-analysis";

export default function AnalisiPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams.get("lead_id") ?? undefined;
  const submit = useSubmitAnalysis();

  const [form, setForm] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    property_address: "",
    property_type: "" as string,
    bedroom_count: "",
    bathroom_count: "",
    floor_area_sqm: "",
    has_pool: false,
    has_parking: false,
    has_terrace: false,
    current_use: "",
    availability_notes: "",
    additional_notes: "",
  });

  function updateField(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await submit.mutateAsync({
        client_name: form.client_name,
        client_email: form.client_email,
        client_phone: form.client_phone || undefined,
        property_address: form.property_address,
        property_type: form.property_type as "APPARTAMENTO" | "VILLA" | "ALTRO",
        bedroom_count: parseInt(form.bedroom_count),
        bathroom_count: parseInt(form.bathroom_count),
        floor_area_sqm: form.floor_area_sqm ? parseFloat(form.floor_area_sqm) : undefined,
        has_pool: form.has_pool,
        has_parking: form.has_parking,
        has_terrace: form.has_terrace,
        current_use: form.current_use || undefined,
        availability_notes: form.availability_notes || undefined,
        additional_notes: form.additional_notes || undefined,
        lead_id: leadId,
      });
      router.push("/analisi/grazie");
    } catch {
      // error via mutation state
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-lg px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Propertize
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Richiedi un&apos;analisi gratuita del potenziale del tuo immobile
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1 — Client data */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                I tuoi dati
              </h2>
              <div className="space-y-1">
                <Label className="text-xs">Nome e cognome *</Label>
                <Input
                  value={form.client_name}
                  onChange={(e) => updateField("client_name", e.target.value)}
                  required
                  placeholder="Mario Rossi"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email *</Label>
                <Input
                  type="email"
                  value={form.client_email}
                  onChange={(e) => updateField("client_email", e.target.value)}
                  required
                  placeholder="mario@email.com"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Telefono</Label>
                <Input
                  value={form.client_phone}
                  onChange={(e) => updateField("client_phone", e.target.value)}
                  placeholder="+39 333 1234567"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2 — Property data */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Il tuo immobile
              </h2>
              <div className="space-y-1">
                <Label className="text-xs">Indirizzo completo *</Label>
                <Input
                  value={form.property_address}
                  onChange={(e) =>
                    updateField("property_address", e.target.value)
                  }
                  required
                  placeholder="Via Roma 1, Milano"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tipo immobile *</Label>
                <Select
                  value={form.property_type || "none"}
                  onValueChange={(v) =>
                    updateField("property_type", v === "none" ? "" : v)
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>
                      Seleziona
                    </SelectItem>
                    <SelectItem value="APPARTAMENTO">Appartamento</SelectItem>
                    <SelectItem value="VILLA">Villa</SelectItem>
                    <SelectItem value="ALTRO">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Camere da letto *</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.bedroom_count}
                    onChange={(e) =>
                      updateField("bedroom_count", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Bagni *</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.bathroom_count}
                    onChange={(e) =>
                      updateField("bathroom_count", e.target.value)
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Superficie (mq)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  value={form.floor_area_sqm}
                  onChange={(e) =>
                    updateField("floor_area_sqm", e.target.value)
                  }
                />
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Piscina</Label>
                  <Switch
                    checked={form.has_pool}
                    onCheckedChange={(v) => updateField("has_pool", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Parcheggio</Label>
                  <Switch
                    checked={form.has_parking}
                    onCheckedChange={(v) => updateField("has_parking", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Terrazzo</Label>
                  <Switch
                    checked={form.has_terrace}
                    onCheckedChange={(v) => updateField("has_terrace", v)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3 — Current situation */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Situazione attuale
              </h2>
              <div className="space-y-2">
                <Label className="text-xs">
                  Come viene usato ora l&apos;immobile? *
                </Label>
                <RadioGroup
                  value={form.current_use}
                  onValueChange={(v) => updateField("current_use", v)}
                  required
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="Non è affittato"
                      id="use-none"
                    />
                    <Label htmlFor="use-none" className="text-sm font-normal">
                      Non è affittato
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="Lo gestisco io"
                      id="use-self"
                    />
                    <Label htmlFor="use-self" className="text-sm font-normal">
                      Lo gestisco io
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="Con un'altra agenzia"
                      id="use-agency"
                    />
                    <Label
                      htmlFor="use-agency"
                      className="text-sm font-normal"
                    >
                      Con un&apos;altra agenzia
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Periodi di disponibilità</Label>
                <Textarea
                  value={form.availability_notes}
                  onChange={(e) =>
                    updateField("availability_notes", e.target.value)
                  }
                  rows={2}
                  placeholder="Es: Disponibile tutto l'anno tranne agosto"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Note aggiuntive</Label>
                <Textarea
                  value={form.additional_notes}
                  onChange={(e) =>
                    updateField("additional_notes", e.target.value)
                  }
                  rows={2}
                  placeholder="Altre informazioni utili..."
                />
              </div>
            </CardContent>
          </Card>

          {submit.isError && (
            <p className="text-sm text-destructive text-center">
              {submit.error.message}
            </p>
          )}

          <Button
            type="submit"
            disabled={submit.isPending || !form.property_type || !form.current_use}
            className="w-full h-12 text-base"
          >
            {submit.isPending
              ? "Invio in corso..."
              : "Invia richiesta analisi"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            I tuoi dati saranno trattati in conformità con la nostra privacy
            policy.
          </p>
        </form>
      </div>
    </div>
  );
}
