"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GripVertical,
  Trash2,
  Camera,
  Plus,
  X,
  ListChecks,
  PackageCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChecklistArea, SubTask, ChecklistSupplyItem } from "@/hooks/use-checklist-template";

interface SupplyItemOption {
  id: string;
  name: string;
  unit: string;
}

interface AreaCardProps {
  area: ChecklistArea;
  onChange: (area: ChecklistArea) => void;
  onDelete: () => void;
  supplyItems: SupplyItemOption[];
}

export function AreaCard({ area, onChange, onDelete, supplyItems }: AreaCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: area.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // --- Field updaters ---
  function updateField<K extends keyof ChecklistArea>(key: K, value: ChecklistArea[K]) {
    onChange({ ...area, [key]: value });
  }

  // --- Sub-tasks ---
  function addSubTask() {
    const newSt: SubTask = { id: crypto.randomUUID(), label: "", completed: false };
    updateField("sub_tasks", [...area.sub_tasks, newSt]);
  }

  function removeSubTask(index: number) {
    updateField("sub_tasks", area.sub_tasks.filter((_, i) => i !== index));
  }

  function updateSubTaskLabel(index: number, label: string) {
    const updated = [...area.sub_tasks];
    updated[index] = { ...updated[index], label };
    updateField("sub_tasks", updated);
  }

  // --- Supply items ---
  function addSupplyCheck() {
    const newSi: ChecklistSupplyItem = {
      supply_item_id: "",
      label: "",
      expected_qty: 1,
    };
    updateField("supply_items", [...area.supply_items, newSi]);
  }

  function removeSupplyCheck(index: number) {
    updateField("supply_items", area.supply_items.filter((_, i) => i !== index));
  }

  function updateSupplyCheck(index: number, supplyItemId: string) {
    const item = supplyItems.find((s) => s.id === supplyItemId);
    const updated = [...area.supply_items];
    updated[index] = {
      ...updated[index],
      supply_item_id: supplyItemId,
      label: item?.name ?? updated[index].label,
    };
    updateField("supply_items", updated);
  }

  function updateSupplyQty(index: number, qty: number) {
    const updated = [...area.supply_items];
    updated[index] = { ...updated[index], expected_qty: Math.max(1, qty) };
    updateField("supply_items", updated);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex gap-3 rounded-md border p-4 bg-background",
        isDragging && "opacity-50 shadow-lg z-10"
      )}
    >
      {/* Drag handle */}
      <div
        className="flex items-start pt-1 cursor-grab active:cursor-grabbing text-muted-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4">
        {/* Name + photo toggle */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Area</Label>
            <Input
              placeholder="Es. Bagno"
              value={area.area}
              onChange={(e) => updateField("area", e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={area.photo_required}
                onChange={(e) => updateField("photo_required", e.target.checked)}
                className="rounded"
              />
              <Camera className="h-4 w-4 text-muted-foreground" />
              Foto obbligatoria
            </label>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <Label className="text-xs">Descrizione</Label>
          <Textarea
            placeholder="Es. Pulire sanitari, doccia, specchio, pavimento"
            value={area.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={2}
          />
        </div>

        {/* Sub-tasks */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
            <Label className="text-xs">Sotto-task</Label>
          </div>
          {area.sub_tasks.map((st, stIdx) => (
            <div key={st.id} className="flex items-center gap-2">
              <Input
                placeholder="Es. Pulire WC"
                value={st.label}
                onChange={(e) => updateSubTaskLabel(stIdx, e.target.value)}
                className="h-8 text-sm"
              />
              <button
                type="button"
                onClick={() => removeSubTask(stIdx)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSubTask}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3 w-3" />
            Aggiungi sotto-task
          </button>
        </div>

        {/* Supply checks */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <PackageCheck className="h-3.5 w-3.5 text-muted-foreground" />
            <Label className="text-xs">Verifica scorte</Label>
          </div>
          {area.supply_items.map((si, siIdx) => (
            <div key={siIdx} className="flex items-center gap-2">
              <Select
                value={si.supply_item_id || "none"}
                onValueChange={(v) => updateSupplyCheck(siIdx, v === "none" ? "" : v)}
              >
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="Seleziona articolo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Seleziona articolo</SelectItem>
                  {supplyItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={1}
                value={si.expected_qty}
                onChange={(e) => updateSupplyQty(siIdx, parseInt(e.target.value) || 1)}
                className="h-8 w-20 text-sm"
                title="Quantità prevista"
              />
              <button
                type="button"
                onClick={() => removeSupplyCheck(siIdx)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSupplyCheck}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3 w-3" />
            Aggiungi verifica scorta
          </button>
        </div>
      </div>

      {/* Delete button */}
      <div className="shrink-0">
        {confirmDelete ? (
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="destructive"
              size="sm"
              className="h-7 text-xs"
              onClick={onDelete}
            >
              Conferma
            </Button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Annulla
            </button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
