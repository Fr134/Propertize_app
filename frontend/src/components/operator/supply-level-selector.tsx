"use client";

import { useState } from "react";
import { usePropertySupplies, useUpdateSupplies } from "@/hooks/use-supplies";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const SUPPLY_CATEGORIES = [
  { value: "CAFFE", label: "Caffe" },
  { value: "TE", label: "Te" },
  { value: "ZUCCHERO", label: "Zucchero" },
  { value: "CARTA_IGIENICA", label: "Carta igienica" },
  { value: "TOVAGLIOLI", label: "Tovaglioli" },
  { value: "SAPONE_MANI", label: "Sapone mani" },
  { value: "SHAMPOO", label: "Shampoo" },
  { value: "BAGNOSCHIUMA", label: "Bagnoschiuma" },
] as const;

const LEVELS = [
  { value: "OK", label: "OK", className: "bg-green-100 text-green-700 border-green-300" },
  { value: "IN_ESAURIMENTO", label: "In esaurimento", className: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  { value: "ESAURITO", label: "Esaurito", className: "bg-red-100 text-red-700 border-red-300" },
] as const;

interface SupplyLevelSelectorProps {
  propertyId: string;
  taskId: string;
  disabled: boolean;
}

export function SupplyLevelSelector({ propertyId, taskId, disabled }: SupplyLevelSelectorProps) {
  const { data: supplies } = usePropertySupplies(propertyId);
  const updateSupplies = useUpdateSupplies();

  const [levels, setLevels] = useState<Record<string, string>>({});

  // Initialize from server data
  const currentLevels = SUPPLY_CATEGORIES.map((cat) => {
    const existing = supplies?.find((s) => s.category === cat.value);
    return {
      category: cat.value,
      label: cat.label,
      level: levels[cat.value] ?? existing?.level ?? "OK",
    };
  });

  function setLevel(category: string, level: string) {
    if (disabled) return;
    setLevels((prev) => ({ ...prev, [category]: level }));
  }

  async function handleSave() {
    await updateSupplies.mutateAsync({
      property_id: propertyId,
      task_id: taskId,
      supplies: currentLevels.map((s) => ({
        category: s.category as typeof SUPPLY_CATEGORIES[number]["value"],
        level: s.level as "OK" | "IN_ESAURIMENTO" | "ESAURITO",
      })),
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" /> Scorte
          </CardTitle>
          {!disabled && (
            <Button size="sm" onClick={handleSave} disabled={updateSupplies.isPending}>
              <Save className="mr-2 h-3 w-3" />
              {updateSupplies.isPending ? "..." : "Salva"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {updateSupplies.isSuccess && (
          <p className="text-xs text-green-600">Scorte aggiornate.</p>
        )}
        {currentLevels.map((item) => (
          <div key={item.category} className="flex items-center justify-between gap-2">
            <span className="text-sm min-w-24">{item.label}</span>
            <div className="flex gap-1">
              {LEVELS.map((lvl) => (
                <Badge
                  key={lvl.value}
                  variant="outline"
                  className={cn(
                    "cursor-pointer text-xs transition-all",
                    item.level === lvl.value ? lvl.className : "opacity-40",
                    disabled && "cursor-default"
                  )}
                  onClick={() => setLevel(item.category, lvl.value)}
                >
                  {lvl.label}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
