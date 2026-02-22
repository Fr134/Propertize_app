"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createInventoryItemSchema } from "@/lib/validators";
import type { InventoryItem } from "@/hooks/use-masterfile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Save } from "lucide-react";
import { z } from "zod";

type FormData = z.input<typeof createInventoryItemSchema>;

const ROOM_SUGGESTIONS = [
  "Cucina",
  "Soggiorno",
  "Camera 1",
  "Camera 2",
  "Bagno",
  "Bagno 2",
  "Terrazzo",
  "Lavanderia",
  "Ingresso",
];

const CONDITIONS = [
  { value: "GOOD", label: "Buono" },
  { value: "DAMAGED", label: "Danneggiato" },
  { value: "BROKEN", label: "Rotto" },
  { value: "REPLACED", label: "Sostituito" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  isSaving: boolean;
}

export function InventoryItemSheet({
  open,
  onOpenChange,
  item,
  onSave,
  isSaving,
}: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(createInventoryItemSchema),
    defaultValues: {
      room: "",
      name: "",
      brand: "",
      model: "",
      serial_number: "",
      purchase_date: "",
      warranty_expires: "",
      notes: "",
      photo_url: "",
      condition: "GOOD",
    },
  });

  useEffect(() => {
    if (open) {
      if (item) {
        form.reset({
          room: item.room,
          name: item.name,
          brand: item.brand ?? "",
          model: item.model ?? "",
          serial_number: item.serial_number ?? "",
          purchase_date: item.purchase_date
            ? item.purchase_date.slice(0, 10)
            : "",
          warranty_expires: item.warranty_expires
            ? item.warranty_expires.slice(0, 10)
            : "",
          notes: item.notes ?? "",
          photo_url: item.photo_url ?? "",
          condition: item.condition,
        });
      } else {
        form.reset({
          room: "",
          name: "",
          brand: "",
          model: "",
          serial_number: "",
          purchase_date: "",
          warranty_expires: "",
          notes: "",
          photo_url: "",
          condition: "GOOD",
        });
      }
    }
  }, [open, item, form]);

  async function onSubmit(values: FormData) {
    await onSave(values);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {item ? "Modifica oggetto" : "Nuovo oggetto"}
          </SheetTitle>
        </SheetHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-6 space-y-4"
        >
          <div>
            <Label>Stanza *</Label>
            <Input
              {...form.register("room")}
              list="room-suggestions"
              placeholder="es. Cucina"
            />
            <datalist id="room-suggestions">
              {ROOM_SUGGESTIONS.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
            {form.formState.errors.room && (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.room.message}
              </p>
            )}
          </div>

          <div>
            <Label>Nome oggetto *</Label>
            <Input
              {...form.register("name")}
              placeholder="es. Frigorifero"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Marca</Label>
              <Input {...form.register("brand")} />
            </div>
            <div>
              <Label>Modello</Label>
              <Input {...form.register("model")} />
            </div>
          </div>

          <div>
            <Label>Numero seriale</Label>
            <Input {...form.register("serial_number")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data acquisto</Label>
              <Input type="date" {...form.register("purchase_date")} />
            </div>
            <div>
              <Label>Scadenza garanzia</Label>
              <Input type="date" {...form.register("warranty_expires")} />
            </div>
          </div>

          <div>
            <Label>Condizione</Label>
            <Select
              value={form.watch("condition")}
              onValueChange={(v) =>
                form.setValue("condition", v as FormData["condition"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONDITIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Note</Label>
            <Textarea {...form.register("notes")} rows={3} />
          </div>

          <Button type="submit" className="w-full" disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {item ? "Aggiorna" : "Crea"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
