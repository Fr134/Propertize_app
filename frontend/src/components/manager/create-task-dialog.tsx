"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTaskSchema, type CreateTaskInput } from "@/lib/validators";
import { useCreateTask } from "@/hooks/use-tasks";
import { useProperties } from "@/hooks/use-properties";
import { useOperators } from "@/hooks/use-users";
import { useExternalContacts, useCreateExternalContact } from "@/hooks/use-external-contacts";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const TASK_TYPES = [
  { value: "CLEANING", label: "Pulizia", emoji: "🧹" },
  { value: "PREPARATION", label: "Preparazione", emoji: "🏠" },
  { value: "MAINTENANCE", label: "Manutenzione", emoji: "🔧" },
  { value: "INSPECTION", label: "Ispezione", emoji: "🔍" },
  { value: "KEY_HANDOVER", label: "Consegna chiavi", emoji: "🗝️" },
  { value: "OTHER", label: "Altro", emoji: "📋" },
];

const CONTACT_CATEGORIES = [
  { value: "PLUMBER", label: "Idraulico" },
  { value: "ELECTRICIAN", label: "Elettricista" },
  { value: "CLEANER", label: "Pulizie" },
  { value: "HANDYMAN", label: "Tuttofare" },
  { value: "INSPECTOR", label: "Ispettore" },
  { value: "OTHER", label: "Altro" },
];

