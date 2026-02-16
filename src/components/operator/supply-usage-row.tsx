"use client";

import { useState } from "react";
import { CheckSquare2, Square } from "lucide-react";
import { QtyStepper } from "@/components/ui/qty-stepper";
import type { StaySupplyData } from "@/hooks/use-tasks";

interface SupplyUsageRowProps {
  supply: StaySupplyData;
  onUpdate: (supplyId: string, checked: boolean, qtyUsed: number) => void;
  disabled?: boolean;
}

export function SupplyUsageRow({ supply, onUpdate, disabled }: SupplyUsageRowProps) {
  const hasInventoryLink = !!supply.supplyItemId;
  const [qty, setQty] = useState(supply.qtyUsed ?? supply.expectedQty ?? 1);

  function handleToggle() {
    const newChecked = !supply.checked;
    const newQty = newChecked ? (supply.expectedQty ?? 1) : 0;
    setQty(newQty);
    onUpdate(supply.id, newChecked, newQty);
  }

  function handleQtyChange(newQty: number) {
    setQty(newQty);
    onUpdate(supply.id, supply.checked, newQty);
  }

  return (
    <div className="flex items-center gap-2 rounded-md border p-2.5">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className="shrink-0"
      >
        {supply.checked ? (
          <CheckSquare2 className="h-4 w-4 text-green-600" />
        ) : (
          <Square className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      <span
        className={`flex-1 text-sm ${
          supply.checked ? "line-through text-muted-foreground" : ""
        }`}
      >
        {supply.text}
      </span>
      {hasInventoryLink && supply.checked && (
        <QtyStepper
          value={qty}
          onChange={handleQtyChange}
          min={0}
          disabled={disabled}
        />
      )}
    </div>
  );
}
