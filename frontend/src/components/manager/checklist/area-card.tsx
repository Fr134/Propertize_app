"use client";

import { useState, useCallback } from "react";
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
  ImagePlus,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing-client";
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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const { startUpload } = useUploadThing("checklistPhoto", {
    onUploadError: (err) => {
      console.error("Upload error:", err);
      setUploadError(err.message);
      setUploading(false);
    },
  });

  const handlePhotoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      setUploadError("");
      try {
        const res = await startUpload([file]);
        const firstFile = res?.[0];
        // Try all possible URL properties from UploadThing response
        const url = firstFile?.ufsUrl
          ?? firstFile?.url
          ?? (firstFile?.serverData as { url?: string } | undefined)?.url;
        if (url) {
          onChange({ ...area, reference_photo_url: url });
        } else {
          setUploadError("Upload completato ma URL non trovato");
        }
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Errore upload");
      } finally {
        setUploading(false);
        e.target.value = "";
      }
    },
    [area, onChange, startUpload]
  );

  const removePhoto = useCallback(() => {
    onChange({ ...area, reference_photo_url: null });
  }, [area, onChange]);

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

  // Normalize arrays that may be missing from old DB data
  const subTasks = Array.isArray(area.sub_tasks) ? area.sub_tasks : [];
  const areaSupplyItems = Array.isArray(area.supply_items) ? area.supply_items : [];

  // --- Field updaters ---
  function updateField<K extends keyof ChecklistArea>(key: K, value: ChecklistArea[K]) {
    onChange({ ...area, [key]: value });
  }

  // --- Sub-tasks ---
  function addSubTask() {
    const newSt: SubTask = { id: crypto.randomUUID(), label: "", completed: false };
    updateField("sub_tasks", [...subTasks, newSt]);
  }

  function removeSubTask(index: number) {
    updateField("sub_tasks", subTasks.filter((_, i) => i !== index));
  }

  function updateSubTaskLabel(index: number, label: string) {
    const updated = [...subTasks];
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
    updateField("supply_items", [...areaSupplyItems, newSi]);
  }

  function removeSupplyCheck(index: number) {
    updateField("supply_items", areaSupplyItems.filter((_, i) => i !== index));
  }

  function updateSupplyCheck(index: number, supplyItemId: string) {
    const item = supplyItems.find((s) => s.id === supplyItemId);
    const updated = [...areaSupplyItems];
    updated[index] = {
      ...updated[index],
      supply_item_id: supplyItemId,
      label: item?.name ?? updated[index].label,
    };
    updateField("supply_items", updated);
  }

  function updateSupplyQty(index: number, qty: number) {
    const updated = [...areaSupplyItems];
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

        {/* Reference photo */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ImagePlus className="h-3.5 w-3.5 text-muted-foreground" />
            <Label className="text-xs">Foto di riferimento</Label>
          </div>
          {area.reference_photo_url ? (
            <div className="relative inline-block">
              <img
                src={area.reference_photo_url}
                alt={`Riferimento ${area.area}`}
                className="h-32 w-auto rounded-md border object-cover"
              />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white shadow-sm hover:bg-destructive/90"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div>
              <label className="flex h-24 w-40 cursor-pointer items-center justify-center rounded-md border border-dashed text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <ImagePlus className="h-5 w-5" />
                    <span className="text-xs">Carica foto</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                />
              </label>
              {uploadError && (
                <p className="text-xs text-destructive mt-1">{uploadError}</p>
              )}
            </div>
          )}
        </div>

        {/* Sub-tasks */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
            <Label className="text-xs">Sotto-task</Label>
          </div>
          {subTasks.map((st, stIdx) => (
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
          {areaSupplyItems.map((si, siIdx) => (
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
