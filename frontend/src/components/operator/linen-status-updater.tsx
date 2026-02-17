"use client";

import { useState } from "react";
import { usePropertyLinen, useUpdateLinen } from "@/hooks/use-linen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Save, Shirt } from "lucide-react";

const LINEN_TYPES = [
  { value: "LENZUOLA", label: "Lenzuola" },
  { value: "ASCIUGAMANI", label: "Asciugamani" },
  { value: "TOVAGLIE", label: "Tovaglie" },
] as const;

const LINEN_STATUSES = [
  { value: "SPORCA", label: "Sporca" },
  { value: "IN_LAVAGGIO", label: "In lavaggio" },
  { value: "PRONTA", label: "Pronta" },
] as const;

interface LinenStatusUpdaterProps {
  propertyId: string;
  disabled: boolean;
}

export function LinenStatusUpdater({ propertyId, disabled }: LinenStatusUpdaterProps) {
  const { data: linen } = usePropertyLinen(propertyId);
  const updateLinen = useUpdateLinen();

  const [quantities, setQuantities] = useState<Record<string, number>>({});

  function getKey(type: string, status: string) {
    return `${type}_${status}`;
  }

  function getQuantity(type: string, status: string): number {
    const key = getKey(type, status);
    if (key in quantities) return quantities[key];
    return linen?.find((l) => l.type === type && l.status === status)?.quantity ?? 0;
  }

  function setQuantity(type: string, status: string, value: number) {
    if (disabled) return;
    setQuantities((prev) => ({ ...prev, [getKey(type, status)]: Math.max(0, value) }));
  }

  async function handleSave() {
    const linenData: { type: "LENZUOLA" | "ASCIUGAMANI" | "TOVAGLIE"; status: "SPORCA" | "IN_LAVAGGIO" | "PRONTA"; quantity: number }[] = [];
    for (const t of LINEN_TYPES) {
      for (const s of LINEN_STATUSES) {
        const qty = getQuantity(t.value, s.value);
        linenData.push({ type: t.value, status: s.value, quantity: qty });
      }
    }
    await updateLinen.mutateAsync({ property_id: propertyId, linen: linenData });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shirt className="h-4 w-4" /> Biancheria
          </CardTitle>
          {!disabled && (
            <Button size="sm" onClick={handleSave} disabled={updateLinen.isPending}>
              <Save className="mr-2 h-3 w-3" />
              {updateLinen.isPending ? "..." : "Salva"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {updateLinen.isSuccess && (
          <p className="text-xs text-green-600 mb-2">Biancheria aggiornata.</p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left font-medium pb-2" />
                {LINEN_STATUSES.map((s) => (
                  <th key={s.value} className="text-center font-medium pb-2 px-1">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LINEN_TYPES.map((t) => (
                <tr key={t.value}>
                  <td className="py-1 pr-3 font-medium">{t.label}</td>
                  {LINEN_STATUSES.map((s) => (
                    <td key={s.value} className="py-1 px-1">
                      <Input
                        type="number"
                        min={0}
                        className="h-8 w-16 text-center mx-auto"
                        value={getQuantity(t.value, s.value)}
                        onChange={(e) => setQuantity(t.value, s.value, parseInt(e.target.value) || 0)}
                        disabled={disabled}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
