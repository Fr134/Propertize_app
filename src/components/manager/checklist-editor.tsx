"use client";

import { useState } from "react";
import { useUpdateChecklist } from "@/hooks/use-properties";
import { useSupplyItems } from "@/hooks/use-inventory";
import type { ChecklistTemplateItem, StaySupplyTemplate } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical, Camera, Save, ListChecks, X, PackageCheck } from "lucide-react";

interface ChecklistEditorProps {
  propertyId: string;
  initialItems: ChecklistTemplateItem[];
  initialStaySupplies?: StaySupplyTemplate[];
}

export function ChecklistEditor({ propertyId, initialItems, initialStaySupplies = [] }: ChecklistEditorProps) {
  const [items, setItems] = useState<ChecklistTemplateItem[]>(initialItems);
  const [staySupplies, setStaySupplies] = useState<StaySupplyTemplate[]>(initialStaySupplies);
  const updateChecklist = useUpdateChecklist(propertyId);
  const { data: catalogItems } = useSupplyItems({ active: true });

  function addItem() {
    setItems([...items, { area: "", description: "", photo_required: false, subTasks: [] }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof ChecklistTemplateItem, value: string | boolean) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  }

  function addSubTask(areaIndex: number) {
    const updated = [...items];
    const subTasks = [...(updated[areaIndex].subTasks ?? [])];
    subTasks.push({ id: crypto.randomUUID(), text: "" });
    updated[areaIndex] = { ...updated[areaIndex], subTasks };
    setItems(updated);
  }

  function removeSubTask(areaIndex: number, subTaskIndex: number) {
    const updated = [...items];
    const subTasks = [...(updated[areaIndex].subTasks ?? [])];
    subTasks.splice(subTaskIndex, 1);
    updated[areaIndex] = { ...updated[areaIndex], subTasks };
    setItems(updated);
  }

  function updateSubTaskText(areaIndex: number, subTaskIndex: number, text: string) {
    const updated = [...items];
    const subTasks = [...(updated[areaIndex].subTasks ?? [])];
    subTasks[subTaskIndex] = { ...subTasks[subTaskIndex], text };
    updated[areaIndex] = { ...updated[areaIndex], subTasks };
    setItems(updated);
  }

  // --- Stay supply helpers ---
  function addSupply() {
    setStaySupplies([...staySupplies, { id: crypto.randomUUID(), text: "" }]);
  }

  function removeSupply(index: number) {
    setStaySupplies(staySupplies.filter((_, i) => i !== index));
  }

  function updateSupplyText(index: number, text: string) {
    const updated = [...staySupplies];
    updated[index] = { ...updated[index], text };
    setStaySupplies(updated);
  }

  function updateSupplyItem(index: number, supplyItemId: string | null) {
    const updated = [...staySupplies];
    if (supplyItemId) {
      const item = catalogItems?.find((i) => i.id === supplyItemId);
      updated[index] = {
        ...updated[index],
        supplyItemId,
        text: updated[index].text || item?.name || "",
        expectedQty: updated[index].expectedQty ?? 1,
      };
    } else {
      updated[index] = { ...updated[index], supplyItemId: null, expectedQty: undefined };
    }
    setStaySupplies(updated);
  }

  function updateSupplyExpectedQty(index: number, qty: number) {
    const updated = [...staySupplies];
    updated[index] = { ...updated[index], expectedQty: qty };
    setStaySupplies(updated);
  }

  async function handleSave() {
    const validItems = items
      .filter((item) => item.area.trim() && item.description.trim())
      .map((item) => ({
        ...item,
        subTasks: (item.subTasks ?? []).filter((st) => st.text.trim()),
      }));
    if (validItems.length === 0) return;
    const validSupplies = staySupplies
      .filter((s) => s.text.trim())
      .map((s) => ({ ...s, expectedQty: s.expectedQty ?? 1 }));
    try {
      await updateChecklist.mutateAsync({ items: validItems, staySupplies: validSupplies });
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

                  {/* Sub-tasks */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
                      <Label className="text-xs">Punti checklist</Label>
                    </div>
                    {(item.subTasks ?? []).map((st, stIndex) => (
                      <div key={st.id} className="flex items-center gap-2">
                        <Input
                          placeholder="Es. Pulire WC"
                          value={st.text}
                          onChange={(e) => updateSubTaskText(index, stIndex, e.target.value)}
                          className="h-8 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeSubTask(index, stIndex)}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addSubTask(index)}
                      className="h-7 text-xs"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Aggiungi punto
                    </Button>
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
        {/* Stay Supplies section */}
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-semibold">Scorte soggiorno</Label>
          </div>
          <div className="space-y-2">
            {staySupplies.map((supply, index) => (
              <div key={supply.id} className="flex items-center gap-2">
                <Input
                  placeholder="Es. Carta igienica"
                  value={supply.text}
                  onChange={(e) => updateSupplyText(index, e.target.value)}
                  className="h-8 text-sm flex-1"
                />
                <Select
                  value={supply.supplyItemId ?? "none"}
                  onValueChange={(v) => updateSupplyItem(index, v === "none" ? null : v)}
                >
                  <SelectTrigger className="w-36 h-8 text-xs">
                    <SelectValue placeholder="Articolo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nessuno</SelectItem>
                    {catalogItems?.map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {supply.supplyItemId && (
                  <Input
                    type="number"
                    min={1}
                    value={supply.expectedQty ?? 1}
                    onChange={(e) => updateSupplyExpectedQty(index, parseInt(e.target.value) || 1)}
                    className="h-8 w-16 text-sm"
                    title="Quantità prevista"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeSupply(index)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addSupply}
              className="h-7 text-xs"
            >
              <Plus className="mr-1 h-3 w-3" />
              Aggiungi scorta
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
