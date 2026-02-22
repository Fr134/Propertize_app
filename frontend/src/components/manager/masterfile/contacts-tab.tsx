"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMasterfile, useUpdateMasterfile } from "@/hooks/use-masterfile";
import { usePropertyOperational } from "@/hooks/use-masterfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Save, X, ExternalLink } from "lucide-react";

interface ContactsFormData {
  plumber_name: string;
  plumber_phone: string;
  electrician_name: string;
  electrician_phone: string;
  cleaner_notes: string;
  cadastral_id: string;
  cie_code: string;
  tourism_license: string;
  floorplan_url: string;
  drive_folder_url: string;
}

export function ContactsTab({ propertyId }: { propertyId: string }) {
  const { data: masterfile, isLoading: mfLoading } = useMasterfile(propertyId);
  const { data: operational, isLoading: opLoading } =
    usePropertyOperational(propertyId);
  const updateMutation = useUpdateMasterfile(propertyId);
  const [editing, setEditing] = useState(false);

  const form = useForm<ContactsFormData>();

  if (mfLoading || opLoading) {
    return <p className="text-sm text-muted-foreground">Caricamento...</p>;
  }

  function startEdit() {
    form.reset({
      plumber_name: masterfile?.plumber_name ?? "",
      plumber_phone: masterfile?.plumber_phone ?? "",
      electrician_name: masterfile?.electrician_name ?? "",
      electrician_phone: masterfile?.electrician_phone ?? "",
      cleaner_notes: masterfile?.cleaner_notes ?? "",
      cadastral_id: masterfile?.cadastral_id ?? "",
      cie_code: masterfile?.cie_code ?? "",
      tourism_license: masterfile?.tourism_license ?? "",
      floorplan_url: masterfile?.floorplan_url ?? "",
      drive_folder_url: masterfile?.drive_folder_url ?? "",
    });
    setEditing(true);
  }

  async function onSubmit(values: ContactsFormData) {
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
            <CardTitle className="text-base">Fornitori</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <ReadField label="Idraulico" value={masterfile?.plumber_name} />
            <ReadField label="Tel. idraulico" value={masterfile?.plumber_phone} />
            <ReadField label="Elettricista" value={masterfile?.electrician_name} />
            <ReadField
              label="Tel. elettricista"
              value={masterfile?.electrician_phone}
            />
            <div className="sm:col-span-2">
              <ReadField
                label="Note pulizie"
                value={masterfile?.cleaner_notes}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dati fiscali</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <ReadField
              label="Identificativo catastale"
              value={masterfile?.cadastral_id}
            />
            <ReadField label="Codice CIE" value={masterfile?.cie_code} />
            <ReadField
              label="Licenza turistica"
              value={masterfile?.tourism_license}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documenti</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <LinkField label="Contratto" url={operational?.contract_url} />
            <LinkField label="Planimetria" url={masterfile?.floorplan_url} />
            <LinkField
              label="Cartella Drive"
              url={masterfile?.drive_folder_url}
            />
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
          <CardTitle className="text-base">Fornitori</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Idraulico" {...form.register("plumber_name")} />
          <Field label="Tel. idraulico" {...form.register("plumber_phone")} />
          <Field label="Elettricista" {...form.register("electrician_name")} />
          <Field
            label="Tel. elettricista"
            {...form.register("electrician_phone")}
          />
          <div className="sm:col-span-2">
            <Label>Note pulizie</Label>
            <Textarea {...form.register("cleaner_notes")} rows={3} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dati fiscali</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Identificativo catastale"
            {...form.register("cadastral_id")}
          />
          <Field label="Codice CIE" {...form.register("cie_code")} />
          <Field
            label="Licenza turistica"
            {...form.register("tourism_license")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documenti</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field
            label="Planimetria (URL)"
            {...form.register("floorplan_url")}
            placeholder="https://..."
          />
          <Field
            label="Cartella Drive (URL)"
            {...form.register("drive_folder_url")}
            placeholder="https://..."
          />
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
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value || "—"}</p>
    </div>
  );
}

function LinkField({
  label,
  url,
}: {
  label: string;
  url: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Apri documento
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <p className="text-sm text-muted-foreground">Non disponibile</p>
      )}
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
