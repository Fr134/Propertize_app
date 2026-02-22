"use client";

import { useState } from "react";
import { usePropertySupplies, useUpdateSupplies, deriveLevel } from "@/hooks/use-supplies";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const LEVELS = [
  { value: "OK", label: "OK", className: "bg-green-100 text-green-700 border-green-300" },
  { value: "IN_ESAURIMENTO", label: "In esaurimento", className: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  { value: "ESAURITO", label: "Esaurito", className: "bg-red-100 text-red-700 border-red-300" },
] as const;

interface PropertySupplySelectorProps {
  propertyId: string;
  taskId: string;
  disabled: boolean;
}

export function PropertySupplySelector({ propertyId, taskId, disabled }: PropertySupplySelectorProps) {
  const { data: supplies, isLoading } = usePropertySupplies(propertyId);
  const updateSupplies = useUpdateSupplies();

  // Local overrides keyed by supply_item_id
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">Caricamento scorte...</p>
        </CardContent>
      </Card>
    );
  }

  if (!supplies || supplies.length === 0) {
    return null;
  }

  const items = supplies.map((stock) => ({
    supply_item_id: stock.supply_item_id,
    name: stock.supply_item.name,
    unit: stock.supply_item.unit,
    level: overrides[stock.supply_item_id] ?? deriveLevel(stock),
  }));

  function setLevel(supplyItemId: string, level: string) {
    if (disabled) return;
    setOverrides((prev) => ({ ...prev, [supplyItemId]: level }));
  }

  async function handleSave() {
    await updateSupplies.mutateAsync({
      property_id: propertyId,
      task_id: taskId,
      supplies: items.map((item) => ({
        category: item.supply_item_id,
        level: item.level as "OK" | "IN_ESAURIMENTO" | "ESAURITO",
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
        {items.map((item) => (
          <div key={item.supply_item_id} className="flex items-center justify-between gap-2">
            <span className="text-sm min-w-24">{item.name}</span>
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
                  onClick={() => setLevel(item.supply_item_id, lvl.value)}
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
