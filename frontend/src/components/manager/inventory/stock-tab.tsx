"use client";

import { useState } from "react";
import { useInventoryStock, useUpdateStock } from "@/hooks/use-inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";

export function StockTab() {
  const { data: stock, isLoading } = useInventoryStock();
  const updateStock = useUpdateStock();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<{ id: string; name: string } | null>(null);
  const [form, setForm] = useState({ qty_on_hand: 0, reorder_point: 0, notes: "" });

  function openAdjust(item: { supply_item_id: string; supply_item: { name: string }; qty_on_hand: number; reorder_point: number }) {
    setEditItem({ id: item.supply_item_id, name: item.supply_item.name });
    setForm({ qty_on_hand: item.qty_on_hand, reorder_point: item.reorder_point, notes: "" });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!editItem) return;
    await updateStock.mutateAsync({
      supplyItemId: editItem.id,
      qty_on_hand: form.qty_on_hand,
      reorder_point: form.reorder_point,
      notes: form.notes || undefined,
    });
    setDialogOpen(false);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Magazzino</h3>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Caricamento...</p>
      ) : !stock?.length ? (
        <p className="text-sm text-muted-foreground">Nessun articolo in magazzino. Aggiungi articoli nel Catalogo.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Articolo</TableHead>
                <TableHead className="text-right">Giacenza</TableHead>
                <TableHead className="text-right">Punto riordino</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {stock.map((item) => {
                const low = item.qty_on_hand <= item.reorder_point;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.supply_item.name}
                      <span className="ml-1 text-xs text-muted-foreground">({item.supply_item.unit})</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{item.qty_on_hand}</TableCell>
                    <TableCell className="text-right tabular-nums">{item.reorder_point}</TableCell>
                    <TableCell>
                      {low ? (
                        <Badge variant="destructive">Sotto soglia</Badge>
                      ) : (
                        <Badge variant="outline">OK</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon-xs" onClick={() => openAdjust(item)}>
                        <Pencil />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rettifica stock — {editItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Giacenza attuale</Label>
              <Input
                type="number"
                min={0}
                value={form.qty_on_hand}
                onChange={(e) => setForm({ ...form, qty_on_hand: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1">
              <Label>Punto riordino</Label>
              <Input
                type="number"
                min={0}
                value={form.reorder_point}
                onChange={(e) => setForm({ ...form, reorder_point: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1">
              <Label>Note (opzionale)</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Es. Inventario fisico"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleSave} disabled={updateStock.isPending}>
              {updateStock.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
