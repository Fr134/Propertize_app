"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createOwnerSchema, type CreateOwnerInput } from "@/lib/validators";
import { useCreateOwner } from "@/hooks/use-owners";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewOwnerPage() {
  const router = useRouter();
  const createOwner = useCreateOwner();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateOwnerInput>({
    resolver: zodResolver(createOwnerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      fiscal_code: "",
      iban: "",
      notes: "",
    },
  });

  async function onSubmit(data: CreateOwnerInput) {
    try {
      const owner = await createOwner.mutateAsync(data);
      toast({ title: "Proprietario creato" });
      router.push(`/manager/owners/${owner.id}`);
    } catch (err) {
      toast({
        title: "Errore",
        description: err instanceof Error ? err.message : "Errore nella creazione",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/manager/owners">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Nuovo proprietario</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dati proprietario</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" {...register("name")} />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input id="phone" {...register("phone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Indirizzo</Label>
                <Input id="address" {...register("address")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fiscal_code">Codice fiscale</Label>
                <Input id="fiscal_code" {...register("fiscal_code")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="iban">IBAN</Label>
                <Input id="iban" {...register("iban")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea id="notes" {...register("notes")} rows={3} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={createOwner.isPending}>
                {createOwner.isPending ? "Salvataggio..." : "Crea proprietario"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/manager/owners">Annulla</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
