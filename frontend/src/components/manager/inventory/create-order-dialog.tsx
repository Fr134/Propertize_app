"use client";

import { useState } from "react";
import { useSupplyItems, useCreatePurchaseOrder } from "@/hooks/use-inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface OrderLine {
  supply_item_id: string;
  qty_ordered: number;
  unit_cost: number | undefined;
}

interface CreateOrderDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateOrderDialog({ open, onClose }: CreateOrderDialogProps) {
  const { data: items } = useSupplyItems({ active: true });
  const createOrder = useCreatePurchaseOrder();
  const [orderRef, setOrderRef] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([{ supply_item_id: "", qty_ordered: 1, unit_cost: undefined }]);

  function addLine() {
    setLines([...lines, { supply_item_id: "", qty_ordered: 1, unit_cost: undefined }]);
  }

  function removeLine(index: number) {
    setLines(lines.filter((_, i) => i !== index));
  }

  function updateLine(index: number, field: keyof OrderLine, value: string | number | undefined) {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  }

  async function handleCreate() {
    const validLines = lines.filter((l) => l.supply_item_id && l.qty_ordered > 0);
    if (validLines.length === 0) return;

    await createOrder.mutateAsync({
      order_ref: orderRef || undefined,
      notes: notes || undefined,
      lines: validLines.map((l) => ({
        supply_item_id: l.supply_item_id,
        qty_ordered: l.qty_ordered,
        unit_cost: l.unit_cost,
      })),
    });
    setOrderRef("");
    setNotes("");
    setLines([{ supply_item_id: "", qty_ordered: 1, unit_cost: undefined }]);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuovo ordine di acquisto</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Riferimento ordine (opzionale)</Label>
            <Input value={orderRef} onChange={(e) => setOrderRef(e.target.value)} placeholder="Es. PO-2024-001" />
          </div>
          <div className="space-y-1">
            <Label>Note (opzionale)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Righe ordine</Label>
            {lines.map((line, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select
                    value={line.supply_item_id}
                    onValueChange={(v) => updateLine(index, "supply_item_id", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Articolo" />
                    </SelectTrigger>
                    <SelectContent>
                      {items?.map((item) => (
                        <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  type="number"
                  min={1}
                  value={line.qty_ordered}
                  onChange={(e) => updateLine(index, "qty_ordered", parseInt(e.target.value) || 1)}
                  className="w-20"
                  placeholder="Qtà"
                />
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={line.unit_cost ?? ""}
                  onChange={(e) => updateLine(index, "unit_cost", e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-24"
                  placeholder="Prezzo"
                />
                {lines.length > 1 && (
                  <Button variant="ghost" size="icon-xs" onClick={() => removeLine(index)}>
                    <Trash2 />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={addLine} className="h-7 text-xs">
              <Plus className="mr-1 h-3 w-3" />
              Aggiungi riga
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annulla</Button>
          <Button onClick={handleCreate} disabled={createOrder.isPending}>
            {createOrder.isPending ? "Creazione..." : "Crea ordine"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
