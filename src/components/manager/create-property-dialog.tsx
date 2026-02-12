"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPropertySchema, type CreatePropertyInput } from "@/lib/validators";
import { useCreateProperty } from "@/hooks/use-properties";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

export function CreatePropertyDialog() {
  const [open, setOpen] = useState(false);
  const createProperty = useCreateProperty();
  const { toast } = useToast();

  const form = useForm<CreatePropertyInput>({
    resolver: zodResolver(createPropertySchema),
    defaultValues: {
      name: "",
      code: "",
      address: "",
      property_type: "APPARTAMENTO",
    },
  });

  async function onSubmit(data: CreatePropertyInput) {
    try {
      await createProperty.mutateAsync(data);

      toast({
        variant: "success",
        title: "Immobile creato!",
        description: `Immobile "${data.name}" aggiunto con successo.`,
      });

      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Errore creazione immobile:", error);

      toast({
        variant: "destructive",
        title: "Errore",
        description: "Si è verificato un errore durante la creazione dell'immobile.",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuovo immobile
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuovo immobile</DialogTitle>
          <DialogDescription>
            Inserisci i dati del nuovo immobile.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Es. Appartamento Centro Storico"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Codice</Label>
              <Input
                id="code"
                placeholder="Es. APT-001"
                {...form.register("code")}
              />
              {form.formState.errors.code && (
                <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="property_type">Tipologia</Label>
              <Select
                value={form.watch("property_type")}
                onValueChange={(v) => form.setValue("property_type", v as CreatePropertyInput["property_type"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPARTAMENTO">Appartamento</SelectItem>
                  <SelectItem value="VILLA">Villa</SelectItem>
                  <SelectItem value="ALTRO">Altro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Indirizzo</Label>
            <Input
              id="address"
              placeholder="Es. Via Roma 15, 00100 Roma"
              {...form.register("address")}
            />
            {form.formState.errors.address && (
              <p className="text-xs text-destructive">{form.formState.errors.address.message}</p>
            )}
          </div>

          {createProperty.isError && (
            <p className="text-sm text-destructive">
              {createProperty.error.message}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={createProperty.isPending}>
              {createProperty.isPending ? "Creazione..." : "Crea immobile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
