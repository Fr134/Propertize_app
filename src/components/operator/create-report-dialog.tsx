"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createReportSchema, type CreateReportInput } from "@/lib/validators";
import { useCreateReport } from "@/hooks/use-reports";
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
import { AlertTriangle } from "lucide-react";

interface CreateReportDialogProps {
  propertyId: string;
  taskId?: string;
}

export function CreateReportDialog({ propertyId, taskId }: CreateReportDialogProps) {
  const [open, setOpen] = useState(false);
  const createReport = useCreateReport();

  const form = useForm<CreateReportInput>({
    resolver: zodResolver(createReportSchema),
    defaultValues: {
      property_id: propertyId,
      task_id: taskId,
      title: "",
      description: "",
      category: "MANUTENZIONE",
      priority: "MEDIA",
    },
  });

  async function onSubmit(data: CreateReportInput) {
    try {
      await createReport.mutateAsync(data);
      form.reset({ ...form.getValues(), title: "", description: "" });
      setOpen(false);
    } catch {
      // error shown via mutation state
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <AlertTriangle className="mr-2 h-4 w-4" />
          Segnala problema
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuova segnalazione</DialogTitle>
          <DialogDescription>
            Segnala un danno, un problema di manutenzione o un oggetto mancante.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Titolo</Label>
            <Input placeholder="Es. Rubinetto che perde" {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={form.watch("category")}
                onValueChange={(v) => form.setValue("category", v as CreateReportInput["category"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DANNO">Danno</SelectItem>
                  <SelectItem value="MANUTENZIONE">Manutenzione</SelectItem>
                  <SelectItem value="OGGETTO_MANCANTE">Oggetto mancante</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priorita</Label>
              <Select
                value={form.watch("priority")}
                onValueChange={(v) => form.setValue("priority", v as CreateReportInput["priority"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BASSA">Bassa</SelectItem>
                  <SelectItem value="MEDIA">Media</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrizione</Label>
            <Textarea
              placeholder="Descrivi il problema in dettaglio..."
              {...form.register("description")}
              rows={3}
            />
            {form.formState.errors.description && (
              <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          {createReport.isError && (
            <p className="text-sm text-destructive">{createReport.error.message}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annulla</Button>
            <Button type="submit" disabled={createReport.isPending}>
              {createReport.isPending ? "Invio..." : "Invia segnalazione"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
