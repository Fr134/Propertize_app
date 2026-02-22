"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateOwnerSchema, type UpdateOwnerInput } from "@/lib/validators";
import { useOwner, useUpdateOwner, useDeleteOwner } from "@/hooks/use-owners";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Pencil, Trash2, Building2, X } from "lucide-react";

export default function OwnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: owner, isLoading } = useOwner(id);
  const updateOwner = useUpdateOwner();
  const deleteOwner = useDeleteOwner();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);

  const form = useForm<UpdateOwnerInput>({
    resolver: zodResolver(updateOwnerSchema),
  });

  function startEdit() {
    if (!owner) return;
    form.reset({
      name: owner.name,
      email: owner.email ?? "",
      phone: owner.phone ?? "",
      address: owner.address ?? "",
      fiscal_code: owner.fiscal_code ?? "",
      iban: owner.iban ?? "",
      notes: owner.notes ?? "",
    });
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    form.reset();
  }

  async function onSubmit(data: UpdateOwnerInput) {
    try {
      await updateOwner.mutateAsync({ id, data });
      toast({ title: "Proprietario aggiornato" });
      setEditing(false);
    } catch (err) {
      toast({
        title: "Errore",
        description: err instanceof Error ? err.message : "Errore nel salvataggio",
        variant: "destructive",
      });
    }
  }

  async function handleDelete() {
    try {
      await deleteOwner.mutateAsync(id);
      toast({ title: "Proprietario eliminato" });
      router.push("/manager/owners");
    } catch (err) {
      toast({
        title: "Errore",
        description: err instanceof Error ? err.message : "Impossibile eliminare",
        variant: "destructive",
      });
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Caricamento...</p>;
  if (!owner) return <p className="text-sm text-destructive">Proprietario non trovato.</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/manager/owners">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{owner.name}</h1>
        </div>
        <Badge variant={owner.status === "active" ? "default" : "secondary"}>
          {owner.status === "active" ? "Attivo" : "Inattivo"}
        </Badge>
        {!editing && (
          <Button variant="outline" size="sm" onClick={startEdit}>
            <Pencil className="mr-2 h-3 w-3" />
            Modifica
          </Button>
        )}
        {editing && (
          <Button variant="ghost" size="sm" onClick={cancelEdit}>
            <X className="mr-2 h-3 w-3" />
            Annulla
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-3 w-3" />
              Elimina
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sei sicuro di voler eliminare questo proprietario?</AlertDialogTitle>
              <AlertDialogDescription>
                Questa azione non può essere annullata. Il proprietario verrà rimosso dal sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleteOwner.isPending}>
                {deleteOwner.isPending ? "Eliminazione..." : "Elimina"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Owner details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dati proprietario</CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome *</Label>
                  <Input id="name" {...form.register("name")} />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...form.register("email")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Telefono</Label>
                  <Input id="phone" {...form.register("phone")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="address">Indirizzo</Label>
                  <Input id="address" {...form.register("address")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fiscal_code">Codice fiscale</Label>
                  <Input id="fiscal_code" {...form.register("fiscal_code")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="iban">IBAN</Label>
                  <Input id="iban" {...form.register("iban")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="notes">Note</Label>
                  <Textarea id="notes" {...form.register("notes")} rows={3} />
                </div>
                <Button type="submit" disabled={updateOwner.isPending} className="mt-2">
                  {updateOwner.isPending ? "Salvataggio..." : "Salva modifiche"}
                </Button>
              </form>
            ) : (
              <dl className="space-y-3 text-sm">
                <DetailRow label="Email" value={owner.email} />
                <DetailRow label="Telefono" value={owner.phone} />
                <DetailRow label="Indirizzo" value={owner.address} />
                <DetailRow label="Codice fiscale" value={owner.fiscal_code} />
                <DetailRow label="IBAN" value={owner.iban} />
                <DetailRow label="Note" value={owner.notes} />
              </dl>
            )}
          </CardContent>
        </Card>

        {/* Properties */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                Immobili ({owner.properties.length})
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/manager/properties/new?owner_id=${id}`}>Aggiungi immobile</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {owner.properties.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessun immobile collegato.</p>
            ) : (
              <div className="space-y-2">
                {owner.properties.map((prop) => (
                  <Link
                    key={prop.id}
                    href={`/manager/properties/${prop.id}`}
                    className="flex items-center justify-between rounded-md border p-3 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{prop.name}</p>
                      <p className="text-xs text-muted-foreground">{prop.code}</p>
                    </div>
                    <Badge variant={prop.active ? "default" : "secondary"} className="text-xs">
                      {prop.active ? "Attivo" : "Inattivo"}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value || "—"}</dd>
    </div>
  );
}
