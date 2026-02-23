"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Save, X } from "lucide-react";
import type { ApplianceItem } from "@/hooks/use-masterfile";

interface ApplianceCardProps {
  appliance: ApplianceItem;
  index: number;
  onSave: (index: number, updated: ApplianceItem) => void;
  onDelete: (index: number) => void;
}

export function ApplianceCard({ appliance, index, onSave, onDelete }: ApplianceCardProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ApplianceItem>(appliance);

  function startEdit() {
    setForm({ ...appliance });
    setEditing(true);
  }

  function handleSave() {
    onSave(index, form);
    setEditing(false);
  }

  function update(field: keyof ApplianceItem, value: string | number | null) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  if (!editing) {
    return (
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-sm">{appliance.type}</p>
              {(appliance.brand || appliance.model) && (
                <p className="text-xs text-muted-foreground">
                  {[appliance.brand, appliance.model].filter(Boolean).join(" — ")}
                </p>
              )}
              {appliance.serial && (
                <p className="text-xs text-muted-foreground">S/N: {appliance.serial}</p>
              )}
              {appliance.notes && (
                <p className="text-xs text-muted-foreground mt-1">{appliance.notes}</p>
              )}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={startEdit}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Elimina elettrodomestico?</AlertDialogTitle>
                    <AlertDialogDescription>
                      &quot;{appliance.type}&quot; verrà rimosso dal masterfile.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(index)}>Elimina</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="ring-2 ring-primary/20">
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Tipo *</Label>
            <Input
              value={form.type}
              onChange={(e) => update("type", e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Marca</Label>
            <Input
              value={form.brand ?? ""}
              onChange={(e) => update("brand", e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Modello</Label>
            <Input
              value={form.model ?? ""}
              onChange={(e) => update("model", e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Seriale</Label>
            <Input
              value={form.serial ?? ""}
              onChange={(e) => update("serial", e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Anno acquisto</Label>
            <Input
              type="number"
              value={form.purchase_year ?? ""}
              onChange={(e) =>
                update("purchase_year", e.target.value ? parseInt(e.target.value) : null)
              }
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Scadenza garanzia</Label>
            <Input
              value={form.warranty_expiry ?? ""}
              onChange={(e) => update("warranty_expiry", e.target.value)}
              className="text-sm"
              placeholder="es. 2026-12"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Note</Label>
          <Textarea
            value={form.notes ?? ""}
            onChange={(e) => update("notes", e.target.value)}
            className="text-sm"
            rows={2}
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave}>
            <Save className="mr-1.5 h-3.5 w-3.5" /> Salva
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            <X className="mr-1.5 h-3.5 w-3.5" /> Annulla
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
