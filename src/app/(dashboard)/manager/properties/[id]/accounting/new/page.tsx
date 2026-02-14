"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useProperty } from "@/hooks/use-properties";
import { useCreateExpense } from "@/hooks/use-expenses";
import { useUploadThing } from "@/lib/uploadthing-client";
import { fetchJson } from "@/lib/fetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Upload, Loader2, X } from "lucide-react";

export default function NewExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: propertyId } = use(params);
  const { data: property, isLoading } = useProperty(propertyId);
  const createExpense = useCreateExpense(propertyId);
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromOverview = searchParams.get("from") === "overview";
  const { toast } = useToast();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [vatAmount, setVatAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { startUpload, isUploading } = useUploadThing("expensePhoto");

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Caricamento...</p>;
  }

  if (!property) {
    return <p className="text-sm text-destructive">Immobile non trovato.</p>;
  }

  function handleAddPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPhotos((prev) => [...prev, ...files].slice(0, 10));
    e.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const parsedAmount = parseFloat(amount);
      const parsedVat = vatAmount ? parseFloat(vatAmount) : undefined;

      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        toast({ variant: "destructive", title: "Importo non valido" });
        setSubmitting(false);
        return;
      }

      if (parsedVat !== undefined && parsedVat > parsedAmount) {
        toast({
          variant: "destructive",
          title: "L'IVA non può superare l'importo totale",
        });
        setSubmitting(false);
        return;
      }

      // 1. Create the expense
      const expense = (await createExpense.mutateAsync({
        description,
        amount: parsedAmount,
        vat_amount: parsedVat,
        expense_date: expenseDate,
      })) as { id: string };

      // 2. Upload photos if any
      if (photos.length > 0) {
        const uploadResults = await startUpload(photos);
        if (uploadResults) {
          for (const result of uploadResults) {
            await fetchJson(`/api/expenses/${expense.id}/photos`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ photoUrl: result.ufsUrl }),
            });
          }
        }
      }

      toast({
        variant: "success",
        title: "Spesa registrata",
        description: `Spesa di ${parsedAmount.toFixed(2)}€ aggiunta.`,
      });

      router.push(
        fromOverview
          ? "/manager/accounting"
          : `/manager/properties/${propertyId}/accounting`
      );
    } catch (error) {
      console.error("Errore creazione spesa:", error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Si è verificato un errore durante la registrazione.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const busy = submitting || isUploading;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link
            href={
              fromOverview
                ? "/manager/accounting"
                : `/manager/properties/${propertyId}/accounting`
            }
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuova spesa</h1>
          <p className="text-sm text-muted-foreground">
            {property.name} — {property.code}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dettagli spesa</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="description">Descrizione *</Label>
              <Textarea
                id="description"
                placeholder="Descrivi la spesa..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="amount">Importo (€) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="vatAmount">IVA (€)</Label>
                <Input
                  id="vatAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={vatAmount}
                  onChange={(e) => setVatAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="expenseDate">Data spesa</Label>
              <Input
                id="expenseDate"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Photo attachments */}
            <div>
              <Label>Allegati foto (max 10)</Label>
              <div className="mt-2">
                {photos.length > 0 && (
                  <div className="mb-3 flex gap-2 flex-wrap">
                    {photos.map((file, i) => (
                      <div key={i} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Anteprima ${i + 1}`}
                          className="h-16 w-16 rounded object-cover border"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute -top-1 -right-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {photos.length < 10 && (
                  <label className="inline-flex cursor-pointer">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleAddPhotos}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="pointer-events-none"
                    >
                      <Upload className="mr-2 h-3 w-3" />
                      Aggiungi foto
                    </Button>
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" asChild>
                <Link
                  href={
                    fromOverview
                      ? "/manager/accounting"
                      : `/manager/properties/${propertyId}/accounting`
                  }
                >
                  Annulla
                </Link>
              </Button>
              <Button type="submit" disabled={busy || !description || !amount}>
                {busy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isUploading ? "Upload foto..." : "Salvataggio..."}
                  </>
                ) : (
                  "Registra spesa"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
