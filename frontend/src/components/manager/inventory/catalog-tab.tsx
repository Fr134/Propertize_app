"use client";

import { useState } from "react";
import { useSupplyItems, useCreateSupplyItem, useUpdateSupplyItem } from "@/hooks/use-inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil } from "lucide-react";

export function CatalogTab() {
  const { data: items, isLoading } = useSupplyItems();
  const createItem = useCreateSupplyItem();
  const updateItem = useUpdateSupplyItem();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", sku: "", unit: "pz" });

  function openCreate() {
    setEditId(null);
    setForm({ name: "", sku: "", unit: "pz" });
    setDialogOpen(true);
  }

  function openEdit(item: { id: string; name: string; sku: string | null; unit: string }) {
    setEditId(item.id);
    setForm({ name: item.name, sku: item.sku ?? "", unit: item.unit });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (editId) {
      await updateItem.mutateAsync({ id: editId, ...form });
    } else {
      await createItem.mutateAsync(form);
    }
    setDialogOpen(false);
  }

  async function toggleActive(id: string, currentActive: boolean) {
    await updateItem.mutateAsync({ id, is_active: !currentActive });
  }

  const isPending = createItem.isPending || updateItem.isPending;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Catalogo Articoli</h3>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuovo articolo
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Caricamento...</p>
      ) : !items?.length ? (
        <p className="text-sm text-muted-foreground">Nessun articolo. Crea il primo.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Unità</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.sku || "—"}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>
                    <button type="button" onClick={() => toggleActive(item.id, item.is_active)}>
                      <Badge variant={item.is_active ? "default" : "outline"}>
                        {item.is_active ? "Attivo" : "Disattivato"}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon-xs" onClick={() => openEdit(item)}>
                      <Pencil />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Modifica articolo" : "Nuovo articolo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>SKU (opzionale)</Label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Unità di misura</Label>
              <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleSave} disabled={isPending || !form.name.trim()}>
              {isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
