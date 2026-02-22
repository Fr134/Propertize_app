"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  usePropertyOperational,
  useUpdatePropertyOperational,
} from "@/hooks/use-masterfile";
import { updatePropertyOperationalSchema } from "@/lib/validators";
import type { UpdatePropertyOperationalInput } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Save, X } from "lucide-react";

export function OperationalTab({ propertyId }: { propertyId: string }) {
  const { data, isLoading } = usePropertyOperational(propertyId);
  const updateMutation = useUpdatePropertyOperational(propertyId);
  const [editing, setEditing] = useState(false);

  const form = useForm<UpdatePropertyOperationalInput>({
    resolver: zodResolver(updatePropertyOperationalSchema),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Caricamento...</p>;
  }

  if (!data) {
    return <p className="text-sm text-destructive">Errore caricamento dati.</p>;
  }

  function startEdit() {
    form.reset({
      wifi_network: data!.wifi_network ?? "",
      wifi_password: data!.wifi_password ?? "",
      door_code: data!.door_code ?? "",
      alarm_code: data!.alarm_code ?? "",
      gas_meter_location: data!.gas_meter_location ?? "",
      water_shutoff: data!.water_shutoff ?? "",
      electricity_panel: data!.electricity_panel ?? "",
      trash_schedule: data!.trash_schedule ?? "",
      checkin_notes: data!.checkin_notes ?? "",
      checkout_notes: data!.checkout_notes ?? "",
      internal_notes: data!.internal_notes ?? "",
    });
    setEditing(true);
  }

  async function onSubmit(values: UpdatePropertyOperationalInput) {
    await updateMutation.mutateAsync(values);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={startEdit}>
            <Pencil className="mr-2 h-3 w-3" />
            Modifica
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Accessi</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <ReadField label="WiFi rete" value={data.wifi_network} />
            <ReadField label="WiFi password" value={data.wifi_password} />
            <ReadField label="Codice portone/cassetta" value={data.door_code} />
            <ReadField label="Codice allarme" value={data.alarm_code} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Info tecniche</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <ReadField label="Contatore gas" value={data.gas_meter_location} />
            <ReadField label="Chiusura acqua" value={data.water_shutoff} />
            <ReadField label="Quadro elettrico" value={data.electricity_panel} />
            <ReadField label="Raccolta rifiuti" value={data.trash_schedule} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Note operative</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <ReadField label="Note check-in" value={data.checkin_notes} />
            <ReadField label="Note check-out" value={data.checkout_notes} />
            <ReadField label="Note interne" value={data.internal_notes} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setEditing(false)}
        >
          <X className="mr-2 h-3 w-3" />
          Annulla
        </Button>
        <Button type="submit" size="sm" disabled={updateMutation.isPending}>
          <Save className="mr-2 h-3 w-3" />
          Salva
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accessi</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="WiFi rete" {...form.register("wifi_network")} />
          <Field label="WiFi password" {...form.register("wifi_password")} />
          <Field
            label="Codice portone/cassetta"
            {...form.register("door_code")}
          />
          <Field label="Codice allarme" {...form.register("alarm_code")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Info tecniche</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Contatore gas"
            {...form.register("gas_meter_location")}
          />
          <Field label="Chiusura acqua" {...form.register("water_shutoff")} />
          <Field
            label="Quadro elettrico"
            {...form.register("electricity_panel")}
          />
          <Field
            label="Raccolta rifiuti"
            {...form.register("trash_schedule")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Note operative</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label>Note check-in</Label>
            <Textarea {...form.register("checkin_notes")} rows={3} />
          </div>
          <div>
            <Label>Note check-out</Label>
            <Textarea {...form.register("checkout_notes")} rows={3} />
          </div>
          <div>
            <Label>Note interne</Label>
            <Textarea {...form.register("internal_notes")} rows={3} />
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

function ReadField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value || "—"}</p>
    </div>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <Label>{label}</Label>
      <Input {...props} />
    </div>
  );
}
