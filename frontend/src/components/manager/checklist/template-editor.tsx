"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, ClipboardList } from "lucide-react";
import { useSupplyItems } from "@/hooks/use-inventory";
import { useSaveChecklistTemplate } from "@/hooks/use-checklist-template";
import type { ChecklistArea } from "@/hooks/use-checklist-template";
import { AreaCard } from "./area-card";

const QUICK_ADD_AREAS = [
  "Cucina",
  "Soggiorno",
  "Camera 1",
  "Camera 2",
  "Bagno",
  "Bagno 2",
  "Terrazzo",
  "Ingresso",
];

function createEmptyArea(name = ""): ChecklistArea {
  return {
    id: crypto.randomUUID(),
    area: name,
    description: "",
    photo_required: false,
    sub_tasks: [],
    supply_items: [],
  };
}

interface TemplateEditorProps {
  propertyId: string;
  initialAreas: ChecklistArea[];
}

export function TemplateEditor({ propertyId, initialAreas }: TemplateEditorProps) {
  const [areas, setAreas] = useState<ChecklistArea[]>(initialAreas);
  const saveTemplate = useSaveChecklistTemplate(propertyId);
  const { data: supplyItems = [] } = useSupplyItems({ active: true });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setAreas((prev) => {
      const oldIndex = prev.findIndex((a) => a.id === active.id);
      const newIndex = prev.findIndex((a) => a.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  function addArea(name = "") {
    setAreas((prev) => [...prev, createEmptyArea(name)]);
  }

  function updateArea(index: number, updated: ChecklistArea) {
    setAreas((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  }

  function removeArea(index: number) {
    setAreas((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    try {
      await saveTemplate.mutateAsync(areas);
    } catch {
      // error displayed via mutation state
    }
  }

  const supplyItemOptions = supplyItems.map((s) => ({
    id: s.id,
    name: s.name,
    unit: s.unit,
  }));

  // Empty state
  if (areas.length === 0) {
    return (
      <div className="space-y-4">
        {saveTemplate.isSuccess && (
          <p className="text-sm text-green-600">Template salvato con successo.</p>
        )}
        <div className="rounded-md border border-dashed p-8 text-center space-y-4">
          <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Nessun template configurato</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crea il tuo primo template per definire le aree da controllare
            </p>
          </div>
          <Button onClick={() => addArea()}>
            <Plus className="mr-2 h-4 w-4" />
            Crea il tuo primo template
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status messages */}
      {saveTemplate.isSuccess && (
        <p className="text-sm text-green-600">Template salvato con successo.</p>
      )}
      {saveTemplate.isError && (
        <p className="text-sm text-destructive">{saveTemplate.error.message}</p>
      )}

      {/* Sortable area list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={areas.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {areas.map((area, index) => (
              <AreaCard
                key={area.id}
                area={area}
                onChange={(updated) => updateArea(index, updated)}
                onDelete={() => removeArea(index)}
                supplyItems={supplyItemOptions}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Quick-add chips */}
      <div className="flex flex-wrap gap-2">
        {QUICK_ADD_AREAS.map((name) => (
          <Badge
            key={name}
            variant="outline"
            className="cursor-pointer hover:bg-muted text-xs"
            onClick={() => addArea(name)}
          >
            <Plus className="mr-1 h-2.5 w-2.5" />
            {name}
          </Badge>
        ))}
      </div>

      {/* Add area button */}
      <Button variant="outline" onClick={() => addArea()} className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Aggiungi area
      </Button>

      {/* Save button */}
      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={saveTemplate.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {saveTemplate.isPending ? "Salvataggio..." : "Salva template"}
        </Button>
      </div>
    </div>
  );
}
