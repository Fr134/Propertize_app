"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTaskSchema, type CreateTaskInput } from "@/lib/validators";
import { useCreateTask } from "@/hooks/use-tasks";
import { useProperties } from "@/hooks/use-properties";
import { useOperators } from "@/hooks/use-users";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export function CreateTaskDialog() {
  const [open, setOpen] = useState(false);
  const createTask = useCreateTask();
  const { data: properties } = useProperties();
  const { data: operators } = useOperators();
  const { toast } = useToast();

  const form = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      property_id: "",
      assigned_to: "",
      scheduled_date: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  async function onSubmit(data: CreateTaskInput) {
    try {
      await createTask.mutateAsync(data);

      toast({
        variant: "success",
        title: "Task creata!",
        description: "La task di pulizia è stata assegnata con successo.",
      });

      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Errore creazione task:", error);

      toast({
        variant: "destructive",
        title: "Errore",
        description: "Si è verificato un errore durante la creazione della task.",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuovo task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuovo task di pulizia</DialogTitle>
          <DialogDescription>
            Assegna un task di pulizia a un&apos;operatrice.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Immobile</Label>
            <Select
              value={form.watch("property_id")}
              onValueChange={(v) => form.setValue("property_id", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona immobile" />
              </SelectTrigger>
              <SelectContent>
                {properties?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.property_id && (
              <p className="text-xs text-destructive">{form.formState.errors.property_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Operatrice</Label>
            <Select
              value={form.watch("assigned_to")}
              onValueChange={(v) => form.setValue("assigned_to", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona operatrice" />
              </SelectTrigger>
              <SelectContent>
                {operators?.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.first_name} {o.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.assigned_to && (
              <p className="text-xs text-destructive">{form.formState.errors.assigned_to.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Data programmata</Label>
            <Input
              type="date"
              {...form.register("scheduled_date")}
            />
            {form.formState.errors.scheduled_date && (
              <p className="text-xs text-destructive">{form.formState.errors.scheduled_date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Note (opzionale)</Label>
            <Textarea
              placeholder="Note aggiuntive per l'operatrice..."
              {...form.register("notes")}
              rows={2}
            />
          </div>

          {createTask.isError && (
            <p className="text-sm text-destructive">{createTask.error.message}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={createTask.isPending}>
              {createTask.isPending ? "Creazione..." : "Crea task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
