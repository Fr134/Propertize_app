"use client";

import { useState } from "react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCreateLead } from "@/hooks/use-leads";
import { LEAD_SOURCE_LABELS, PROPERTY_TYPE_LABELS } from "./constants";

interface CreateLeadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateLeadSheet({ open, onOpenChange }: CreateLeadSheetProps) {
  const createLead = useCreateLead();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    property_address: "",
    property_type: "" as string,
    estimated_rooms: "",
    notes: "",
    source: "MANUAL" as string,
  });

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createLead.mutateAsync({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        property_address: form.property_address || undefined,
        property_type: (form.property_type || undefined) as "APPARTAMENTO" | "VILLA" | "ALTRO" | undefined,
        estimated_rooms: form.estimated_rooms ? parseInt(form.estimated_rooms) : undefined,
        notes: form.notes || undefined,
        source: form.source as "MANUAL" | "REFERRAL" | "SOCIAL" | "WEBSITE" | "OTHER",
      });
      onOpenChange(false);
      setForm({
        first_name: "", last_name: "", email: "", phone: "",
        property_address: "", property_type: "", estimated_rooms: "",
        notes: "", source: "MANUAL",
      });
    } catch {
      // error via mutation state
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nuovo lead</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nome *</Label>
              <Input
                value={form.first_name}
                onChange={(e) => updateField("first_name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cognome *</Label>
              <Input
                value={form.last_name}
                onChange={(e) => updateField("last_name", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Telefono</Label>
            <Input
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Indirizzo immobile</Label>
            <Input
              value={form.property_address}
              onChange={(e) => updateField("property_address", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tipo immobile</Label>
              <Select
                value={form.property_type || "none"}
                onValueChange={(v) => updateField("property_type", v === "none" ? "" : v)}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Seleziona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">--</SelectItem>
                  {Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Camere stimate</Label>
              <Input
                type="number"
                min={0}
                value={form.estimated_rooms}
                onChange={(e) => updateField("estimated_rooms", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Fonte</Label>
            <Select
              value={form.source}
              onValueChange={(v) => updateField("source", v)}
            >
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LEAD_SOURCE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Note</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={3}
            />
          </div>

          {createLead.isError && (
            <p className="text-sm text-destructive">{createLead.error.message}</p>
          )}

          <Button type="submit" disabled={createLead.isPending} className="w-full">
            {createLead.isPending ? "Creazione..." : "Crea lead"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
