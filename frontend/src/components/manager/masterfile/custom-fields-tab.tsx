"use client";

import { useState } from "react";
import { useMasterfile, useUpdateMasterfile } from "@/hooks/use-masterfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save } from "lucide-react";

interface CustomField {
  key: string;
  label: string;
  value: string;
}

export function CustomFieldsTab({ propertyId }: { propertyId: string }) {
  const { data: masterfile, isLoading } = useMasterfile(propertyId);
  const updateMutation = useUpdateMasterfile(propertyId);

  const [fields, setFields] = useState<CustomField[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [dirty, setDirty] = useState(false);

  // New field form
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");

  // Sync from server once
  if (masterfile && !initialized) {
    setFields((masterfile.custom_fields as CustomField[]) ?? []);
    setInitialized(true);
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Caricamento...</p>;
  }

  function addField() {
    if (!newLabel.trim()) return;
    const key = newLabel
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    setFields((prev) => [...prev, { key, label: newLabel.trim(), value: newValue.trim() }]);
    setNewLabel("");
    setNewValue("");
    setDirty(true);
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  }

  function updateFieldValue(index: number, value: string) {
    setFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, value } : f))
    );
    setDirty(true);
  }

  async function saveAll() {
    await updateMutation.mutateAsync({ custom_fields: fields });
    setDirty(false);
  }

  return (
    <div className="space-y-6">
      {dirty && (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={saveAll}
            disabled={updateMutation.isPending}
          >
            <Save className="mr-2 h-3 w-3" />
            Salva modifiche
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campi personalizzati</CardTitle>
        </CardHeader>
        <CardContent>
          {fields.length === 0 && !dirty && (
            <p className="text-sm text-muted-foreground mb-4">
              Nessun campo personalizzato. Usa il form sottostante per aggiungerne.
            </p>
          )}

          <div className="space-y-3">
            {fields.map((field, i) => (
              <div key={field.key + i} className="flex items-center gap-2">
                <div className="w-1/3">
                  <p className="text-sm font-medium">{field.label}</p>
                </div>
                <div className="flex-1">
                  <Input
                    value={field.value}
                    onChange={(e) => updateFieldValue(i, e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeField(i)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aggiungi campo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label>Etichetta</Label>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="es. Codice WiFi ospiti"
              />
            </div>
            <div className="flex-1">
              <Label>Valore</Label>
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="es. guest-2024"
              />
            </div>
            <Button type="button" onClick={addField} disabled={!newLabel.trim()}>
              <Plus className="mr-2 h-3 w-3" />
              Aggiungi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
