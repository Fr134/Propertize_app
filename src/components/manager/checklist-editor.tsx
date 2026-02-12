"use client";

import { useState } from "react";
import { useUpdateChecklist } from "@/hooks/use-properties";
import type { ChecklistTemplateItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, Camera, Save } from "lucide-react";

interface ChecklistEditorProps {
  propertyId: string;
  initialItems: ChecklistTemplateItem[];
}

export function ChecklistEditor({ propertyId, initialItems }: ChecklistEditorProps) {
  const [items, setItems] = useState<ChecklistTemplateItem[]>(initialItems);
  const updateChecklist = useUpdateChecklist(propertyId);

  function addItem() {
    setItems([...items, { area: "", description: "", photo_required: false }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof ChecklistTemplateItem, value: string | boolean) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  }

  async function handleSave() {
    const validItems = items.filter((item) => item.area.trim() && item.description.trim());
    if (validItems.length === 0) return;
    try {
      await updateChecklist.mutateAsync({ items: validItems });
    } catch {
      // error shown via mutation state
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Checklist Template</CardTitle>
            <CardDescription>
              Definisci le aree da controllare durante la pulizia
            </CardDescription>
          </div>
          <Button onClick={handleSave} disabled={updateChecklist.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateChecklist.isPending ? "Salvataggio..." : "Salva"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {updateChecklist.isSuccess && (
          <p className="text-sm text-green-600">Checklist salvata con successo.</p>
        )}
        {updateChecklist.isError && (
          <p className="text-sm text-destructive">{updateChecklist.error.message}</p>
        )}

        {items.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Nessuna area definita. Aggiungi la prima area della checklist.
            </p>
            <Button variant="outline" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi area
            </Button>
          </div>
        ) : (
          <>
            {items.map((item, index) => (
              <div
                key={index}
                className="flex gap-3 rounded-md border p-3"
              >
                <div className="flex items-start pt-2 text-muted-foreground">
                  <GripVertical className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Area</Label>
                      <Input
                        placeholder="Es. Bagno"
                        value={item.area}
                        onChange={(e) => updateItem(index, "area", e.target.value)}
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.photo_required}
                          onChange={(e) => updateItem(index, "photo_required", e.target.checked)}
                          className="rounded"
                        />
                        <Camera className="h-4 w-4 text-muted-foreground" />
                        Foto obbligatoria
                      </label>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Descrizione</Label>
                    <Textarea
                      placeholder="Es. Pulire sanitari, doccia, specchio, pavimento"
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => removeItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button variant="outline" onClick={addItem} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi area
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