export function CreateTaskDialog() {
  const [open, setOpen] = useState(false);
  const [contactSheetOpen, setContactSheetOpen] = useState(false);
  const createTask = useCreateTask();
  const { data: properties } = useProperties();
  const { data: operators } = useOperators();
  const { data: contacts } = useExternalContacts();
  const createContact = useCreateExternalContact();
  const { toast } = useToast();

  const form = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      property_id: "",
      task_type: "CLEANING",
      assigned_to: "",
      scheduled_date: new Date().toISOString().split("T")[0],
      assignee_type: "INTERNAL",
      can_use_supplies: true,
      notes: "",
    },
  });

  const taskType = form.watch("task_type") ?? "CLEANING";
  const isCleaning = taskType === "CLEANING";
  const assigneeType = form.watch("assignee_type") ?? "INTERNAL";

  // Quick-create contact form
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactCompany, setNewContactCompany] = useState("");
  const [newContactCategory, setNewContactCategory] = useState("OTHER");

  async function onSubmit(data: CreateTaskInput) {
    try {
      await createTask.mutateAsync(data);
      toast({
        variant: "success",
        title: "Task creato!",
        description: isCleaning
          ? "La task di pulizia è stata assegnata con successo."
          : "Il task è stato creato con successo.",
      });
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Errore creazione task:", error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Si è verificato un errore durante la creazione del task.",
      });
    }
  }

  async function handleCreateContact() {
    if (!newContactName.trim()) return;
    try {
      const contact = await createContact.mutateAsync({
        name: newContactName,
        phone: newContactPhone,
        company: newContactCompany,
        category: newContactCategory as "PLUMBER" | "ELECTRICIAN" | "CLEANER" | "HANDYMAN" | "INSPECTOR" | "OTHER",
      });
      form.setValue("external_assignee_id", contact.id);
      setContactSheetOpen(false);
      setNewContactName("");
      setNewContactPhone("");
      setNewContactCompany("");
      setNewContactCategory("OTHER");
    } catch {
      toast({ variant: "destructive", title: "Errore creazione contatto" });
    }
  }

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) form.reset();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuovo task
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuovo task</DialogTitle>
            <DialogDescription>
              Seleziona il tipo di task e compila i dettagli.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Step 1: Common fields */}
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
                <p className="text-xs text-destructive">
                  {form.formState.errors.property_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tipo task</Label>
              <div className="grid grid-cols-3 gap-2">
                {TASK_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      form.setValue("task_type", t.value as CreateTaskInput["task_type"]);
                      // Reset type-specific fields
                      if (t.value === "CLEANING") {
                        form.setValue("assignee_type", "INTERNAL");
                        form.setValue("can_use_supplies", true);
                        form.setValue("title", undefined);
                      } else {
                        form.setValue("can_use_supplies", t.value === "PREPARATION");
                      }
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-md border p-2 text-xs transition-colors",
                      taskType === t.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <span className="text-lg">{t.emoji}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Data programmata</Label>
              <Input type="date" {...form.register("scheduled_date")} />
              {form.formState.errors.scheduled_date && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.scheduled_date.message}
                </p>
              )}
            </div>

            {/* Step 2: Conditional fields */}
            {isCleaning ? (
              /* CLEANING: existing operator select */
              <div className="space-y-2">
                <Label>Operatrice</Label>
                <Select
                  value={form.watch("assigned_to") ?? ""}
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
                  <p className="text-xs text-destructive">
                    {form.formState.errors.assigned_to.message}
                  </p>
                )}
              </div>
            ) : (
              /* Non-CLEANING: extended form */
              <>
                <div className="space-y-2">
                  <Label>Titolo *</Label>
                  <Input
                    {...form.register("title")}
                    placeholder="es. Riparazione perdita bagno"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Ora inizio</Label>
                    <Input type="time" {...form.register("start_time")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Ora fine</Label>
                    <Input type="time" {...form.register("end_time")} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Assegnato a</Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        form.setValue("assignee_type", "INTERNAL");
                        form.setValue("external_assignee_id", undefined);
                      }}
                      className={cn(
                        "flex-1 rounded-md border px-3 py-2 text-sm transition-colors",
                        assigneeType === "INTERNAL"
                          ? "border-primary bg-primary/5 text-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      Membro del team
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        form.setValue("assignee_type", "EXTERNAL");
                        form.setValue("assigned_to", undefined);
                      }}
                      className={cn(
                        "flex-1 rounded-md border px-3 py-2 text-sm transition-colors",
                        assigneeType === "EXTERNAL"
                          ? "border-primary bg-primary/5 text-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      Tecnico esterno
                    </button>
                  </div>
                </div>

                {assigneeType === "INTERNAL" ? (
                  <div className="space-y-2">
                    <Select
                      value={form.watch("assigned_to") ?? ""}
                      onValueChange={(v) => form.setValue("assigned_to", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona operatore" />
                      </SelectTrigger>
                      <SelectContent>
                        {operators?.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.first_name} {o.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Select
                        value={form.watch("external_assignee_id") ?? ""}
                        onValueChange={(v) =>
                          form.setValue("external_assignee_id", v)
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Seleziona contatto" />
                        </SelectTrigger>
                        <SelectContent>
                          {contacts?.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                              {c.company ? ` (${c.company})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setContactSheetOpen(true)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    {form.formState.errors.external_assignee_id && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.external_assignee_id.message}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between rounded-md border p-3">
                  <Label className="cursor-pointer">Usa scorte</Label>
                  <Switch
                    checked={form.watch("can_use_supplies") ?? false}
                    onCheckedChange={(v) => form.setValue("can_use_supplies", v)}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Note (opzionale)</Label>
              <Textarea
                placeholder="Note aggiuntive..."
                {...form.register("notes")}
                rows={2}
              />
            </div>

            {createTask.isError && (
              <p className="text-sm text-destructive">
                {createTask.error.message}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={createTask.isPending}>
                {createTask.isPending ? "Creazione..." : "Crea task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick-create contact Sheet */}
      <Sheet open={contactSheetOpen} onOpenChange={setContactSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nuovo contatto esterno</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
              />
            </div>
            <div>
              <Label>Telefono</Label>
              <Input
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
              />
            </div>
            <div>
              <Label>Azienda</Label>
              <Input
                value={newContactCompany}
                onChange={(e) => setNewContactCompany(e.target.value)}
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select
                value={newContactCategory}
                onValueChange={setNewContactCategory}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={handleCreateContact}
              disabled={!newContactName.trim() || createContact.isPending}
            >
              {createContact.isPending ? "Creazione..." : "Crea contatto"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
